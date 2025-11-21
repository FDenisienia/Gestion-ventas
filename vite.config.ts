import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      // Optimización: Solo actualizar lo que cambió
      fastRefresh: true,
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Separar vendors en chunks optimizados, pero de forma más segura
          if (id.includes('node_modules')) {
            // React y React-DOM deben estar siempre disponibles - no separarlos
            // Esto evita el error "Cannot read properties of undefined (reading 'useLayoutEffect')"
            if (id.includes('react') || id.includes('react-dom')) {
              // No separar React - dejarlo en el chunk principal para evitar problemas
              return undefined;
            }
            // Recharts puede tener problemas de inicialización si se separa
            // Mejor dejarlo con otros vendors o en el chunk principal del componente lazy
            if (id.includes('recharts')) {
              // Dejar recharts en el chunk del componente que lo usa (lazy loading)
              return undefined;
            }
            if (id.includes('react-bootstrap') || id.includes('bootstrap')) {
              return 'bootstrap-vendor';
            }
            if (id.includes('jspdf')) {
              return 'pdf-vendor';
            }
            // Otros node_modules en un chunk separado
            return 'vendor';
          }
        },
      },
    },
    chunkSizeWarningLimit: 1000,
    // Optimizaciones de build
    minify: 'esbuild', // Más rápido que terser
    cssMinify: true,
    // Generar source maps solo en desarrollo
    sourcemap: false,
    // Optimizar assets
    assetsInlineLimit: 4096, // Inline assets pequeños (< 4kb)
    // Asegurar que las dependencias comunes se resuelvan correctamente
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true,
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-bootstrap', 'recharts'],
    // Excluir dependencias pesadas del pre-bundling si no se usan al inicio
    exclude: ['jspdf', 'jspdf-autotable'],
    // Asegurar que React se resuelva correctamente
    esbuildOptions: {
      resolveExtensions: ['.jsx', '.js', '.ts', '.tsx'],
    },
  },
  resolve: {
    // Asegurar que React se resuelva como una sola instancia
    dedupe: ['react', 'react-dom'],
  },
  // Optimización de servidor de desarrollo
  server: {
    hmr: {
      overlay: false, // Desactivar overlay de errores para mejor rendimiento
    },
    // Optimizaciones de rendimiento
    fs: {
      strict: false, // Permitir acceso a archivos fuera del root para mejor rendimiento
    },
  },
  // Optimizaciones adicionales
  esbuild: {
    // Optimizar para producción
    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
    legalComments: 'none', // Eliminar comentarios legales en producción
  },
})



