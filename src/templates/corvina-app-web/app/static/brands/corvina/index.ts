import { Locales } from "../../../src/i18n/i18n";

export const messages = {
  [Locales.EN]: await import("../../../src/i18n/brands/corvina/en-US.json"),
  [Locales.IT]: await import("../../../src/i18n/brands/corvina/it-IT.json"),
  [Locales.DE]: await import("../../../src/i18n/brands/corvina/de-DE.json"),
  [Locales.FR]: await import("../../../src/i18n/brands/corvina/fr-FR.json"),
  [Locales.ES]: await import("../../../src/i18n/brands/corvina/es-ES.json"),
};
