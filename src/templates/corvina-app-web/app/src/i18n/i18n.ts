import { createI18n } from "vue-i18n";

export enum Locales {
  EN = "en-US",
  FR = "fr-FR",
  IT = "it-IT",
  DE = "de-DE",
  ES = "es-ES",
  JP = "ja-JP",
}
export const LOCALES = [
  { value: Locales.EN, caption: "English" },
  { value: Locales.FR, caption: "Français" },
  { value: Locales.IT, caption: "Italiano" },
  { value: Locales.DE, caption: "Deutsch" },
  { value: Locales.ES, caption: "Español" },
  { value: Locales.JP, caption: "日本" },
];


const i18n = await createI18n({
  legacy: false,
  locale: "en-US",
  globalInjection: true,
  fallbackLocale: 'en-US',
  silentTranslationWarn: true,
  warnHtmlMessage: false,
  warnHtmlInMessage: false,
  messages: [] // the actual list will get initialized after we receive the brand info
});

export const languages = [
  { text: "English", value: Locales.EN },
  { text: "Deutsch", value: Locales.DE },
  { text: "Español", value: Locales.ES },
  { text: "Français", value: Locales.FR },
  { text: "Italiano", value: Locales.IT },
  { text: "日本", value: Locales.JP },
];

export default i18n;

export function getCurrentLocaleLang(): string {
  return i18n.global.locale.value.split("-")[0];
}