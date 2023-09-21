<template>
<v-layout class="flex-row justify-center">
  <v-dialog v-model="modalData.isVisible" persistent class="spinner-modal" content-class="dialog-style">
    <div style="height: 50vh; display: flex; flexDirection: column; alignItems: center; justifyContent: center; zIndex: 1000">
      <v-progress-circular color="white" :size="100" :width="10" indeterminate />
      <h1 style="color: white; marginTop: 15px;"> <b> {{ modalData.title }} </b> </h1>
      <h2 v-show="modalData.message" style="color: white;"> <a data-qa="spinner-modal-link" class="textLink" @click="clickOnTestLink"> <ins> {{ modalData.message }} </ins> </a> </h2>
    </div>
  </v-dialog>
</v-layout>
</template>

<script lang="ts">
import { IModalData } from './ModalComponent.vue';
import { PropType, defineComponent } from 'vue'

export default defineComponent({
  name: 'SpinnerModal',
  props: {
    modalData: {
      type: Object as PropType<IModalData>
    }
  },
  methods: {
    clickOnTestLink() : void {
      this.$emit("clickOnTestLink");
    }
  }
});
</script>

<style>

.textLink {
  z-index: 2000;
  color: white !important;
}

.spinner-modal {
  z-index: 200000;
}

.dialog-style {
  box-shadow: unset;
  color: white;
}
</style>

<style scoped>
  h1 b {
    font-weight: 700;
  }
</style>