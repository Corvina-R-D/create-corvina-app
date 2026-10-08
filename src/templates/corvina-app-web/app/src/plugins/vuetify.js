// Styles
import '@mdi/font/css/materialdesignicons.css'
import 'material-design-icons-iconfont/dist/material-design-icons.css'
import 'vuetify/styles'
import * as components from 'vuetify/components'

// Vuetify
import { createVuetify } from 'vuetify'
import { aliases, md } from 'vuetify/iconsets/md'
import { bp_cc2 } from '../theme/blueprint.ts'
import { ecc } from './ecciconset'
import { en, it, de } from 'vuetify/locale'

const vuetify = createVuetify({
  blueprint: bp_cc2,
  components,
  theme: {
    themes: {
      light: {}
    }
  },
  locale: {
    locale: 'en',
    fallback: 'en',
    messages: { en, it, de }
  },
  icons: {
    defaultSet: 'md',
    aliases,
    sets: {
      md,
      ecc
    },
  },
})


export default vuetify