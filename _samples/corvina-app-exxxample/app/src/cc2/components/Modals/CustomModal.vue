<template>
  <v-layout class="custom-dialog" row justify-center>
    <v-dialog v-model="modalData.isVisible" persistent max-width="400" style="fontSize: 15px" content-class="custom-modal">
      <v-card data-qa="corfirm-dialog-alert">
        <v-card-title class="headline">{{ modalData.title }}</v-card-title>
        <v-layout column>
          <component
            ref="childComponent"
            :is='customComponent'
            :modalData="modalData"
            @handleCheckbox="setCheckboxValue" />
        </v-layout>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn data-qa="custom-dialog-alert-cancel" text @click="close" v-show="showButtonCancel">
            Cancel
            <!-- {{$i18n.t('modal.cancel')}} -->
          </v-btn>
          <v-btn v-if="!modalData.customActions"  data-qa="custom-dialog-alert-continue" :loading="loading" color="primary" text @click="successAndClose">
            Continue
            <!-- {{$i18n.t('modal.continue')}} -->
          </v-btn>
          <v-btn v-else v-for="(action) in modalData.customActions" :key="action.key" :data-qa="action.qa" :loading="loading" color="primary" text @click="successAndClose(action.key)"> {{ action.label }} </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-layout>
</template>

<script lang="ts">
  import { DefineComponent, defineAsyncComponent, defineComponent } from 'vue'
  import { PropType } from 'vue'
import { IModalData } from './ModalComponent.vue';

  export interface CustomModalDataAction {
    key: string,
    label: string,
    qa?: string
  }

  export interface CustomModalData extends IModalData {
    onSuccess: (data: any, key?: string) => void,
    onClose: () => void,
    customActions ?: CustomModalDataAction[],
    hideButtonCancel?: boolean
  }

  export default defineComponent({
    name: 'CustomModal',
    data() {
      return {
        loading: false,
        checkboxValue: undefined, /** fixme */
        childData: undefined /** fixme */
      }
    },
    props: {
      modalData: {
        type: Object as PropType<CustomModalData>
      }
    },
    methods: {
      setCheckboxValue(value) {
        this.checkboxValue = value;
      },
      setData(data) {
        this.childData = data;
      },
      async successAndClose(key ?: string) {
        const { onSuccess, onClose } = this.modalData;
        if (onSuccess) {
          this.loading = true;
          await onSuccess( (this.$refs.childComponent as DefineComponent).$data, key);
          if(this.modalData.type === 'CheckboxMessageModal' && this.checkboxValue) {
            localStorage.setItem('doNotShowCastingDeviceMessage', JSON.stringify(this.checkboxValue));
          }
        }
        this.loading = false;
        this.close();
        
      },
      close() {
        const { onSuccess, onClose } = this.modalData;
        if (onClose) onClose();
      }
    },
    computed: {
      customComponent()  : any /** FIXME: fix this any */ {
        return defineAsyncComponent( () => import(`./Custom/${this.modalData.type}.vue`) );
      },
      showButtonCancel(): boolean {
        return !(this.modalData && this.modalData.hideButtonCancel);
    }
    }
  });
</script>

<style>

.custom-modal {
  z-index: 1000;
}

</style>