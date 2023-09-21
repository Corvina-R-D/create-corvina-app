<template>
  <!--
    TODO: 
    - helpdeskreport
    - datadog
  -->
<v-layout class="flex-row justify-center">
  <v-dialog v-model="modalData.isVisible" persistent max-width="550">
    <v-card data-qa="error-dialog-alert" style="padding: 30px;" >
      <v-card-title data-qa="error-dialog-title" class="headline" style="color: var(--color-alert); text-transform: uppercase; font-size: 18px !important; padding: 0 0 8px 0;"> {{ modalData.title }} </v-card-title>
      <v-card-text data-qa="error-dialog-text" style="fontSize: 15px; padding: 0">
          <div v-if="!modalData.htmlMessage" style="max-width: calc(100% - 70px);">{{ modalData.message }}</div>
          <div v-if="modalData.htmlMessage" style="max-width: calc(100% - 70px);" v-html="modalData.htmlMessage"></div>
          <!-- <img style="position: absolute; top:30px; right:30px;" src="/cc2/static/img/error.svg"> this line breaks the npm run build -->
          <div v-if="modalData.error && modalData.error.config" class="error-detail">
            <!-- Show only opaque information to final user -->
            <div><span>
              Organization ID
              <!-- {{$i18n.t("errorModal.orgId")}} -->
            </span> {{ orgId }}</div>
            <div><span>
              Service:
              <!-- {{$i18n.t("errorModal.service")}} -->
            </span> {{ service }}</div>
            <div><span>
              Reason:
              <!-- {{$i18n.t("errorModal.reason")}} -->
            </span> {{ reason }}</div>
            <div><span>
              Timestamp:
              <!-- {{$i18n.t("errorModal.timestamp")}} -->
            </span> {{ timestamp }}</div>
            <div v-if="modalData.error.response && modalData.error.response.data && modalData.error.response.data.trackingNumber"><span>
              Tracking number:
              <!-- {{$i18n.t("errorModal.trackingNumber")}} -->
            </span> {{ modalData.error.response.data.trackingNumber }}</div>
            <!-- <div><span>Code:</span> {{ modalData.error.code }}</div> -->
          </div>
      </v-card-text>
      <v-card-actions style="padding:0; margin-top:10px;">
        <!-- <v-spacer></v-spacer> -->
        <v-btn data-qa="error-dialog-close" class="err-modal-confirm" style="color: var(--color-alert); padding: 0;" text @click="confirmAndClose">
          continue
          <!-- {{$i18n.t("errorModal.continue")}} -->
        </v-btn>
        <!-- <v-spacer></v-spacer>
        <help-desk-report :modalData="modalData" :error="modalData"></help-desk-report> -->
      </v-card-actions>
    </v-card>
  </v-dialog>
</v-layout>
</template>

<script lang="ts">
import { IModalData } from './ModalComponent.vue';
import ModalEnum from '../../constant/ModalEnum';
import {modalSimpleStore} from '../../store/modal';

// import HelpDeskReport from '../HelpDeskReport.vue'
// import { datadogRum } from '@datadog/browser-rum';

import Vue from 'vue'
export default {
  components:{
    // HelpDeskReport
  },
  name: 'ErrorModal',
  props: {
    modalData: {
      type: Object as () => IModalData
    }
  },
  data: function(){
    return {
      timestamp: new Date().toUTCString(),
    };
  },
  computed: {
    service: function() {
      if(this.modalData.error.config && this.modalData.error.config.url && this.modalData.error.config.url.split('svc/').length > 0)
        return this.modalData.error.config.url.split('svc/')[1];
      else 
        return "unknown";
    },
    orgId: function() {
      if(this.$store.getters['permission/getCurrentUserOrg'] != null && this.$store.getters['permission/getCurrentUserOrg'].length > 0)
      {
        return this.$store.getters['permission/getCurrentUserOrg'][0].id;
      }
    },
    reason: function() {
      if(this.modalData == null || this.modalData.error.response == null) {
        if(this.modalData.error && this.modalData.error.message) {
          return this.modalData.error.message
        }
        return 'N/A';
      }

      switch(this.modalData.error.response.status){
        case 503:
        case 504:
          return this.modalData.error.response.status + this.$i18n.t("errorModal.serviceNotAvailable");
          break;

        case 500:
          return this.modalData.error.response.status + this.$i18n.t("errorModal.serverError");
          break;

        case 400:
          return this.modalData.error.response.status + this.$i18n.t("errorModal.badRequest");
          break;

        case 401:
          return this.modalData.error.response.status + this.$i18n.t("errorModal.unauthorized");
          break;

        default:
          return this.modalData.error.response.status + this.$i18n.t("errorModal.networkError");
      }
    }
  },
  methods: {
    confirmAndClose() {
      modalSimpleStore.hideModal(ModalEnum.ERROR_MODAL);
      // if (this.modalData) {
      //   datadogRum.addError(this.modalData);
      // }
    }
  }
}
</script>

<style>
.error-detail{
  margin-top: 20px;
}
.error-detail span {    
  color: var(--color-alert)
}
.err-modal-confirm .v-btn__content {
  align-items: start;
  justify-content: start;
}
</style>

