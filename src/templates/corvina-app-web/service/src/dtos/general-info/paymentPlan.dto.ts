interface IManifestLocalizable {
  value: string;
  i18n: string;
}

interface IPeriodPlan {
  period: string;
  amount?: number;
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
  level: number;
  amount: number;
  recurrent?: IPeriodPlan;
  trial?: IPeriodPlan;
  options: IOptionPlan[];
  deprecated?: boolean;
}

let paymentPlans: IPaymentPlanDTO[] = [];

export function setPaymentPlans(plans: IPaymentPlanDTO[]) {
  paymentPlans = plans;
}

export function getPaymentPlans(): IPaymentPlanDTO[] {
  return paymentPlans;
}
