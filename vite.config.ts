import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// SINGLE_FILE=1 bygger én samlet fil uten service worker, brukt til prøveversjonen.
const single = process.env.SINGLE_FILE === '1'

export default defineConfig({
  build: {
    chunkSizeWarningLimit: 700,
    ...(single ? { outDir: 'dist-single', rollupOptions: { output: { inlineDynamicImports: true } } } : {}),
  },
  plugins: [
    react(),
    !single && VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icon-192.png', 'icon-512.png'],
      manifest: {
        name: 'Vernerunde',
        short_name: 'Vernerunde',
        description: 'Gjennomfør vernerunder med egne sjekklister, bilder av avvik og rapport.',
        lang: 'nb',
        theme_color: '#0f5c4d',
        background_color: '#0f172a',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
})
