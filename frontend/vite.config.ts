import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': ['framer-motion', 'lucide-react'],
          'vendor-map': ['leaflet', 'react-leaflet', '@react-leaflet/core'],
          'vendor-query': ['@tanstack/react-query'],
          'vendor-utils': ['axios', 'zustand', 'react-hot-toast']
        }
      }
    },
    chunkSizeWarningLimit: 600
  },
  plugins: [
    react(),
    tailwindcss(),
    ...(process.env.NODE_ENV === 'production' ? [VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: false
      },
      includeAssets: ['favicon.svg', 'pwa-192x192.png', 'pwa-512x512.png', 'manifest.webmanifest'],
      manifest: {
        name: 'Locolive',
        short_name: 'Locolive',
        description: 'Live location based social feed',
        theme_color: '#ff3b8e',
        background_color: '#0a0a0c',
        display: 'standalone',
        start_url: '/',
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
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json,webmanifest}'],
        cleanupOutdatedCaches: true,
        navigateFallback: '/index.html',

        navigateFallbackAllowlist: [/^\/(?!api\/).*$/], // Allow all routes except /api/*

        runtimeCaching: [
          // MEDIA CACHING (CacheFirst)
          {
            urlPattern: ({ url }) => url.pathname.includes('/uploads/') || url.pathname.includes('/media/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'media-cache',
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 604800  // 7 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              },
              rangeRequests: true
            }
          },
          // FEED CACHING (StaleWhileRevalidate)
          {
            urlPattern: ({ url }) => !url.pathname.startsWith('/src/') && /\/(feed|stories|reels)\b/.test(url.pathname),
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'api-public-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 86400  // 24 hours
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          // ADMIN DATA (NetworkFirst)
          {
            urlPattern: ({ url }) => !url.pathname.startsWith('/src/') && /\/admin\/(stats|users|reports)/.test(url.pathname),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'admin-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 300 // 5 minutes
              }
            }
          },
          // NETWORK ONLY (No caching for sensitive data)
          {
            urlPattern: ({ url }) => !url.pathname.startsWith('/src/') && (/\/users\/(login|register)/.test(url.pathname) || url.pathname.includes('/auth/')),
            handler: 'NetworkOnly',
            options: {
              cacheName: 'no-cache'
            }
          },
          // WEBSOCKET & ACTIVITY
          {
            urlPattern: ({ url }) => url.pathname.includes('/ws/') || url.pathname.includes('/admin/activity'),
            handler: 'NetworkOnly',
            options: {
              cacheName: 'no-cache'
            }
          },
          // LOCATION (always fresh)
          {
            urlPattern: ({ url }) => url.pathname.includes('/location/'),
            handler: 'NetworkOnly',
            options: {
              cacheName: 'no-cache'
            }
          }
        ]
      }

    })] : [])
  ]
})
