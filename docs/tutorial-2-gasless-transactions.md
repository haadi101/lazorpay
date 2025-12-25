# Tutorial 2: Gasless Transactions with Paymaster

> **Time to complete:** 20 minutes  
> **Difficulty:** Intermediate  
> **Prerequisites:** Completed Tutorial 1

---

## Introduction

Traditional blockchain transactions require users to:
1. Own the native token (SOL) for gas fees
2. Understand gas pricing
3. Have enough balance for both the transaction AND gas

**With LazorKit's Paymaster, gas fees are sponsored.** Users can interact with your dApp even with zero SOL balance!

---

## What You'll Learn

- How paymaster sponsorship works
- Building transaction instructions
- Using `signAndSendTransaction`
- Handling transaction lifecycle
- Paying gas in alternative tokens (USDC)

---

## Understanding Paymaster

### What is a Paymaster?

A paymaster is a service that **pays gas fees on behalf of users**:

```
┌─────────────────────────────────────────────────────────────────┐
│                    TRADITIONAL FLOW                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   User ──▶ Sign Transaction ──▶ Pay Gas (SOL) ──▶ Submit        │
│                                      ↑                           │
│                                      │                           │
│                            User must have SOL!                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    PAYMASTER FLOW                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   User ──▶ Sign Transaction ──▶ Paymaster Pays Gas ──▶ Submit   │
│                                        ↑                         │
│                                        │                         │
│                              User pays nothing!                  │
│                           (or pays in USDC instead)              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Why Sponsor Gas?

| Use Case | Benefit |
|----------|---------|
| **Onboarding** | New users can transact immediately |
| **Gaming** | Players focus on gameplay, not gas |
| **DeFi** | Lower barrier to first transaction |
| **NFT Mints** | Frictionless mint experience |

---

## Step 1: Basic SOL Transfer

Let's start with a simple gasless SOL transfer:

```tsx
import { useWallet } from '@lazorkit/wallet';
import { SystemProgram, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';

function TransferDemo() {
  const { signAndSendTransaction, smartWalletPubkey, isConnected } = useWallet();

  const handleTransfer = async () => {
    if (!smartWalletPubkey) return;

    // 1. Create the transfer instruction
    const instruction = SystemProgram.transfer({
      fromPubkey: smartWalletPubkey,  // Your smart wallet
      toPubkey: new PublicKey('RECIPIENT_ADDRESS'),
      lamports: 0.01 * LAMPORTS_PER_SOL,  // 0.01 SOL
    });

    // 2. Sign and send with paymaster
    try {
      const signature = await signAndSendTransaction({
        instructions: [instruction],
      });
      
      console.log('Transaction successful!', signature);
    } catch (error) {
      console.error('Transaction failed:', error);
    }
  };

  if (!isConnected) return <p>Connect wallet first</p>;

  return (
    <button onClick={handleTransfer}>
      Send 0.01 SOL (Gasless!)
    </button>
  );
}
```

### Key Points:

1. **`smartWalletPubkey`** - A `PublicKey` object ready for transactions
2. **`instructions`** - Array of Solana instructions to execute
3. **No gas calculation** - Paymaster handles it automatically

---

## Step 2: Understanding signAndSendTransaction

The `signAndSendTransaction` function accepts a payload object:

```typescript
interface SignAndSendTransactionPayload {
  instructions: TransactionInstruction[];  // Required
  transactionOptions?: {
    feeToken?: string;                    // 'SOL' | 'USDC' | token mint
    addressLookupTableAccounts?: AddressLookupTableAccount[];
    computeUnitLimit?: number;            // Default: auto
    clusterSimulation?: 'devnet' | 'mainnet';
  };
}
```

### Options Explained

| Option | Description | Default |
|--------|-------------|---------|
| `feeToken` | Token to pay gas in (if not fully sponsored) | Paymaster sponsors |
| `computeUnitLimit` | Max compute units | Auto-calculated |
| `clusterSimulation` | Which cluster to simulate on | Based on RPC |

---

## Step 3: Paying Gas in USDC

Users can pay gas in USDC instead of SOL:

```tsx
const signature = await signAndSendTransaction({
  instructions: [instruction],
  transactionOptions: {
    feeToken: 'USDC',  // Pay gas fee in USDC
  },
});
```

This is useful when:
- Users have USDC but no SOL
- You want a consistent fee experience
- Users prefer stablecoin accounting

---

## Step 4: Multi-Instruction Transactions

You can bundle multiple instructions in one transaction:

```tsx
import { 
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  getAssociatedTokenAddress,
} from '@solana/spl-token';

async function transferToken() {
  const { signAndSendTransaction, smartWalletPubkey } = useWallet();
  
  const mint = new PublicKey('TOKEN_MINT_ADDRESS');
  const recipient = new PublicKey('RECIPIENT_ADDRESS');
  
  // Get associated token accounts
  const senderATA = await getAssociatedTokenAddress(mint, smartWalletPubkey);
  const recipientATA = await getAssociatedTokenAddress(mint, recipient);
  
  const instructions = [
    // 1. Create recipient's token account (if doesn't exist)
    createAssociatedTokenAccountInstruction(
      smartWalletPubkey,  // payer
      recipientATA,       // ata to create
      recipient,          // owner
      mint,               // token mint
    ),
    
    // 2. Transfer tokens
    createTransferInstruction(
      senderATA,         // from
      recipientATA,      // to
      smartWalletPubkey, // authority
      1000000,           // amount (with decimals)
    ),
  ];
  
  // Both instructions in one gasless transaction!
  const signature = await signAndSendTransaction({
    instructions,
    transactionOptions: {
      computeUnitLimit: 200000,  // Increase for complex transactions
    },
  });
}
```

---

## Step 5: Handling Transaction Lifecycle

### States to Handle

```tsx
function TransactionButton() {
  const [status, setStatus] = useState<'idle' | 'signing' | 'pending' | 'confirmed' | 'failed'>('idle');
  const { signAndSendTransaction, smartWalletPubkey } = useWallet();

  const handleTransaction = async () => {
    try {
      setStatus('signing');  // User sees passkey prompt
      
      const signature = await signAndSendTransaction({
        instructions: [/* ... */],
      });
      
      setStatus('confirmed');
      console.log('View on explorer:', `https://explorer.solana.com/tx/${signature}?cluster=devnet`);
      
    } catch (error) {
      setStatus('failed');
      
      // Handle specific errors
      if (error.message.includes('User rejected')) {
        console.log('User cancelled the passkey prompt');
      } else if (error.message.includes('insufficient')) {
        console.log('Not enough balance');
      } else {
        console.error('Transaction error:', error);
      }
    }
  };

  return (
    <button onClick={handleTransaction} disabled={status === 'signing'}>
      {status === 'signing' && '🔐 Confirm with Passkey...'}
      {status === 'pending' && '⏳ Processing...'}
      {status === 'confirmed' && '✅ Done!'}
      {status === 'failed' && '❌ Try Again'}
      {status === 'idle' && 'Send Transaction'}
    </button>
  );
}
```

---

## Step 6: Advanced - Custom Compute Budget

For complex transactions (swaps, mints), you may need more compute:

```tsx
import { ComputeBudgetProgram } from '@solana/web3.js';

const signature = await signAndSendTransaction({
  instructions: [
    // Add compute budget instruction FIRST
    ComputeBudgetProgram.setComputeUnitLimit({
      units: 400000,
    }),
    // Then your actual instructions
    ...myInstructions,
  ],
});
```

---

## Full Working Example: Token Transfer

```tsx
import { useState } from 'react';
import { useWallet } from '@lazorkit/wallet';
import { SystemProgram, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';

export function GaslessTransferDemo() {
  const { signAndSendTransaction, smartWalletPubkey, isConnected } = useWallet();
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('0.01');
  const [status, setStatus] = useState('idle');
  const [txSignature, setTxSignature] = useState('');

  const handleTransfer = async () => {
    if (!smartWalletPubkey || !recipient) return;

    setStatus('signing');
    setTxSignature('');

    try {
      // Validate recipient address
      const recipientPubkey = new PublicKey(recipient);

      // Create transfer instruction
      const instruction = SystemProgram.transfer({
        fromPubkey: smartWalletPubkey,
        toPubkey: recipientPubkey,
        lamports: parseFloat(amount) * LAMPORTS_PER_SOL,
      });

      // Execute gasless transaction
      const signature = await signAndSendTransaction({
        instructions: [instruction],
      });

      setTxSignature(signature);
      setStatus('confirmed');
    } catch (error) {
      console.error('Transfer failed:', error);
      setStatus('failed');
    }
  };

  if (!isConnected) {
    return <p>Please connect your wallet first.</p>;
  }

  return (
    <div>
      <h3>Gasless SOL Transfer</h3>
      
      <input
        type="text"
        placeholder="Recipient address"
        value={recipient}
        onChange={(e) => setRecipient(e.target.value)}
      />
      
      <input
        type="number"
        step="0.001"
        placeholder="Amount in SOL"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
      
      <button 
        onClick={handleTransfer}
        disabled={status === 'signing' || !recipient}
      >
        {status === 'signing' ? '🔐 Signing...' : 'Send (Gasless)'}
      </button>

      {status === 'confirmed' && (
        <p>
          ✅ Success!{' '}
          <a 
            href={`https://explorer.solana.com/tx/${txSignature}?cluster=devnet`}
            target="_blank"
          >
            View Transaction
          </a>
        </p>
      )}

      {status === 'failed' && (
        <p>❌ Transaction failed. Please try again.</p>
      )}
    </div>
  );
}
```

---

## Common Errors & Solutions

### "Simulation failed"
```
→ Check that smartWalletPubkey has enough balance for the transfer
→ Verify the recipient address is valid
→ Increase computeUnitLimit for complex transactions
```

### "User rejected the request"
```
→ User cancelled the passkey prompt
→ Handle gracefully with try/catch
```

### "Transaction expired"
```
→ Network congestion or slow RPC
→ Retry the transaction
```

### "Insufficient funds for rent"
```
→ Account creation requires minimum rent
→ Either fund the account or use different approach
```

---

## Summary

✅ Understood how paymaster sponsorship works  
✅ Built single and multi-instruction transactions  
✅ Handled transaction lifecycle states  
✅ Learned to pay gas in alternative tokens  

**Your users can now transact without ever buying SOL for gas!**

---

## Next Steps

- [**Tutorial 3:** Session Persistence →](./tutorial-3-session-persistence.md)
- [Back to README](../README.md)
