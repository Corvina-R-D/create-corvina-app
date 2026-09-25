import { createApp } from 'vue'
import App from './App.vue'
import vuetify from './plugins/vuetify'
import { loadFonts } from './plugins/webfontloader'
import router from './router'
import i18n from './i18n/i18n'
import CorvinaComponents from "@corvina/vue-components-library";
import "@corvina/vue-components-library/vue-components-library.css";


loadFonts()

createApp(App)
  .use(vuetify)
  .use(CorvinaComponents)
  .use(router)
  .use(i18n)
  .mount('#app')
