import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify'
import mkcert from'vite-plugin-mkcert'
import path from "path";

const brand = process.env.BRAND_NAME || "brand-name";

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
  server: {
    https: true,
    host: true
  },
  resolve: {
    alias: {
      BrandData: path.resolve(__dirname, `./static/docs/brands/${brand}/index.ts`),
    },
  },
})
