# SDK Patching Guide

This guide explains how to patch the `@lazorkit/wallet` SDK to fix known issues.

## Known Issues

### 1. High-S Signature Issue

**Problem:** Some passkey implementations generate "High-S" ECDSA signatures that fail Solana's `secp256r1` precompile verification.

**Error:** `TransactionError: 0x2 (Invalid Signature)`

**Solution:** Normalize signatures to Low-S form before sending to Solana.

### 2. Transaction Size Issue  

**Problem:** The SDK defaults to a "chunked" transaction flow that can create transactions exceeding Solana's 1232-byte limit.

**Error:** `Transaction too large` or similar

**Solution:** Force direct execution flow for small transactions.

---

## Option A: Use the Patched Hook (Recommended)

We provide a patched version of the wallet hook that handles the High-S signature issue:

```tsx
// Instead of this:
import { useWallet } from '@lazorkit/wallet';

// Use this:
import { usePatchedWallet } from '../hooks/usePatchedWallet';

function MyComponent() {
  const { connect, signMessage, signAndSendTransaction } = usePatchedWallet();
  // ... rest of your code
}
```

---

## Option B: Use patch-package (For Transaction Size Fix)

If you need to patch the SDK directly:

### Step 1: Install patch-package

```bash
npm install patch-package --save-dev
```

### Step 2: Add postinstall script

In `package.json`, add:

```json
{
  "scripts": {
    "postinstall": "patch-package"
  }
}
```

### Step 3: Find the file to patch

Look for these patterns in `node_modules/@lazorkit/wallet/dist/index.js`:

```javascript
// Look for something like:
if (instructions.length > CHUNK_THRESHOLD) {
  return createChunkFlow(...)
}

// Or:
const shouldChunk = instructions.length > X || totalSize > Y
```

### Step 4: Create the patch

After modifying the file, run:

```bash
npx patch-package @lazorkit/wallet
```

This creates a patch file in `/patches/` that will be applied on every `npm install`.

### Example Patch

Common modifications:

```javascript
// BEFORE (in SDK):
if (shouldUseChunkFlow(instructions)) {
  return createChunkFlow(instructions, ...);
}

// AFTER (patched):
// Force direct execution for small transactions
if (instructions.length > 5 && shouldUseChunkFlow(instructions)) {
  return createChunkFlow(instructions, ...);
}
```

---

## Option C: Manual Signature Normalization

If you're handling raw signatures, use our utility:

```typescript
import { normalizeSignature } from '../utils/lazor-patch';

// When you get a raw signature from passkey
const rawSignature = await getPasskeySignature();

// Normalize before sending to Solana
const normalizedSig = normalizeSignature(rawSignature);

// Now use normalizedSig with Solana
```

---

## Debugging Tips

### Check for High-S

```typescript
import { isHighS } from '../utils/lazor-patch';

const sig = getSignature();
if (isHighS(sig)) {
  console.log('⚠️ This signature has High-S and needs normalization');
}
```

### Check Transaction Size

```typescript
const tx = new Transaction();
tx.add(...instructions);
tx.recentBlockhash = '...';
tx.feePayer = payer;

const serialized = tx.serialize({ requireAllSignatures: false });
console.log(`Transaction size: ${serialized.length} bytes`);

if (serialized.length > 1232) {
  console.error('❌ Transaction too large!'); 
}
```

### Monitor SDK Behavior

Add these console logs to track SDK flow:

```typescript
// In your component
const { signAndSendTransaction } = usePatchedWallet();

const result = await signAndSendTransaction({
  instructions,
  transactionOptions: {
    computeUnitLimit: 200000, // Explicit CU limit
  },
});
```

---

## Getting Help

- **LazorKit Discord/Telegram:** Ask about SDK updates
- **GitHub Issues:** Report bugs at the official repo
- **Solana Stack Exchange:** For general Solana transaction issues

---

## Changelog

- **v1.0.0:** Initial patch with High-S signature normalization
- Added `usePatchedWallet` hook
- Added `normalizeSignature` utility
