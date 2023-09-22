<template>
    <v-snackbar
      v-model="serviceError.isVisible"
      color="red"
    >
        <div style="text-align: center;">
            {{ serviceError.errorText }}
        </div>
    </v-snackbar>
</template>

<script lang="ts">
import { serviceError } from '../stores/serviceError'

export default {
    data() {
        return {
            serviceError
        }
    }
}
</script>