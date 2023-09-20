import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Transaction } from 'sequelize/types';
import { Installation } from '../../entities/installation.entity';
import { Logger } from '../../utils/logger';
import { SequelizeTransaction } from '../../utils/transaction.decorator';
import { CacheMethod } from '../../utils/cache.decorator';
import { CustomError } from '../../utils/CustomError';
import { ICacheService } from '../cache.service';
import { IOpenIDConfiguration } from './IOpenIdConfiguration';

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

const ONE_WEEK = 60 * 60 * 24 * 7;

export interface IInstallationService {
  getInstallation({
    instanceId,
    organizationId,
    transaction,
  }: {
    instanceId: string;
    organizationId: string;
    transaction?: Transaction;
  }): Promise<Installation>;
  getOpenIdConfiguration(input: string): Promise<IOpenIDConfiguration>;
  create(input: IInstallInstallationInput): Promise<Installation>;
  delete(input: IInstallationDeleteInput): Promise<IInstallationDeleteOutput>;
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

    const [outputInstallation, isCreated] = await this._installationRepository.upsert(input as any, { transaction });

    await this.purgeInstallationCache(input);

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

    const installation = await this.getInstallation({ instanceId, organizationId, transaction });

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

    await this.purgeInstallationCache(installation);

    return { success: true };
  }

  private async invalidateCache(key: string) {
    this._logger.info({ msg: 'invalidating cache', key });
    await this._cacheService.del(key);
  }

  private async purgeInstallationCache(input: Installation) {
    let key = `getInstallation(${JSON.stringify(input.instanceId)},${JSON.stringify(input.organizationId)})`;
    await this.invalidateCache(key);

    key = `getJwksUri(${JSON.stringify(input.openIdConfigurationUrl)})`;
    await this.invalidateCache(key);
  }

  @SequelizeTransaction()
  @CacheMethod({
    ttl: ONE_WEEK,
    keyBuilder: (args: any[]) => `getInstallation(${JSON.stringify(args[0].instanceId)},${JSON.stringify(args[0].organizationId)})`,
  })
  public async getInstallation({
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

  @CacheMethod({ ttl: ONE_WEEK })
  public async getOpenIdConfiguration(openIdConfigurationUrl: string): Promise<IOpenIDConfiguration> {
    this._logger.debug(`Getting open id conf client for ${openIdConfigurationUrl}`);

    const response = await fetch(openIdConfigurationUrl).catch((error) => {
      this._logger.error(`Error getting open id conf client for ${openIdConfigurationUrl}: ${error.message}`);

      return { ok: false, status: 500, statusText: error.message, json: () => undefined };
    });

    if (!response.ok) {
      throw new Error(`Error calling ${openIdConfigurationUrl} : unable to retrieve open id conf ${response.status} ${response.statusText}`);
    }

    const responseBody = await response.json();

    return responseBody;
  }
}
