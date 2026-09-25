import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify'
import mkcert from'vite-plugin-mkcert'
import path from "path";

export default defineConfig({
  plugins: [
    vue(),
    vuetify({
      styles: { configFile: 'src/theme/settings.scss'},
    }),
    mkcert()
  ],
  build: {
    target: 'es2021'
  },
  esbuild: {
    supported: {
      'top-level-await': true //browsers can handle top-level-await features
    },
  },
  server: {
    https: true,
    host: true
  },
  resolve: {
    alias: {
      BrandData: path.resolve(__dirname, `./static/brands/index.ts`),
    },
  },
})
