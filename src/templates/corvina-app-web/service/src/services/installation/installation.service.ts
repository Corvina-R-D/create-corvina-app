import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Transaction } from 'sequelize';
import { Logger, SequelizeTransaction, CacheMethod, CustomError, ICacheService, addPeriod } from '@corvina/nestjs-app-common-lib';
import { Installation } from '../../entities/installation.entity';
import { getPaymentPlans, IPaymentPlanDTO } from '../../dtos/general-info/paymentPlan.dto';

export interface IGetInstallationInput {
  corvinaHost: string;
  organizationId: string;
  transaction?: Transaction;
}

export interface IInstallInstallationInput extends Installation {
  transaction?: Transaction;
}

export interface IInstallationDeleteInput {
  instanceId: string;
  organizationId: string;
  transaction?: Transaction;
}

export interface IInstallationDeleteOutput {
  success: boolean;
  message?: string;
}

export interface IInstallationRenewInput {
  instanceId: string;
  organizationId: string;
  endDate: Date;
  planId?: string;
  freeTrial?: boolean;
  transaction?: Transaction;
}

export interface IInstallationRenewOutput {
  success: boolean;
  message?: string;
}

const ONE_WEEK = 60 * 60 * 24 * 7;

/**
 * organizationId is a string in the requests but a BIGINT column, that the installation read from the db can carry as a number:
 * the key uses its string, or purging the cache with the ids of the installation would miss the key cached by a request.
 */
const getInstallationCacheKey = (instanceId: string, organizationId: string | number) =>
  `getInstallation(${JSON.stringify(instanceId)},${JSON.stringify(String(organizationId))})`;

// Fallback expiry used when a resolved plan has neither a recurrent nor a trial period (effectively "no expiry").
const FAR_FUTURE_END_DATE = new Date('2999-12-31T23:59:59Z');

export interface IInstallationService {
  /** cached: never read it inside a transaction that changes the installation, the cache would keep an uncommitted value */
  getInstallation({ instanceId, organizationId }: { instanceId: string; organizationId: string }): Promise<Installation>;
  create(input: IInstallInstallationInput): Promise<Installation>;
  delete(input: IInstallationDeleteInput): Promise<IInstallationDeleteOutput>;
  renew(input: IInstallationRenewInput): Promise<IInstallationRenewOutput>;
}

@Injectable()
export class InstallationService implements IInstallationService {
  private readonly _logger: Logger;

  private readonly _installationRepository: typeof Installation;

  private readonly _cacheService: ICacheService;

  constructor(logger: Logger, @InjectModel(Installation) installationRepository: typeof Installation, @Inject('ICacheService') cacheService: ICacheService) {
    this._logger = logger;
    this._installationRepository = installationRepository;
    this._cacheService = cacheService;
  }

  @SequelizeTransaction()
  async create(input: IInstallInstallationInput): Promise<Installation> {
    const { transaction } = input;

    const availablePaymentPlans = getPaymentPlans().filter((plan) => !plan.deprecated);
    const paymentPlan = input.planId ? availablePaymentPlans.find((plan) => plan.id === input.planId) : availablePaymentPlans[0];

    const installationInput = { ...input, planId: paymentPlan?.id ?? input.planId };

    if (!installationInput.endDate) {
      const { endDate, freeTrial } = this.resolvePlanEndDate(paymentPlan);
      installationInput.endDate = endDate;
      installationInput.freeTrial = freeTrial;
    }

    const [outputInstallation, isCreated] = await this._installationRepository.upsert(installationInput as any, { transaction });

    this.purgeInstallationCacheAfterCommit(input, transaction);

    this._logger.debug({
      msg: isCreated ? 'installation created' : 'installation updated',
      outputInstallation,
    });

    return outputInstallation;
  }

