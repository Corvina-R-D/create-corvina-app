<template>
  <v-container>
      <p>{{ $t('exampleCustomModal.templateText') }}</p>
      <p class="custom-class">{{modalData.customParamExample}}</p>
  </v-container>
</template>

<script lang="ts">
import { PropType, defineComponent } from 'vue';
import { CustomModalData } from '../CustomModal.vue';

export interface ModalDataCustomExample extends CustomModalData {
  customParamExample: string;
}

export default defineComponent({
  name: "ExampleCustomModal",
  props: {
    modalData: {
      type: Object as PropType<ModalDataCustomExample>,
      default: () => {},
    },
  },

  data() {
    return {
      link: "",
      copyStatus: false,
      fullscreenLink: false,
    };
  },

  methods: {
  }
});
</script>

<style scoped>
.custom-class {
  background-color: red;
}
</style>
