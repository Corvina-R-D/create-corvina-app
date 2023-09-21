import { createApp } from 'vue'
import App from './App.vue'
import vuetify from './plugins/vuetify'
import { loadFonts } from './plugins/webfontloader'
import router from './router'
import { createI18n } from 'vue-i18n'
import enUS from './locales/en-US.json'
import itIT from './locales/it-IT.json'
import frFR from './locales/fr-FR.json'
import deDE from './locales/de-DE.json'
import esES from './locales/es-ES.json'

const i18n = createI18n({
  legacy: false,
  locale: 'en-US',
  fallbackLocale: 'en-US',
  messages: {
    'en-US': enUS,
    'it-IT': itIT,
    'fr-FR': frFR,
    'es-ES': esES,
    'de-DE': deDE,
  }
})

loadFonts()

createApp(App)
  .use(vuetify)
  .use(router)
  .use(i18n)
  .mount('#app')
