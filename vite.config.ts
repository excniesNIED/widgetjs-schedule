import { fileURLToPath, URL } from 'node:url'
import process from 'node:process'
import vue from '@vitejs/plugin-vue'
import widget from '@widget-js/vite-plugin-widget'
import AutoImport from 'unplugin-auto-import/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import Components from 'unplugin-vue-components/vite'
import { defineConfig } from 'vite'

export default defineConfig(({ mode }) => {
  const offlineMode = mode === 'offline'
  const devHost = process.env.WIDGET_DEV_HOST || '127.0.0.1'
  const devPort = Number(process.env.WIDGET_DEV_PORT || '5173')

  return {
    base: offlineMode ? './' : '/',
    server: {
      host: devHost,
      port: devPort,
      strictPort: true,
    },
    plugins: [
      vue(),
      widget({
        zipName: 'widgetjs-schedule',
        generateZip: offlineMode,
      }),
      AutoImport({
        imports: ['vue', 'vue-router'],
        resolvers: [ElementPlusResolver()],
      }),
      Components({
        resolvers: [ElementPlusResolver()],
      }),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    test: {
      include: ['src/**/*.test.ts'],
      environment: 'node',
    },
  }
})