  @SequelizeTransaction()
  async delete(input: IInstallationDeleteInput): Promise<IInstallationDeleteOutput> {
    const { organizationId, instanceId, transaction } = input;

    this._logger.debug(`Unistallation instanceId ${instanceId} and orgId ${organizationId}`);

    const installation = await this.findInstallation({ instanceId, organizationId, transaction });

    if (!installation) {
      return { success: true, message: `Installation not found` };
    }

    const affected = await this._installationRepository.destroy({
      where: {
        instanceId,
        organizationId,
      },
      transaction,
    });

    if (affected <= 0) {
      throw new CustomError(701, 'I cannot delete the installation');
    }

    this._logger.info({ organizationId, instanceId }, `Unistallation completed successfully, ${affected} installations removed`);

    this.purgeInstallationCacheAfterCommit(installation, transaction);

    return { success: true };
  }

  @SequelizeTransaction()
  async renew(input: IInstallationRenewInput): Promise<IInstallationRenewOutput> {
    const { instanceId, organizationId, endDate, planId, freeTrial, transaction } = input;

    const installation = await this.findInstallation({ instanceId, organizationId, transaction });

    if (!installation) {
      return { success: false, message: `Installation not found` };
    }

    if (installation.endDate && installation.endDate > endDate) {
      throw new CustomError(702, 'The endDate is before the current one', { endDate, currentEndDate: installation.endDate });
    }

    const paymentPlans = getPaymentPlans();
    const paymentPlan = planId ? paymentPlans.find((plan) => plan.id === planId) : paymentPlans[0];

    await this._installationRepository.update(
      { endDate, planId: paymentPlan?.id ?? planId, freeTrial: freeTrial || false },
      { where: { instanceId, organizationId }, transaction }
    );

    this.purgeInstallationCacheAfterCommit(installation, transaction);

    return { success: true };
  }

  private resolvePlanEndDate(paymentPlan?: IPaymentPlanDTO): { endDate: Date; freeTrial: boolean } {
    const now = new Date();

    if (paymentPlan?.trial?.period) {
      return { endDate: addPeriod(now, paymentPlan.trial.period), freeTrial: true };
    }

    if (paymentPlan?.recurrent?.period) {
      return { endDate: addPeriod(now, paymentPlan.recurrent.period), freeTrial: false };
    }

    return { endDate: FAR_FUTURE_END_DATE, freeTrial: false };
  }

  private async invalidateCache(key: string) {
    this._logger.info({ msg: 'invalidating cache', key });
    await this._cacheService.del(key);
  }

  private async purgeInstallationCache(input: Pick<Installation, 'instanceId' | 'organizationId' | 'openIdConfigurationUrl'>) {
    await this.invalidateCache(getInstallationCacheKey(input.instanceId, input.organizationId));

    // CorvinaJwtService of common-lib caches the openid configuration of the realm by its url
    await this.invalidateCache(`getOpenIdConfiguration(${JSON.stringify(input.openIdConfigurationUrl)})`);
  }

  /**
   * Purges the cache once the transaction is committed: purged before, a concurrent getInstallation could
   * read the not yet committed change (e.g. the uninstalled installation still there) and cache it again.
   */
  private purgeInstallationCacheAfterCommit(input: Pick<Installation, 'instanceId' | 'organizationId' | 'openIdConfigurationUrl'>, transaction: Transaction) {
    transaction.afterCommit(async () => {
      // the change is committed: a cache failure must not fail it
      try {
        await this.purgeInstallationCache(input);
      } catch (error) {
        this._logger.error({ msg: 'Unable to purge the installation cache', instanceId: input.instanceId, organizationId: input.organizationId, error });
      }
    });
  }

  @CacheMethod({
    ttl: ONE_WEEK,
    keyBuilder: (args: any[]) => getInstallationCacheKey(args[0].instanceId, args[0].organizationId),
  })
  public async getInstallation({ instanceId, organizationId }: { instanceId: string; organizationId: string }): Promise<Installation> {
    return this.findInstallation({ instanceId, organizationId });
  }

  /** not cached, to read the installation inside a transaction */
  private async findInstallation({
    instanceId,
    organizationId,
    transaction,
  }: {
    instanceId: string;
    organizationId: string;
    transaction?: Transaction;
  }): Promise<Installation> {
    if (!instanceId || !organizationId) {
      throw new Error('instanceId and organizationId are required');
    }

    return this._installationRepository.findOne({
      where: {
        instanceId,
        organizationId,
      },
      transaction,
    });
  }
}
