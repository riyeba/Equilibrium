import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto', // Automatically injects the registration script
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg', 'sqlite3.wasm'],
      manifest: {
        name: 'Equilibrium Management System',
        short_name: 'TEA SMS',
        description: 'School Management System for Desktop and Mobile',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/', // Ensure this matches base
        scope: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        // Caching everything including the SQL engine
        globPatterns: ['**/*.{js,css,html,ico,png,svg,wasm}']
      }
    })
  ],
  base: '/', // Use root base for PWA stability
  build: { outDir: 'dist' },
  server: { port: 5173, strictPort: true }
})
