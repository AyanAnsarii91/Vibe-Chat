import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      // Whether to polyfill `node:` protocol imports.
      protocolImports: true,
      // Include specific polyfills needed for WebRTC
      include: ['buffer', 'process', 'util', 'stream', 'events', 'path']
    })
  ],
  define: {
    // Fix for simple-peer which uses process.env.NODE_ENV
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
    // Polyfill for global which is used by simple-peer
    'global': 'globalThis'
  }
})
