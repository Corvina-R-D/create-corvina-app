<template>
  <v-layout justify-center>
    <v-dialog v-model="modalData.isVisible" persistent :maxWidth="modalData && modalData.maxWidth != null ? modalData.maxWidth : '290px'" style="z-index: 1000;">
      <v-card data-qa="corfirm-dialog-alert" :style="modalData.bodyStyle">
        <v-card-title class="headline" :style="modalData.titleStyle" style="text-transform: uppercase; font-size: 18px !important;">{{modalData.title}}</v-card-title>
        <v-layout column>
          <v-card-text style="font-size: 15px" :style="modalData.messageStyle">
            <span v-html="modalData.message"></span>
          </v-card-text>
        </v-layout>
        <v-card-actions :style="modalData.actionStyle" style="padding:0">
          <v-spacer v-if='!modalData.disableSpacer'></v-spacer>
          <v-btn class="confirm-modal-actions" data-qa="corfirm-dialog-alert-cancel" text @click="close">
            Cancel
            <!-- {{$i18n.t('modal.cancel')}} -->
          </v-btn>
          <template v-if="!modalData.customActions">
            <v-btn class="confirm-modal-actions" data-qa="corfirm-dialog-alert-continue" id="confirmed-modal" color="primary" text @click="successAndClose" :disabled="showSuccessSpinner">
              <div v-if="showSuccessSpinner" style="min-width: 60px">
                <v-progress-circular indeterminate color="primary" size="25" />
              </div>
              <template v-else>
                Continue
                <!-- {{$i18n.t('modal.continue')}} -->
              </template>
            </v-btn>
          </template>
          <v-btn v-else v-for="(action) in modalData.customActions" :key="action.key" :data-qa="action.qa" color="primary" text @click="successAndClose(action.key)"> {{ action.label }} </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-layout>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export interface ConfirmedModalDataAction {
  key: string,
  label: string,
  qa?: string
}

export interface ConfirmedModalData {
  id ?: string,
  title ?: string,
  message ?: string,
  maxWidth ?: number,
  type: string,
  onSuccess: (data: any, key?: string) => void,
  onClose: () => void,
  customActions ?: ConfirmedModalDataAction[]
}


  import Vue from 'vue'
  export default defineComponent({
    name: 'ConfirmedModal',
    data() {
      return {
        showSuccessSpinner: false
      }
    },
    props: {
        modalData: {
            type: Object
        }
    },
    watch: {
      modalData: function(value, previousValue){
        /* Prevent a nested modal issue: infinite spinner on the continue button
         * ConfirmedModal MA onSuccess shows another ConfirmedModal MB
         * MA has set showSuccessSpinner to true so MB show spinner
         */
        this.showSuccessSpinner =  false;
      }
    },
    methods: {
      async successAndClose(key?: string) {
        const { onSuccess, onClose } = this.modalData;
        this.showSuccessSpinner = true;

        try {
          if (onSuccess) {
            await onSuccess(key);
          }
          if (onClose) {
            await onClose();
          }
        } finally {
          setTimeout(() => {
            this.showSuccessSpinner = false;
          }, 500);
        }
      },
      async close() {
        const { onClose } = this.modalData;
        if (onClose) await onClose();
      }
    }
  });
</script>

<style scoped>
.confirm-modal-actions .v-btn__content {
  align-items: start;
  justify-content: start;
}
</style>