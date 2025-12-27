/**
 * React 19 + Solana Web3.js bootstrapping.
 * 
 * IMPORTANT: Buffer polyfill is handled by vite-plugin-node-polyfills.
 * Do NOT manually polyfill here to avoid conflicts.
 */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
