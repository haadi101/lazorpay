# ⚡ LazorPay Starter Template

> **Build Passkey-Native Solana Apps in Minutes**

A production-ready starter template demonstrating [LazorKit SDK](https://lazorkit.com) integration with passkey authentication, gasless transactions, and smart wallet features.

![Demo Screenshot](docs/demo-screenshot.png)

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Devnet-blue)](https://lazorpay-demo.vercel.app)
[![LazorKit Docs](https://img.shields.io/badge/Docs-LazorKit-purple)](https://docs.lazorkit.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 🎯 What's Inside

This template showcases **4 key LazorKit features**:

| Demo | Description |
|------|-------------|
| 🔐 **Passkey Auth** | Seedless login with biometrics (Face ID, Touch ID, Windows Hello) |
| 💸 **Gasless Transfer** | Send SOL without paying gas fees (paymaster-sponsored) |
| ✍️ **Message Sign** | Sign arbitrary messages for verification/proof |
| 🪙 **Token Mint** | Create SPL tokens with multi-instruction transactions |

---

## 🚀 Quick Start

### Prerequisites

- Node.js 20.19+ (or 22+)
- npm or pnpm

### Installation

```bash
# Clone this repo
git clone https://github.com/YOUR_USERNAME/lazorpay-starter.git
cd lazorpay-starter

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Environment Setup

This template uses **Devnet** by default with pre-configured endpoints:

```typescript
// src/config/lazorkit.ts
const LAZORKIT_CONFIG = {
  rpcUrl: 'https://api.devnet.solana.com',
  portalUrl: 'https://portal.lazor.sh',
  paymasterConfig: {
    paymasterUrl: 'https://kora.devnet.lazorkit.com',
  },
};
```

> 💡 For **mainnet**, update the RPC URL and paymaster URL with your API keys.

---

## 📁 Project Structure

```
lazorpay-starter/
├── src/
│   ├── components/
│   │   ├── demos/              # Demo use case components
│   │   │   ├── PasskeyDemo.tsx     # Passkey authentication demo
│   │   │   ├── GaslessTransfer.tsx # SOL transfer with paymaster
│   │   │   ├── SponsoredMint.tsx   # Token minting demo
│   │   │   └── MessageSign.tsx     # Message signing demo
│   │   ├── ui/                 # Reusable UI components
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Input.tsx
│   │   │   └── Toast.tsx
│   │   └── wallet/             # Wallet-specific components
│   │       ├── ConnectButton.tsx   # Passkey connect button
│   │       └── WalletInfo.tsx      # Wallet details display
│   ├── config/
│   │   └── lazorkit.ts         # SDK configuration
│   ├── hooks/
│   │   └── useTransaction.ts   # Transaction state management
│   ├── App.tsx                 # Main app with LazorkitProvider
│   ├── main.tsx                # Entry point
│   └── index.css               # Global styles
├── docs/
│   ├── tutorial-1-passkey-wallet.md
│   ├── tutorial-2-gasless-transactions.md
│   └── tutorial-3-session-persistence.md
├── vite.config.ts              # Vite config with polyfills
└── package.json
```

---

## 🔧 Key Integration Points

### 1. LazorkitProvider Setup

Wrap your app with `LazorkitProvider` to enable wallet functionality:

```tsx
// App.tsx
import { LazorkitProvider } from '@lazorkit/wallet';

function App() {
  return (
    <LazorkitProvider
      rpcUrl="https://api.devnet.solana.com"
      portalUrl="https://portal.lazor.sh"
      paymasterConfig={{
        paymasterUrl: 'https://kora.devnet.lazorkit.com',
      }}
    >
      <YourApp />
    </LazorkitProvider>
  );
}
```

### 2. useWallet Hook

Access wallet state and methods from any component:

```tsx
import { useWallet } from '@lazorkit/wallet';

function MyComponent() {
  const { 
    connect,           // Trigger passkey authentication
    disconnect,        // Clear session
    isConnected,       // Connection status
    wallet,            // Wallet info (address, credentialId, etc.)
    smartWalletPubkey, // PublicKey object for transactions
    signAndSendTransaction, // Execute gasless transactions
    signMessage,       // Sign arbitrary messages
  } = useWallet();
}
```

### 3. Gasless Transactions

Execute transactions without users paying gas:

```tsx
const { signAndSendTransaction, smartWalletPubkey } = useWallet();

// Build your instruction
const instruction = SystemProgram.transfer({
  fromPubkey: smartWalletPubkey,
  toPubkey: new PublicKey(recipient),
  lamports: 0.01 * LAMPORTS_PER_SOL,
});

// Sign and send - gas is sponsored by paymaster!
const signature = await signAndSendTransaction({
  instructions: [instruction],
  transactionOptions: {
    feeToken: 'USDC', // Optional: pay gas in USDC
  },
});
```

---

## 📖 Tutorials

Learn step-by-step how to integrate each feature:

1. **[Creating a Passkey-Based Wallet](docs/tutorial-1-passkey-wallet.md)**
   - Understanding WebAuthn and passkeys
   - Setting up LazorkitProvider
   - Implementing connect/disconnect

2. **[Gasless Transactions with Paymaster](docs/tutorial-2-gasless-transactions.md)**
   - How paymaster sponsorship works
   - Building transaction instructions
   - Handling transaction lifecycle

3. **[Session Persistence Across Devices](docs/tutorial-3-session-persistence.md)**
   - How sessions are stored
   - Auto-reconnect on page refresh
   - Cross-device authentication

---

## 🏗️ Architecture

### Smart Wallet vs Traditional Wallet

```
┌─────────────────────────────────────────────────────────────────┐
│                    TRADITIONAL WALLET                            │
├─────────────────────────────────────────────────────────────────┤
│  User → Install Extension → Write Seed Phrase → Store Securely  │
│                              ↓                                   │
│  Every Transaction: User pays SOL gas fees                       │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    LAZORKIT SMART WALLET                         │
├─────────────────────────────────────────────────────────────────┤
│  User → Use Biometrics → Passkey Created in Secure Enclave      │
│                              ↓                                   │
│  Smart Wallet PDA derived from passkey public key                │
│                              ↓                                   │
│  Paymaster sponsors gas → User never needs SOL for fees          │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow

```
┌──────────┐    ┌──────────┐    ┌───────────────┐    ┌──────────┐
│   User   │───▶│ Passkey  │───▶│ Smart Wallet  │───▶│  Solana  │
│          │    │ (WebAuthn)│    │    (PDA)      │    │ Network  │
└──────────┘    └──────────┘    └───────────────┘    └──────────┘
     │                                   ▲
     │                                   │
     ▼                                   │
┌──────────┐                    ┌───────────────┐
│  Sign    │───────────────────▶│  Paymaster    │
│ Request  │                    │ (Gas Sponsor) │
└──────────┘                    └───────────────┘
```

---

## ⚠️ Important Notes

### Vite Polyfills (Critical!)

Solana SDKs require Node.js globals (`Buffer`, `process`). This template uses `vite-plugin-node-polyfills`:

```typescript
// vite.config.ts
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      include: ['buffer', 'process', 'util', 'stream', 'events'],
      globals: { Buffer: true, global: true, process: true },
    }),
  ],
});
```

### Devnet vs Mainnet

| Setting | Devnet | Mainnet |
|---------|--------|---------|
| RPC URL | `api.devnet.solana.com` | Your RPC provider |
| Paymaster | `kora.devnet.lazorkit.com` | `kora.mainnet.lazorkit.com` |
| API Key | Not required | Required |

### Troubleshooting Passkeys

| Issue | Solution |
|-------|----------|
| **Windows shows "Insert security key"** | Look for "Use another device" option; use phone to scan QR code |
| **"Operation timed out or not allowed"** | Complete the biometric prompt quickly; check Windows Hello is configured |
| **Popup closes immediately** | Check browser console for errors; try Chrome or Safari |
| **Best platforms for testing** | macOS (Safari/Chrome), iOS (Safari), Android (Chrome) |

> 💡 **Pro Tip:** For the smoothest experience, test on **mobile devices** where passkeys have native OS integration.

---

## 🚀 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Manual Build

```bash
npm run build
# Output in /dist folder
```

---

## 📚 Resources

- **[LazorKit Documentation](https://docs.lazorkit.com)** - Official SDK docs
- **[LazorKit GitHub](https://github.com/lazor-kit/lazor-kit)** - SDK source code
- **[Telegram Community](https://t.me/lazorkit)** - Get help
- **[Twitter](https://twitter.com/lazorkit)** - Updates

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## 📄 License

MIT License - feel free to use this template for your own projects!

---

<p align="center">
  Built with ⚡ by <a href="https://github.com/YOUR_USERNAME">Your Name</a>
  <br/>
  Powered by <a href="https://lazorkit.com">LazorKit</a>
</p>
