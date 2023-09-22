export type Constants = {
  serviceHost: string,
  serviceUrl: string,
};

const serviceHost = import.meta.env.VITE_SERVICE_URL || window.location.origin;

export const constants: Constants = {
  serviceHost,
  serviceUrl: `${serviceHost}/v1`,
};
