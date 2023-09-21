<template>
  <v-layout class="flex-row justify-center">
    <v-dialog v-model="modalData.isVisible" persistent max-width="490" style="zIndex: 1000; fontSize: 15px;">
      <v-card data-qa="corfirm-dialog-input" style="padding:20px" >
        <v-card-title class="headline">{{modalData.title}}</v-card-title>
        <v-layout class="flex-column">
          <v-card-text style="fontSize: 15px">
            <h3>{{modalData.message}}</h3>
            <v-text-field
              v-model='currentInputValue'
              :type="inputType"
              :error-messages="errorMessages"
              :error="error"

              :append-icon="showAppendIcon"
              @click:append="inputPasswordEyeIconOnOff = !inputPasswordEyeIconOnOff"
              autofocus
            >
            </v-text-field> 
          </v-card-text>
        </v-layout>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn data-qa="corfirm-dialog-input-cancel" text @click="close">
            cancel
            <!-- {{$i18n.t('modal.cancel')}} -->
          </v-btn>
          <v-btn data-qa="corfirm-dialog-input-continue" id="confirmed-modal" color="primary" text @click="confirm">
            continue
            <!-- {{$i18n.t('modal.continue')}} -->
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-layout>
</template>

<script lang="ts">
  import { defineComponent, PropType } from 'vue'
  import { IModalData } from './ModalComponent.vue';

  export interface InputModalData extends IModalData {
    inputType: string,
    onSuccess: ( value: string ) => void,
    onClose: ( valid: boolean ) => void,
    onError?: ( value: string ) => void,
    onConfirmValidation?: (input: string) => { valid: boolean, error: string }
  }

  
  export default defineComponent({
    name: 'InputFieldModal',
    data() {
      return {
        currentInputValue: '',
        error: false,
        errorMessages: [],
        
        // password
        inputType: "text",
        inputPasswordEyeIconOnOff: false,
      }
    },
    props: {
        modalData: {
            type: Object as PropType<InputModalData>
        }
    },
    watch: {
      errorMessages: function(value){
        this.error = value.length > 0;
      },
      inputPasswordEyeIconOnOff: function(value){
        this.inputType = value ? "text" : "password";
      },
      modalData: function(){
        this.inputType = (<InputModalData>this.modalData).inputType || "text";
      }
    },
    methods: {
      async confirm() {
        const {
          onSuccess, 
          onClose, 
          onError, 
          onConfirmValidation 
        } = <InputModalData>this.modalData;
        let success: boolean = true;

        // Validate input
        if(onConfirmValidation){
          const result = await(onConfirmValidation (this.currentInputValue));
          success =  result.valid;
          this.errorMessages = result.error ? [result.error] : [];
        }

        // Call onSuccess or onError
        if (success && onSuccess) {
          onSuccess(this.currentInputValue);
        }
        else if (!success && onError) {
          onError(this.currentInputValue);
        }

        //Call onClose
        if (onClose) 
          onClose(success);

        // Reset modal if there aren't errors
        if(this.errorMessages.length == 0){
          this.reset();
        }
      },
      close() {
        const { onClose } = <InputModalData>this.modalData;
        if (onClose) onClose(true);
        this.reset();
      },
      reset(){
        this.currentInputValue = '';
        this.errorMessages = [];
        this.inputType = "text";
        this.inputPasswordEyeIconOnOff = false;
      }
    },
    computed: {
      showAppendIcon: function(): string {
        const inputType = (<InputModalData>this.modalData).inputType;
        if(inputType == "password"){
          return this.inputPasswordEyeIconOnOff ? 'mdi-eye' : 'mdi-eye-off';
        }
        return '';
      }
    },
    created(){
      this.inputType = (<InputModalData>this.modalData).inputType || "text";
    }
  });
</script>

<style scoped>
</style>