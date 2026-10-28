<template>
  <v-app class="theme-cc2 vuetify3">
    <v-main>
        <router-view :key="security?.key"></router-view>
        <error-snackbar />
        <ModalComponent></ModalComponent>
    </v-main>
  </v-app>
</template>

<script>
import { defineComponent } from 'vue';
import ErrorSnackbar from './components/ErrorSnackbar.vue';
import { useSecurity } from './stores/security';
import { applyConnectSettings } from './utils/connectSettings';
import ModalComponent from './cc2/components/Modals/ModalComponent.vue';

export default defineComponent({
    name: "App",
    data() {
        return {
            security: undefined
        }
    },
    async mounted() {
        this.security = await useSecurity();

        // security restored from the session storage after a reload of the iframe: Home is not shown
        if (this.security.connect) {
            await applyConnectSettings(this.$vuetify, this.security);
        }
    },
    components: { ErrorSnackbar, ModalComponent }
});
</script>

<style>
@import './theme/theme.css';
</style>
```