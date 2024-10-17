// Icons
import { Blueprint } from 'vuetify/lib/framework.mjs';
// import {mdi} from 'vuetify/iconsets/mdi';
// import { mdi } from 'vuetify/iconsets/mdi.mjs'; // Types
export const bp_cc2 : Blueprint = {
  defaults: {
    global: {
      rounded: 'sm'
    },
    VAvatar: {
      rounded: 'circle'
    },
    VAutocomplete: {
      variant: 'underlined'
    },
    VBanner: {
      color: 'primary'
    },
    VBtn: {
      color: 'primary',
      rounded: 30
    },
    VCheckbox: {
      color: 'secondary'
    },
    VCombobox: {
      variant: 'underlined'
    },
    VSelect: {
      variant: 'underlined'
    },
    VSlider: {
      color: 'primary'
    },
    VTabs: {
      color: 'primary'
    },
    VTextarea: {
      variant: 'underlined'
    },
    VTextField: {
      variant: 'underlined'
    }
  },
  // icons: {
  //   defaultSet: 'mdi',
  //   sets: {
  //     mdi,
  //   }
  // },
  theme: {
    themes: {
      light: {
        colors: {
          primary: '#496177',
          'primary-darken-1': '#364757',
          'primary-darken-2': '#222d38',
          // 'primary-lighten-1': '#C5CAE9',
          // secondary: '#01a3dd',
          // 'secondary-darken-1': '#F50057',
          // 'secondary-lighten-1': '#FF80AB',
          accent: '#01a3dd'
        }
      }
    }
  }
};