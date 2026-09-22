import { Controller, Get, OnApplicationBootstrap } from '@nestjs/common';
import { getManifestJson, setManifestJson, IManifestDTO } from '../dtos/general-info/manifest.dto';
import { setPaymentPlans } from '../dtos/general-info/paymentPlan.dto';
import { Logger } from '../utils/logger';

@Controller('v1/')
export class ManifestController implements OnApplicationBootstrap {
  private readonly _brand: string = process.env.MANIFEST_BRAND;

  private readonly _logger: Logger;

  constructor(logger: Logger) {
    this._logger = logger;
  }

  public async onApplicationBootstrap(): Promise<void> {
    let brandConfig;
    try {
      brandConfig = await import(`../brands/${this._brand}`);
      this._logger.info(`Loaded config for brand ${this._brand}`);
    } catch (err: any) {
      this._logger.error(`Error import config file for brand ${this._brand}. Fallback to default. Error: ${err}`);
      brandConfig = await import(`../brands/corvina`);
    }
    setPaymentPlans(brandConfig.paymentPlans || []);
    setManifestJson(brandConfig.manifestJson);
  }

  @Get('/manifest.json')
  getManifestJson(): IManifestDTO {
    return getManifestJson();
  }
}
