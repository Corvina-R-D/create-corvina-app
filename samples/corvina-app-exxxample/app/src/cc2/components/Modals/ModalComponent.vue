<script lang="ts">
import { VNode, h } from 'vue';
import ErrorModal from './ErrorModal.vue';
import SuccessModal from './SuccessModal.vue';
import ConfirmedModal from './ConfirmedModal.vue';
import SpinnerModal from './SpinnerModal.vue';
import CustomModal from './CustomModal.vue';
import ModalEnum from '../../constant/ModalEnum';
import InputFieldModal from './InputFieldModal.vue';
import {SnackbarType, SnackbarPosition} from '../../constant/ModalSnackbar';
import {modalSimpleStore} from '../../store/modal';
import { defineComponent } from 'vue';

export interface IModalData {
  id?: string,
  isVisible?: boolean,
  title: string,
  message?: string,
  htmlMessage?: string,
  snackbarType?: SnackbarType,
  snackbarPosition?: SnackbarPosition,
  error ?: any /** fixme */,
  timeout?: number,
  onSuccess?: (...args) => void,
  onClose?: (...args) => void
}

const mappingModal = {
  [ModalEnum.ERROR_MODAL]: ErrorModal,
  [ModalEnum.SUCCESS_MODAL]: SuccessModal,
  [ModalEnum.CONFIRMED_MODAL]: ConfirmedModal,
  [ModalEnum.SPINNER_MODAL]: SpinnerModal,
  [ModalEnum.CUSTOM_MODAL]: CustomModal,
  [ModalEnum.INPUT_MODAL]: InputFieldModal,
  [ModalEnum.SNACKBAR]: SuccessModal,
}

export default defineComponent({
  name: 'ModalComponent',
  computed: {
    modalData() : IModalData {
      return modalSimpleStore.getModalData();
    }
  },
  methods: {
    getComponentById(id: string) { // TODO: typing : VueConstructor<{modalData: IModalData} & Vue> {
      return mappingModal[id];
    }
  },
  render() : VNode {
    const id = this.modalData.id;
    const model = this.getComponentById(id);
    if (!this.modalData.id) {
      return null;
      // return h('div', { class: 'bar', innerHTML: 'ModalEnum empty: '  + JSON.stringify(this.modalData)});
    }
    return h(
      model,
      { 
        modalData: this.modalData
      },
    );
  },

});
</script>

