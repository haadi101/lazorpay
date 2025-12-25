import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// https://vite.dev/config/
// CRITICAL: Solana SDKs require Node.js polyfills (Buffer, process, etc.)
// vite-plugin-node-polyfills handles this automatically
export default defineConfig({
  plugins: [
    react(),
    // Required for @lazorkit/wallet and @solana/web3.js
    // Fixes "Buffer is not defined" and similar errors
    nodePolyfills({
      // Enable all polyfills needed for Solana
      include: ['buffer', 'process', 'util', 'stream', 'events'],
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
    }),
  ],
  // Optimize dependencies for better dev experience
  optimizeDeps: {
    include: ['@lazorkit/wallet', '@solana/web3.js', '@coral-xyz/anchor'],
  },
})
