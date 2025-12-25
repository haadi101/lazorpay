# Tutorial 3: Session Persistence Across Devices

> **Time to complete:** 10 minutes  
> **Difficulty:** Beginner  
> **Prerequisites:** Completed Tutorial 1

---

## Introduction

One of LazorKit's best features is **seamless session persistence**. When users authenticate once, they stay logged in:

- ✅ Page refreshes don't log them out
- ✅ Closing and reopening the browser works
- ✅ Same passkey works across synced devices (iCloud Keychain, Google Password Manager)

---

## What You'll Learn

- How LazorKit stores sessions
- Implementing auto-reconnect
- Cross-device authentication
- Security considerations

---

## How Sessions Work

### Session Storage

When a user connects, LazorKit stores session data in **localStorage**:

```
┌─────────────────────────────────────────────────────────────────┐
│                    SESSION STORAGE                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   localStorage {                                                 │
│     'lazorkit:session': {                                       │
│       credentialId: 'abc123...',     // WebAuthn credential ID  │
│       smartWallet: '7xKz3nQe...',    // Solana address          │
│       walletDevice: '9yLm4oPr...',   // Device PDA              │
│       platform: 'web'                 // Platform info          │
│     }                                                            │
│   }                                                              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### What's NOT Stored

❌ Private keys (never leave Secure Enclave)  
❌ Raw passkey data  
❌ Sensitive credentials  

Only **public identifiers** are stored locally. The actual cryptographic operations always happen in the device's secure hardware.

---

## Auto-Reconnect on Page Load

LazorKit automatically attempts to restore sessions:

```tsx
import { useEffect } from 'react';
import { useWallet } from '@lazorkit/wallet';

function App() {
  const { connect, isConnected, isConnecting } = useWallet();

  // Optional: Trigger reconnect on mount
  useEffect(() => {
    // connect() will silently restore session if one exists
    // No popup shown if session is valid
    connect({ feeMode: 'paymaster' }).catch(() => {
      // No existing session, user needs to authenticate
      console.log('No existing session');
    });
  }, []);

  if (isConnecting) {
    return <p>Reconnecting...</p>;
  }

  if (isConnected) {
    return <p>Welcome back!</p>;
  }

  return <button onClick={() => connect()}>Connect</button>;
}
```

### Connect Behavior

| Scenario | What Happens |
|----------|--------------|
| Fresh visit (no session) | Opens portal for passkey auth |
| Returning visit (session exists) | Silent reconnect, no popup |
| Session expired | Opens portal to re-authenticate |

---

## Cross-Device Authentication

Passkeys can sync across devices through platform keychain services:

### Apple Devices (iCloud Keychain)
```
iPhone → iCloud Keychain → MacBook → iPad
    └─────── Passkey synced automatically ───────┘
```

### Google Devices (Password Manager)
```
Android → Google Account → Chrome Desktop
    └─────── Passkey synced automatically ────┘
```

### Windows (Windows Hello)
```
Windows PC → Microsoft Account → Other Windows PCs
    └─────── Passkey synced (if enabled) ─────┘
```

### How It Works

1. User creates passkey on Device A
2. Passkey syncs via platform keychain
3. User visits your app on Device B
4. Clicks "Connect" → Uses synced passkey
5. Same smart wallet, same address!

```tsx
// Same code works on any device!
const { connect, wallet } = useWallet();

await connect({ feeMode: 'paymaster' });

// wallet.smartWallet is the SAME address regardless of device
console.log(wallet.smartWallet); // Always the same!
```

---

## Implementing Session Awareness

### Check Session Status

```tsx
import { useWallet } from '@lazorkit/wallet';

function SessionStatus() {
  const { isConnected, wallet } = useWallet();

  return (
    <div>
      <p>Session Active: {isConnected ? '✅ Yes' : '❌ No'}</p>
      {wallet && (
        <>
          <p>Wallet: {wallet.smartWallet.slice(0, 8)}...</p>
          <p>Platform: {wallet.platform}</p>
        </>
      )}
    </div>
  );
}
```

### Handle Session Expiry

Sessions may expire. Handle gracefully:

```tsx
function ProtectedContent() {
  const { isConnected, connect } = useWallet();
  const [error, setError] = useState(null);

  const ensureConnected = async () => {
    if (!isConnected) {
      try {
        await connect({ feeMode: 'paymaster' });
      } catch (err) {
        setError('Please reconnect your wallet');
      }
    }
  };

  const handleAction = async () => {
    await ensureConnected();
    if (!isConnected) return;
    
    // Proceed with action...
  };

  return (
    <>
      {error && <p className="error">{error}</p>}
      <button onClick={handleAction}>Do Something</button>
    </>
  );
}
```

---

## Clearing Sessions

### User-Initiated Disconnect

```tsx
const { disconnect } = useWallet();

