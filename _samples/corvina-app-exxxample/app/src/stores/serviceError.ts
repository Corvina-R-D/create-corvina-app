import { reactive } from 'vue'

export const serviceError = reactive({
    errorText: '',
    isVisible: false,
    setErrorText(errorText: string) {
        this.errorText = errorText;
        this.isVisible = true;

        setTimeout(() => {
            this.isVisible = false
        }, 5000);
    }
})