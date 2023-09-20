<template>
  <FullPageProgressCircular v-if="!errorMessage" />
  <div v-else-if="errorMessage">{{ errorMessage }}</div>
</template>

<script lang="ts">
import { useSecurity } from "../stores/security";
import { constants } from "../utils/constants";
import { ITheme } from "@corvina/corvina-app-connect/dist/ITheme";
import FullPageProgressCircular from "../components/FullPageProgressCircular.vue";

async function checkAuth({ instanceId, organizationId, accessToken }): Promise<boolean> {
  let response = await fetch(`${constants.serviceUrl}/${instanceId}/${organizationId}/check-auth`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return response.ok;
}

async function buildSecurityContext() {
  let { corvinaHost, accessToken, organizationId, instanceId, locale } = this.$route?.query || {};

  if (corvinaHost && organizationId && accessToken) {
    try {
      const authorized = await checkAuth({ instanceId, organizationId, accessToken });
      if (!authorized) {
        this.errorMessage = this.$t("NoPermissions");
        return;
      }

      let security = await useSecurity();

      this.$i18n.locale = locale?.replace('_', '-');

      await security.buildCorvinaConnect({ corvinaHost, instanceId });

      if (security.connect?.theme) {
        setConnectThemeIntoVuetifyLightTheme(security.connect?.theme, this.$vuetify.theme.themes.light.colors);
      }

      this.errorMessage = "";
      this.$router.push({ path: "/list" });
      console.log(this.$router)
    } catch (error) {
      console.error(error);
      this.errorMessage = `${this.$t('unableLoadDomainData')} ${corvinaHost} ${this.$t('and')} organizationId ${organizationId}. ${this.$t('contactAdministrator')}.`;
    }
  } else {
    this.errorMessage = this.$t('YouMustProvideThreeQuerystringParams');
  }
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

export default {
  name: "Home",
  data() {
    return {
      errorMessage: "",
    };
  },
  created() {
    this.buildSecurityContext = buildSecurityContext;
  },
  async mounted() {
    await this.buildSecurityContext();
  },
  async updated() {
    await this.buildSecurityContext();
  },
  components: { FullPageProgressCircular }
};
</script>
