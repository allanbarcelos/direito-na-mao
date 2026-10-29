import { copyFileSync } from 'node:fs'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

/**
 * Hospedagens estáticas como o GitHub Pages não sabem que /programas/bpc é uma tela do app.
 * Elas entregam o 404.html, que aqui é uma cópia do index.html, e o React cuida da rota.
 */
function paginaNaoEncontrada(): Plugin {
  return {
    name: 'copiar-404',
    apply: 'build',
    closeBundle() {
      copyFileSync('dist/index.html', 'dist/404.html')
    },
  }
}

export default defineConfig({
  // Caminho onde o site é publicado (no GitHub Pages: /nome-do-repositorio/).
  base: process.env.BASE_PATH ?? '/',
  plugins: [
    react(),
    paginaNaoEncontrada(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icone.svg', 'icone-192.png', 'icone-512.png', 'apple-touch-icon.png'],
      manifest: {
        name: 'Direito na Mão — benefícios sociais',
        short_name: 'Direito na Mão',
        description: 'Descubra quais benefícios do governo você e sua família podem receber, quanto e onde pedir.',
        lang: 'pt-BR',
        start_url: '.',
        scope: '.',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#f6f7f4',
        theme_color: '#0b6b3a',
        icons: [
          { src: 'icone-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icone-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icone-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          { src: 'icone.svg', sizes: 'any', type: 'image/svg+xml' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        navigateFallback: 'index.html',
      },
    }),
  ],
})
