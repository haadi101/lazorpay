# LazorKit SDK - Known Issues & Workarounds

This document catalogs bugs and issues encountered while building the LazorPay Starter Template with the LazorKit SDK.

---

## 🔴 Critical Issues

### 1. Transaction UI Stuck on "Signing with Passkey..."
**Symptom:** Transaction succeeds on-chain, but UI never updates from loading state.

**Root Cause:** The SDK's `signAndSendTransaction` returns various formats (string, object, array) making it difficult to reliably extract the signature for UI updates.

**Workaround:** 
- Use local component state instead of relying on hook state
- Implemented in `src/components/demos/GaslessTransfer.tsx`

```tsx
// Use separate useState hooks for reliable UI updates
const [isLoading, setIsLoading] = useState(false);
const [txSignature, setTxSignature] = useState<string | null>(null);
```

**Status:** ⚠️ Partially resolved - UI still occasionally gets stuck

---

### 2. Paymaster Rate Limiting (429 Errors)
**Symptom:** Console flooded with `"Server responded with 429. Retrying after 500ms delay..."`

**Root Cause:** LazorKit's devnet paymaster (`kora.devnet.lazorkit.com`) has aggressive rate limits.

**Workaround:** None available - this is LazorKit infrastructure. Wait for rate limit to reset.

**Status:** ❌ Unresolved - SDK issue

---

## 🟡 Major Issues

### 3. Balance Fetch Rate Limits
**Symptom:** `"Failed to fetch balance"` errors when using public Solana RPC.

**Root Cause:** Public Solana Devnet RPC has strict rate limits.

**Solution:** 
1. Use Helius free tier RPC with dedicated API key
2. Implemented `useSolanaBalance` hook with exponential backoff

```typescript
// src/config/lazorkit.ts
rpcUrl: 'https://devnet.helius-rpc.com/?api-key=YOUR_KEY'
```

**Status:** ✅ Resolved

---

### 4. High-S Signature Normalization
**Symptom:** `secp256r1` signature verification fails on Solana.

**Root Cause:** Some passkey implementations return High-S ECDSA signatures. Solana's precompile requires Low-S form.

**Solution:** Created `normalizeSignature` utility in `src/utils/lazor-patch.ts`

**Status:** ✅ Resolved

---

## 🟢 Minor Issues

### 5. Console Spam During Balance Fetch
**Symptom:** Thousands of "Failed to fetch balance" logs flooding console.

**Solution:** 
- Added `hasLoggedError` flag to log once
- Created dedicated `useSolanaBalance` hook with smart retry logic

**Status:** ✅ Resolved

---

### 6. TypeScript Build Errors with Unused Variables
**Symptom:** Build fails with `TS6133: 'variable' is declared but its value is never read`

**Root Cause:** Strict TypeScript config (`noUnusedLocals: true`)

**Solution:** Only destructure variables that are actually used.

**Status:** ✅ Resolved

---

## 📋 SDK Limitations Discovered

| Issue | SDK Function | Impact |
|-------|--------------|--------|
| Inconsistent return types | `signAndSendTransaction` | High |
| No timeout config | `signAndSendTransaction` | Medium |
| Rate limited paymaster | Internal SDK | High |
| No error type exports | SDK package | Low |
| Missing connection pooling | SDK RPC calls | Medium |

---

## 🔧 Files Modified to Work Around Issues

| File | Purpose |
|------|---------|
| `src/hooks/usePatchedWallet.ts` | Wrapper for SDK functions with timeout and normalization |
| `src/hooks/useSolanaBalance.ts` | Production-grade balance fetching with retry logic |
| `src/utils/lazor-patch.ts` | Signature normalization utilities |
| `src/components/demos/GaslessTransfer.tsx` | Local state management for reliable UI |

---

## 💡 Recommendations for LazorKit Team

1. **Standardize return types** - `signAndSendTransaction` should always return `string`
2. **Add timeout configuration** - Allow developers to set custom timeouts
3. **Increase paymaster rate limits** - Devnet limits are too aggressive for testing
4. **Export error types** - Help developers handle specific error cases
5. **Add connection pooling** - Reduce RPC calls for balance checks

---

*Last Updated: December 25, 2024*
