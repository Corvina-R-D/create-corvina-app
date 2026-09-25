<template>
  <FullPageProgressCircular v-if="!errorMessage" />
  <div v-else-if="errorMessage">{{ errorMessage }}</div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { useSecurity } from "../stores/security";
import { constants } from "../utils/constants";
import { ITheme } from "@corvina/corvina-app-connect";
import FullPageProgressCircular from "../components/FullPageProgressCircular.vue";
// @ts-ignore
import { getI18nMessages } from "BrandData";
import i18n, { getCurrentLocaleLang } from "../i18n/i18n";
import { useI18n } from "vue-i18n";

async function checkAuth({ instanceId, organizationId, accessToken }: { instanceId?: string; organizationId: string; accessToken: string }): Promise<boolean> {
  let response = await fetch(`${constants.serviceUrl}/${instanceId}/${organizationId}/check-auth`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return response.ok;
}

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

let i18nSetDateTimeFormat: (locale: string, options: any) => void;

export default defineComponent({
  name: "Home",
  setup() {
    const { setDateTimeFormat } = useI18n();
    i18nSetDateTimeFormat = setDateTimeFormat;
  },
  data() {
    return {
      errorMessage: "",
    };
  },
  async mounted() {
    await this.buildSecurityContext();
  },
  async updated() {
    await this.buildSecurityContext();
  },
  methods: {
    async buildSecurityContext() {
      let { corvinaHost, accessToken, organizationId, instanceId, locale } = (this.$route?.query || {}) as Record<string, string | undefined>;

      if (corvinaHost && organizationId && accessToken) {
        try {
          const authorized = await checkAuth({ instanceId, organizationId, accessToken });
          if (!authorized) {
            this.errorMessage = this.$t("NoPermissions");
            return;
          }

          let security = await useSecurity();

          this.$i18n.locale = locale?.replace('_', '-') || "en-US";
          this.$vuetify.locale.current = getCurrentLocaleLang() || "en";

          await security.buildCorvinaConnect({ corvinaHost, instanceId });

          // set the actual messages for the brand
          const brandMessages = await getI18nMessages(security.connect?.brandName);
          Object.entries(brandMessages).forEach(([locale, messages]) => {
            i18n.global.setLocaleMessage(locale, messages)
          })

          if (security.connect?.theme) {
            setConnectThemeIntoVuetifyLightTheme(security.connect?.theme, this.$vuetify.theme.themes.light.colors);
          }

          if (security.connect?.defaultStandardTime) {
            i18nSetDateTimeFormat('en-US', security.connect.defaultStandardTime)
            i18nSetDateTimeFormat('de-DE', security.connect.defaultStandardTime)
            i18nSetDateTimeFormat('es-ES', security.connect.defaultStandardTime)
            i18nSetDateTimeFormat('fr-FR', security.connect.defaultStandardTime)
            i18nSetDateTimeFormat('it-IT', security.connect.defaultStandardTime)
          }

          this.errorMessage = "";
          this.$router.replace({ path: "/list" });
          console.log(this.$router)
        } catch (error) {
          console.error(error);
          this.errorMessage = `${this.$t('unableLoadDomainData')} ${corvinaHost} ${this.$t('and')} organizationId ${organizationId}. ${this.$t('contactAdministrator')}.`;
        }
      } else {
        this.errorMessage = this.$t('YouMustProvideThreeQuerystringParams');
      }
    },
  },
  components: { FullPageProgressCircular }
});
</script>
