import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const vendorChunkGroups = [
  ['react-vendor', ['react', 'react-dom', 'scheduler']],
  ['router', ['react-router', 'react-router-dom', '@remix-run']],
  ['firebase', ['firebase', '@firebase']],
  ['i18n', ['i18next', 'react-i18next']],
  [
    'ui-vendor',
    ['lucide-react', '@headlessui', 'framer-motion', 'clsx', 'react-hot-toast', 'react-helmet-async']
  ]
];

const resolveManualChunk = (id) => {
  if (!id.includes('node_modules')) {
    return undefined;
  }

  const normalizedId = id.replace(/\\/g, '/');

  for (const [chunkName, packages] of vendorChunkGroups) {
    if (packages.some((packageName) => normalizedId.includes(`/node_modules/${packageName}/`))) {
      return chunkName;
    }
  }

  return 'vendor';
};

export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 850,
    rollupOptions: {
      output: {
        manualChunks: resolveManualChunk
      }
    }
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups'
    }
  },
  preview: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups'
    }
  }
});
