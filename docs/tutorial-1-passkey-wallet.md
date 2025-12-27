# Tutorial 1: Creating a Passkey-Based Wallet

> **Time to complete:** 15 minutes  
> **Difficulty:** Beginner  
> **Prerequisites:** Basic React knowledge

---

## Introduction

Traditional crypto wallets require users to:
1. Install a browser extension
2. Write down a 12-24 word seed phrase
3. Store it securely (forever!)
4. Remember which wallet app they used

**LazorKit eliminates all of this.** Users authenticate with biometrics they already know—Face ID, Touch ID, or Windows Hello. The cryptographic keys are stored in the device's Secure Enclave and never leave it.

---

## What You'll Learn

- What passkeys are and why they're better than seed phrases
- How to set up LazorkitProvider
- How to implement connect/disconnect functionality
- How to access wallet information

---

## Understanding Passkeys

### What is a Passkey?

A passkey is a **WebAuthn credential** that replaces passwords with biometric authentication:

```
┌─────────────────────────────────────────────────────────────┐
│                    PASSKEY ANATOMY                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   ┌────────────┐      ┌────────────────┐                    │
│   │  Private   │      │    Public      │                    │
│   │    Key     │      │     Key        │                    │
│   └────────────┘      └────────────────┘                    │
│        │                      │                              │
│        ▼                      ▼                              │
│   ┌────────────┐      ┌────────────────┐                    │
│   │  Secure    │      │   Registered   │                    │
│   │  Enclave   │      │   with Server  │                    │
│   │ (on device)│      │                │                    │
│   └────────────┘      └────────────────┘                    │
│                                                              │
│   Never leaves           Can be used to                     │
│   the device!            verify signatures                  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Why Passkeys are Better

| Feature | Seed Phrase | Passkey |
|---------|-------------|---------|
| Phishing-resistant | Vulnerable to phishing | Domain-bound (Secure) |
| Backup needed | 24 words required | Platform-synced |
| Device requirement | Any device | Trusted device |
| User experience | Complex | Familiar |

---

## Step 1: Install Dependencies

First, install the LazorKit SDK and required Solana packages:

```bash
npm install @lazorkit/wallet @coral-xyz/anchor @solana/web3.js
```

For Vite projects, you also need polyfills:

```bash
npm install vite-plugin-node-polyfills
```

---

## Step 2: Configure Vite (Important!)

Solana SDKs use Node.js globals that browsers don't have. Add polyfills:

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      // Required for @solana/web3.js
      include: ['buffer', 'process', 'util', 'stream', 'events'],
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
    }),
  ],
});
```

> **Common Error:** "Buffer is not defined" – This means polyfills aren't configured correctly.

---

## Step 3: Set Up LazorkitProvider

Wrap your application with the provider:

```tsx
// App.tsx
import { LazorkitProvider } from '@lazorkit/wallet';

// Configuration for Devnet (free for testing)
const CONFIG = {
  rpcUrl: 'https://api.devnet.solana.com',
  portalUrl: 'https://portal.lazor.sh',
  paymasterConfig: {
    paymasterUrl: 'https://kora.devnet.lazorkit.com',
  },
};

function App() {
  return (
    <LazorkitProvider
      rpcUrl={CONFIG.rpcUrl}
      portalUrl={CONFIG.portalUrl}
      paymasterConfig={CONFIG.paymasterConfig}
    >
      <MainContent />
    </LazorkitProvider>
  );
}
```

### Provider Props Explained

| Prop | Required | Description |
|------|----------|-------------|
| `rpcUrl` | Required | Solana RPC endpoint (Devnet/Mainnet) |
| `portalUrl` | Optional | LazorKit authentication portal (default: `portal.lazor.sh`) |
| `paymasterConfig` | Optional | Enables gasless transactions |

---

## Step 4: Create Connect Button

Now let's build the authentication UI:

```tsx
// ConnectButton.tsx
import { useWallet } from '@lazorkit/wallet';

export function ConnectButton() {
  const { 
    connect,      // Triggers auth flow
    disconnect,   // Clears session
    isConnected,  // Boolean state
    isConnecting, // Loading state
    wallet,       // Wallet info object
  } = useWallet();

  // Handle connection
  const handleConnect = async () => {
    try {
      // feeMode: 'paymaster' enables gasless transactions
      await connect({ feeMode: 'paymaster' });
    } catch (error) {
      console.error('Connection failed:', error);
    }
  };

  // Show different UI based on state
  if (isConnected && wallet) {
    return (
      <div>
        <p>Connected: {wallet.smartWallet.slice(0, 8)}...</p>
        <button onClick={disconnect}>Disconnect</button>
      </div>
    );
  }

  return (
    <button onClick={handleConnect} disabled={isConnecting}>
      {isConnecting ? 'Connecting...' : 'Connect with Passkey'}
    </button>
  );
}
```

