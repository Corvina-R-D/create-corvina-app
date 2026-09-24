<template>
  <v-navigation-drawer :id="id" class="custom-scrollbars help-bottom-drawer" :order="-50"
    :model-value="store.drawerItems[id]?.showDrawer" location="bottom" :scrim="false" temporary
    data-qa="help-drawer">
    <v-layout class="help-panel-content flex-column">
      <div class="d-flex justify-space-between" style="width: 100%;">
        <CorvinaButton icon="ecc-T-Help" :variant="CORVINA.BUTTON.VARIANT.FREE" dataQa="help-drawer-icon" />
        <CorvinaButton icon="ecc-M-Chiudi" :variant="CORVINA.BUTTON.VARIANT.FREE" :text="$t('help.close')" dataQa="close-help" @clicked="onClose" />
      </div>
      <br />
      <div style="width: 100%;">
        <slot></slot>
      </div>
    </v-layout>
  </v-navigation-drawer>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from "vue";
import { store } from "./Help.store";
import { CORVINA } from '@corvina/vue-components-library';

const props = defineProps<{
  id: string;
}>();

const onClose = ($event?: Event) => store.drawerItems[props.id]?.close($event);

onMounted(() => {
  store.add(props.id);
});

onUnmounted(() => {
  store.remove(props.id);
});
</script>

<style scoped>
nav.help-bottom-drawer {
  height: 50% !important;
  width: 100% !important;
}
nav.help-bottom-drawer:not(.v-navigation-drawer--active) {
  transform: translateY(100%) !important;
}
.help-panel-content {
  padding-left: 50px;
  padding-right: 50px;
}
</style>
