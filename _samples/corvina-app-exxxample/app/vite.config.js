import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify'

export default defineConfig({
  plugins: [
    vue(),
    vuetify({
      styles: { configFile: 'src/theme/settings.scss'},
    })
  ],
  build: {
    target: 'es2021'
  }
})
