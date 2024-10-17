// Styles
import 'material-design-icons-iconfont/dist/material-design-icons.css'
import 'vuetify/styles'
import * as components from 'vuetify/components'

// Vuetify
import { createVuetify } from 'vuetify'
import { md } from 'vuetify/iconsets/md'
import { bp_cc2 } from '../theme/blueprint.ts'

const vuetify = createVuetify({
  blueprint: bp_cc2,
  components: {...components },
  theme: {
    themes: {
      light: {}
    }
  },
  icons: {
    defaultSet: 'md',
    aliases: {
      md: 'md',
    },
    sets: {
      md,
    },
  },
})


export default vuetify