---

## Step 5: Understanding WalletInfo

When connected, the `wallet` object contains:

```typescript
interface WalletInfo {
  credentialId: string;    // Unique WebAuthn credential ID
  passkeyPubkey: number[]; // Raw passkey public key bytes
  smartWallet: string;     // YOUR SOLANA ADDRESS (Base58)
  walletDevice: string;    // Internal PDA for device management
  platform: string;        // 'web', 'macIntel', 'windows', etc.
  accountName?: string;    // User's chosen account name
}
```

### Important: `smartWallet` is Your Address!

This is the Solana address users should:
- Share with others to receive funds
- Use in transactions as the sender
- See displayed in the UI

```tsx
// Display the wallet address
<p>Your Solana Address: {wallet.smartWallet}</p>

// Use in transactions
const instruction = SystemProgram.transfer({
  fromPubkey: smartWalletPubkey, // This is a PublicKey object
  toPubkey: recipientPubkey,
  lamports: amount,
});
```

---

## What Happens During `connect()`

1. **Check for Existing Session**
   - Looks for stored credentials in localStorage
   - If found, attempts silent authentication

2. **Open Portal (if no session)**
   - Opens LazorKit portal in popup/redirect
   - User sees passkey prompt (Face ID, Touch ID, etc.)

### Important Note on Signing Transactions

While `useWallet` is great for connecting users, **signing transactions on Solana requires special handling** for passkey compatibility. 

In [Tutorial 2](./tutorial-2-gasless-transactions.md), we'll introduce a `usePatchedWallet` hook that fixes common signature issues. For now, we'll focus on connection logic.

3. **Create or Retrieve Smart Wallet**
   - Passkey public key is used to derive a PDA
   - This PDA is your smart wallet address

4. **Return WalletInfo**
   - Session stored for future auto-reconnect
   - `wallet` object available in your app

```
┌──────────┐    ┌──────────┐    ┌───────────┐    ┌──────────┐
│ connect()│───▶│ Check    │───▶│ Passkey   │───▶│ Wallet   │
│          │    │ Session  │    │ Auth      │    │ Created  │
└──────────┘    └──────────┘    └───────────┘    └──────────┘
                     │
                     │ (if exists)
                     ▼
               ┌───────────┐
               │ Auto      │
               │ Reconnect │
               └───────────┘
```

---

## Full Working Example

```tsx
// App.tsx
import { LazorkitProvider, useWallet } from '@lazorkit/wallet';

const CONFIG = {
  rpcUrl: 'https://api.devnet.solana.com',
  portalUrl: 'https://portal.lazor.sh',
  paymasterConfig: { paymasterUrl: 'https://kora.devnet.lazorkit.com' },
};

function WalletButton() {
  const { connect, disconnect, isConnected, isConnecting, wallet } = useWallet();

  if (isConnected && wallet) {
    return (
      <div>
        <p>Connected to: {wallet.smartWallet}</p>
        <button onClick={disconnect}>Disconnect</button>
      </div>
    );
  }

  return (
    <button onClick={() => connect({ feeMode: 'paymaster' })} disabled={isConnecting}>
      {isConnecting ? 'Connecting...' : 'Connect with Passkey'}
    </button>
  );
}

export default function App() {
  return (
    <LazorkitProvider {...CONFIG}>
      <h1>My Solana App</h1>
      <WalletButton />
    </LazorkitProvider>
  );
}
```

---

## Troubleshooting

### "Buffer is not defined"
→ Check your `vite.config.ts` polyfills configuration

### "Failed to connect" / Portal doesn't open
→ Ensure `portalUrl` is correct (`https://portal.lazor.sh`)

### Connection works but `wallet` is null
→ Make sure you're checking `isConnected && wallet` together

### Passkey prompt doesn't appear
→ Test in Chrome or Safari (best WebAuthn support)

---

## Next Steps

Now that you can authenticate users, learn how to:

- [**Tutorial 2:** Execute Gasless Transactions →](./tutorial-2-gasless-transactions.md)
- [**Tutorial 3:** Handle Session Persistence →](./tutorial-3-session-persistence.md)

---

## Summary

- Installed `@lazorkit/wallet` and configured polyfills  
- Wrapped app with `LazorkitProvider`  
- Used `useWallet` hook for authentication  
- Understood the `WalletInfo` object  

**You've successfully integrated passkey authentication!** Users can now log into your Solana app with just biometrics—no seed phrases, no extensions, no friction.
