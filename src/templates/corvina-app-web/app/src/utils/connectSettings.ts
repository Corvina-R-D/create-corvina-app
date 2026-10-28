import { type Composer } from "vue-i18n";
import { ITheme } from "@corvina/corvina-app-connect";
// @ts-ignore
import { getI18nMessages } from "BrandData";
import i18n, { getCurrentLocaleLang } from "../i18n/i18n";
import { ISecurityDTO } from "../stores/security";

const DATE_TIME_LOCALES = ['en-US', 'de-DE', 'es-ES', 'fr-FR', 'it-IT'];

function setConnectThemeIntoVuetifyLightTheme(connectTheme: ITheme, vuetifyColors: any) {
  vuetifyColors.primary = connectTheme.colors.primary;
  vuetifyColors.secondary = connectTheme.colors.highlight;
  vuetifyColors.success = connectTheme.colors.good;
  vuetifyColors.info = connectTheme.colors.alert;
  vuetifyColors.warning = connectTheme.colors.warningMild;
  vuetifyColors.error = connectTheme.colors.warningSerious;

  document.documentElement.style.setProperty('--color-primary', connectTheme.colors.primary);
  document.documentElement.style.setProperty('--color-primary-dk1', connectTheme.colors.primaryDk1);
  document.documentElement.style.setProperty('--color-primary-dk2', connectTheme.colors.primaryDk2);
  document.documentElement.style.setProperty('--color-primary-g1', connectTheme.colors.g1);
  document.documentElement.style.setProperty('--color-primary-g2', connectTheme.colors.g2);
  document.documentElement.style.setProperty('--color-primary-g3', connectTheme.colors.g3);
  document.documentElement.style.setProperty('--color-primary-g4', connectTheme.colors.g4);
  document.documentElement.style.setProperty('--color-highlight', connectTheme.colors.highlight);
  document.documentElement.style.setProperty('--color-alert', connectTheme.colors.alert);
  document.documentElement.style.setProperty('--color-warning-serious', connectTheme.colors.warningSerious);
  document.documentElement.style.setProperty('--color-warning-mild', connectTheme.colors.warningMild);
  document.documentElement.style.setProperty('--color-good', connectTheme.colors.good);
}

// applies locale, brand messages, theme and date formats from the corvina connection: on the first load (Home) and on a
// reload of the iframe, when the security is restored from the session storage and Home is not shown
export async function applyConnectSettings($vuetify: any, security: ISecurityDTO) {
  // generic composer, as returned by useI18n(): i18n.global narrows the locales to the ones with messages
  const composer = i18n.global as unknown as Composer;

  composer.locale.value = security.locale?.replace('_', '-') || "en-US";
  $vuetify.locale.current = getCurrentLocaleLang() || "en";

  // set the actual messages for the brand
  const brandMessages = await getI18nMessages(security.connect?.brandName);
  Object.entries(brandMessages).forEach(([locale, messages]) => {
    composer.setLocaleMessage(locale, messages as any)
  })

  if (security.connect?.theme) {
    setConnectThemeIntoVuetifyLightTheme(security.connect.theme, $vuetify.theme.themes.light.colors);
  }

  if (security.connect?.defaultStandardTime) {
    DATE_TIME_LOCALES.forEach(locale => composer.setDateTimeFormat(locale, security.connect!.defaultStandardTime));
  }
}
