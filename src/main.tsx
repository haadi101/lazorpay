/**
 * Application Entry Point
 * 
 * This file sets up the React application with necessary polyfills
 * for Solana SDK compatibility.
 */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'

// Polyfill Buffer for browser environment
// Required by @solana/web3.js and @lazorkit/wallet
// Note: vite-plugin-node-polyfills handles most polyfills,
// but we include this as a fallback for edge cases
if (typeof window !== 'undefined') {
  // @ts-expect-error - Buffer polyfill for browser
  window.Buffer = window.Buffer || await import('buffer').then(m => m.Buffer);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
