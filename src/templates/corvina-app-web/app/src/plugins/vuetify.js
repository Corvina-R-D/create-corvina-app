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

// enable icon recognition without explicitly specifying the icon set
// like ecc:ecc-icon-name, we can just use ecc-icon-name directly
const defaultIconSet = {
  component: (props) =>
    typeof props.icon === 'string' && props.icon.startsWith('ecc-')
      ? ecc.component(props)
      : md.component(props),
}

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
    defaultSet: 'default',
    aliases,
    sets: {
      default: defaultIconSet,
      md,
      ecc
    },
  },
})


export default vuetify