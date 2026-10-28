<template>
  <FullPageProgressCircular v-if="!errorMessage" />
  <div v-else-if="errorMessage">{{ errorMessage }}</div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { useSecurity } from "../stores/security";
import { constants } from "../utils/constants";
import FullPageProgressCircular from "../components/FullPageProgressCircular.vue";
import { applyConnectSettings } from "../utils/connectSettings";

async function checkAuth({ instanceId, organizationId, accessToken }: { instanceId?: string; organizationId: string; accessToken: string }): Promise<boolean> {
  let response = await fetch(`${constants.serviceUrl}/${instanceId}/${organizationId}/check-auth`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return response.ok;
}

export default defineComponent({
  name: "Home",
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

          await security.buildCorvinaConnect({ corvinaHost, instanceId, locale });

          await applyConnectSettings(this.$vuetify, security);

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
