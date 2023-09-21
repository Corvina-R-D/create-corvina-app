import { reactive } from 'vue'
import { IModalData } from '../components/Modals/ModalComponent.vue'

export const modalSimpleStore = reactive({
  modalData: {} as IModalData,

  getModalData() : IModalData {
    return this.modalData;
  },

  showModal(modalData : IModalData) {
    modalData.isVisible = true;
    this.modalData = { ...modalData };
  },

  hideModal(modalId : string) {
    if(this.modalData.id == modalId){
      this.modalData.isVisible = false;
    }else{
      console.warn("hideModal id missmatch, modalId = "+modalId+" modalData.id = "+this.modalData?.id);
    }
  }
})