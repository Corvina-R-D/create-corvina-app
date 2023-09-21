<template>
  <div class="modal-container">
    <v-layout row justify-center>
      <v-snackbar hide-overlay :timeout="modalData.timeout" v-model="modalData.isVisible" max-width="290" :content-class="classes" :location="modalData.snackbarPosition || SnackbarPosition.BOTTOM">
<!--        @click:outside="successAndClose"-->
        <div class="d-flex" data-qa="success-dialog-alert" >
          <div class="d-flex justify-center align-items-center modal-icon">
            <v-icon style="font-size:33px">ecc-B-Check</v-icon>
          </div>
          <div class="flex flex-direction-column flex-grow-1">
            <div style="font-size: 13px; font-weight: 700;"> {{modalData.title}} </div>
            <div style="font-size: 10px;"> {{ modalData.message }} </div>
          </div>
          <v-btn
            flat
            icon
            @click.native="successAndClose"
            style="margin:0; height: 38px; width: 38px; background-color: transparent !important;"
            class="col-wt squareCorners"
            :ripple="false"
            >
            <!-- :data-qa="`close-confirmed-${modalData.type}`" -->
            <v-icon style="font-size:33px">ecc-E-X</v-icon>
          </v-btn>
        </div>
      </v-snackbar>
    </v-layout>
  </div>
</template>

<script lang="ts">
import { IModalData } from './ModalComponent.vue';
import { SnackbarPosition } from '../../constant/ModalSnackbar';
import ModalEnum from '../../constant/ModalEnum';
import {modalSimpleStore} from '../../store/modal';
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'SuccessModal',
  props: {
    modalData: {
      type: Object as () => IModalData
    },
  },
  data: function() {
    return {
      SnackbarPosition
    }
  },
  methods: {
    successAndClose() {
      modalSimpleStore.hideModal(this.modalData.id);
      const { onSuccess, onClose } = this.modalData;
      if (onSuccess) {
        onSuccess();
      }
      if (onClose) onClose();
    },
  },
  computed: {
    isTop() : boolean {
      return ( this.modalData.id == ModalEnum.SNACKBAR && this.modalData.snackbarPosition && this.modalData.snackbarPosition == SnackbarPosition.TOP )
    },
    classes() : string {
      return ( this.modalData.id == ModalEnum.SNACKBAR && this.modalData.snackbarType ) ? this.modalData.snackbarType :  "good";
    }
  },
  watch: {
  }
});
</script>

<style scoped>:deep() .v-sheet.v-snack__wrapper:not(.v-sheet--outlined) {
  box-shadow: 0px 15px 30px 5px rgba(0,0,0,0.15);
}
:deep() .good {
  background-color: var(--color-good);
}
:deep() .warn {
  background-color: var(--color-warning-serious);
}
:deep() .error {
  background-color: var(--color-alert);
}

.modal-icon {
  flex-grow: 0 !important;
  margin-right: 15px;
}
:deep()  .v-snack__action { 
  display: none;
}
</style>
