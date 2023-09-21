// Styles
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'
import * as components from 'vuetify/components'

// Vuetify
import { createVuetify } from 'vuetify'

const vuetify = createVuetify({
  components,
  theme: {
    themes: {
      light: {}
    }
  },
})

export default vuetify