// Clears local session
// Does NOT revoke the passkey
await disconnect();
```

### After Disconnect

- User will need to re-authenticate with passkey
- But same passkey = same smart wallet address
- No data loss, just re-verification

### Full Logout (Clear Everything)

```tsx
const handleFullLogout = async () => {
  const { disconnect } = useWallet();
  
  // Clear LazorKit session
  await disconnect();
  
  // Clear any app-specific data
  localStorage.removeItem('myapp:user-preferences');
  sessionStorage.clear();
};
```

---

## Security Best Practices

### 1. Session Validation

Always verify the session is valid before sensitive operations:

```tsx
const handleSensitiveAction = async () => {
  const { isConnected, wallet, signAndSendTransaction } = useWallet();
  
  // Always check connection state
  if (!isConnected || !wallet) {
    throw new Error('Please connect your wallet');
  }
  
  // Proceed...
};
```

### 2. Don't Store Sensitive Data with Session

```tsx
// ❌ BAD - Don't store sensitive info based on session
localStorage.setItem('user-secret', sensitiveData);

// ✅ GOOD - Use session only for auth state
const { isConnected, wallet } = useWallet();
if (isConnected) {
  // Fetch sensitive data from secure backend
  const data = await fetchUserData(wallet.smartWallet);
}
```

### 3. Handle Session Hijacking

The passkey model is inherently resistant to session hijacking because:
- Private keys never leave the device
- Each transaction requires biometric re-authentication
- Stolen localStorage data is useless without the physical device

---

## Full Example: Persistent Wallet Connection

```tsx
import { useState, useEffect } from 'react';
import { LazorkitProvider, useWallet } from '@lazorkit/wallet';

function WalletManager() {
  const { 
    connect, 
    disconnect, 
    isConnected, 
    isConnecting, 
    wallet 
  } = useWallet();
  
  const [hasTriedReconnect, setHasTriedReconnect] = useState(false);

  // Try to restore session on mount
  useEffect(() => {
    if (!isConnected && !isConnecting && !hasTriedReconnect) {
      setHasTriedReconnect(true);
      connect({ feeMode: 'paymaster' }).catch(() => {
        // No existing session - that's okay
      });
    }
  }, [isConnected, isConnecting, hasTriedReconnect]);

  // Show loading during reconnect attempt
  if (isConnecting) {
    return (
      <div className="wallet-status">
        <span className="spinner" />
        <p>Reconnecting...</p>
      </div>
    );
  }

  // Connected state
  if (isConnected && wallet) {
    return (
      <div className="wallet-connected">
        <div className="wallet-info">
          <span className="status-dot active" />
          <span>{wallet.smartWallet.slice(0, 6)}...{wallet.smartWallet.slice(-4)}</span>
        </div>
        <button onClick={disconnect} className="btn-disconnect">
          Disconnect
        </button>
      </div>
    );
  }

  // Disconnected state
  return (
    <button onClick={() => connect({ feeMode: 'paymaster' })} className="btn-connect">
      🔐 Connect with Passkey
    </button>
  );
}

export default function App() {
  return (
    <LazorkitProvider
      rpcUrl="https://api.devnet.solana.com"
      portalUrl="https://portal.lazor.sh"
      paymasterConfig={{ paymasterUrl: 'https://kora.devnet.lazorkit.com' }}
    >
      <header>
        <h1>My dApp</h1>
        <WalletManager />
      </header>
      <main>
        {/* Your app content */}
      </main>
    </LazorkitProvider>
  );
}
```

---

## Troubleshooting

### Session Not Persisting

```
→ Check if localStorage is available (not in incognito/private mode)
→ Verify LazorkitProvider is at the root of your app
→ Check browser console for errors
```

### Cross-Device Not Working

```
→ Ensure passkey is synced (check keychain/password manager)
→ Use same platform account (Apple ID, Google Account)
→ Some platforms don't sync by default - check settings
```

### "Different wallet on different device"

```
→ User may have created separate passkeys
→ Each unique passkey = unique smart wallet
→ This is expected - passkeys are per-credential
```

---

## Summary

✅ Understood how LazorKit stores session data  
✅ Implemented auto-reconnect on page load  
✅ Learned about cross-device passkey sync  
✅ Applied security best practices  

**Your users now enjoy a seamless, persistent authentication experience across sessions and devices!**

---

## Complete Tutorial Series

You've completed all three tutorials! You now know how to:

1. ✅ [Create passkey-based wallets](./tutorial-1-passkey-wallet.md)
2. ✅ [Execute gasless transactions](./tutorial-2-gasless-transactions.md)
3. ✅ [Handle session persistence](./tutorial-3-session-persistence.md)

---

## Next Steps

- Explore the [demo components](../src/components/demos/) for more examples
- Read the [LazorKit documentation](https://docs.lazorkit.com)
- Join the [Telegram community](https://t.me/lazorkit) for help
- [Back to README](../README.md)
