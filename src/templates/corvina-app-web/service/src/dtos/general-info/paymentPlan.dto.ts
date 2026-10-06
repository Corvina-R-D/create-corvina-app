import { IManifestLocalizable } from './manifest.dto';

interface IRecurrentPlan {
  period: string; // ISO-8601 period PnYnMnD
  amount: number; // renewal amount
}

interface ITrialPlan {
  period: string; // ISO-8601 period PnYnMnD
}

interface IOptionPlan {
  key: string;
  msg: IManifestLocalizable;
  val: Object;
}

export interface IPaymentPlanDTO {
  id: string;
  label: IManifestLocalizable;
  description: IManifestLocalizable;
  level?: number;
  amount: number;
  recurrent?: IRecurrentPlan;
  trial?: ITrialPlan;
  options?: IOptionPlan[];
  deprecated?: boolean;
}

let paymentPlans: IPaymentPlanDTO[] = [];

export function setPaymentPlans(plans: IPaymentPlanDTO[]) {
  paymentPlans = plans;
}

export function getPaymentPlans(): IPaymentPlanDTO[] {
  return paymentPlans;
}
