/**
 * GaslessTransfer Component
 * 
 * Demonstrates gasless SOL transfers using the LazorKit paymaster.
 * Users can send SOL without holding SOL for gas fees!
 * 
 * Key Learning Points:
 * 1. Paymaster sponsors gas fees
 * 2. User signs with passkey
 * 3. Transaction is executed on-chain
 * 4. No SOL needed for gas (can pay in USDC instead)
 */

import { useState } from 'react';
import { useWallet } from '@lazorkit/wallet';
import { SystemProgram, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { usePatchedWallet } from '../../hooks/usePatchedWallet';
import { getExplorerUrl } from '../../config/lazorkit';
import './demos.css';

// =============================================================================
// COMPONENT
// =============================================================================

export function GaslessTransfer() {
    // Use patched wallet for enhanced error handling
    const { smartWalletPubkey, isConnected } = useWallet();
    const { signAndSendTransaction } = usePatchedWallet();

    // SEPARATE state hooks for 100% reliable React updates
    const [isLoading, setIsLoading] = useState(false);
    const [txError, setTxError] = useState<string | null>(null);
    const [txSignature, setTxSignature] = useState<string | null>(null);

    // Form state
    const [recipient, setRecipient] = useState('');
    const [amount, setAmount] = useState('0.001');

    /**
     * Handle SOL transfer
     */
    const handleTransfer = async () => {
        console.log('▶️ handleTransfer started');
        if (!smartWalletPubkey || !recipient) return;

        // Reset state and start loading
        console.log('🔄 Setting isLoading = true');
        setIsLoading(true);
        setTxError(null);
        setTxSignature(null);

        try {
            console.log('⚡ Starting transaction flow...');
            // Validate recipient address
            let destinationPubkey: PublicKey;
            try {
                destinationPubkey = new PublicKey(recipient);
            } catch {
                throw new Error('Invalid recipient address');
            }

            // Create transfer instruction
            const instruction = SystemProgram.transfer({
                fromPubkey: smartWalletPubkey,
                toPubkey: destinationPubkey,
                lamports: parseFloat(amount) * LAMPORTS_PER_SOL,
            });

            // Sign and send with paymaster
            const sig = await signAndSendTransaction({
                instructions: [instruction],
                transactionOptions: {},
            });

            console.log('✅ Transaction confirmed in component:', sig);
            console.log('🔄 Setting isLoading = false, txSignature =', sig);

            // Update state with success - SEPARATE CALLS
            setIsLoading(false);
            setTxSignature(sig);

            console.log('✅ State updates called!');

        } catch (err) {
            console.error('❌ Transfer failed:', err);
            const errorMessage = err instanceof Error ? err.message : 'Transaction failed';

            console.log('🔄 Setting error state');
            setIsLoading(false);
            setTxError(errorMessage);
        }
    };

    // Show connect prompt if not connected
    if (!isConnected) {
        return (
            <Card
                title="💸 Gasless SOL Transfer"
                subtitle="Send SOL without paying gas fees"
                className="demo-card"
            >
                <div className="demo-connect-prompt">
                    <p>Connect your wallet to try gasless transfers</p>
                </div>
            </Card>
        );
    }

    return (
        <Card
            title="💸 Gasless SOL Transfer"
            subtitle="Send SOL without paying gas fees"
            className="demo-card"
        >
            {/* Transfer Form */}
            <div className="demo-section">
                <h4 className="demo-section-title">Send SOL</h4>

                <div className="demo-form">
                    <Input
                        label="Recipient Address"
                        placeholder="Enter Solana address..."
                        value={recipient}
                        onChange={(e) => setRecipient(e.target.value)}
                        helperText="Any valid Solana address on Devnet"
                    />

                    <Input
                        label="Amount (SOL)"
                        type="number"
                        step="0.001"
                        min="0.001"
                        placeholder="0.001"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        helperText="Minimum: 0.001 SOL"
                    />

                    <Button
                        variant="primary"
                        fullWidth
                        isLoading={isLoading}
                        onClick={handleTransfer}
                        disabled={!recipient || !amount}
                    >
                        {isLoading ? 'Signing with Passkey...' : 'Send Gasless Transfer'}
                    </Button>
                </div>
            </div>

            {/* Error Display */}
            {txError && (
                <div className="demo-error">
                    <strong>Error:</strong> {txError}
                </div>
            )}

            {/* Success Display */}
            {txSignature && (
                <div className="demo-success">
                    <div className="success-icon">✓</div>
                    <div className="success-content">
                        <h5>Transfer Successful!</h5>
                        <a
                            href={getExplorerUrl(txSignature)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="explorer-link"
                        >
                            View on Solana Explorer ↗
                        </a>
                    </div>
                </div>
            )}

            {/* How It Works */}
            <div className="demo-section">
                <h4 className="demo-section-title">How Gasless Works</h4>
                <div className="demo-info-grid">
                    <div className="info-item">
                        <span className="info-icon">1️⃣</span>
                        <span className="info-text">You build the transaction</span>
                    </div>
                    <div className="info-item">
                        <span className="info-icon">2️⃣</span>
                        <span className="info-text">Sign with your passkey</span>
                    </div>
                    <div className="info-item">
                        <span className="info-icon">3️⃣</span>
                        <span className="info-text">Paymaster pays gas fee</span>
                    </div>
                    <div className="info-item">
                        <span className="info-icon">4️⃣</span>
                        <span className="info-text">Transaction confirmed!</span>
                    </div>
                </div>
            </div>

            {/* Code Example */}
            <div className="demo-section">
                <h4 className="demo-section-title">Code Example</h4>
                <div className="demo-code-block">
                    <pre>{`const { signAndSendTransaction, smartWalletPubkey } = useWallet();

// Create transfer instruction
const instruction = SystemProgram.transfer({
  fromPubkey: smartWalletPubkey,
  toPubkey: new PublicKey(recipient),
  lamports: 0.001 * LAMPORTS_PER_SOL,
});

// Sign and send - gas is sponsored!
const signature = await signAndSendTransaction({
  instructions: [instruction],
});`}</pre>
                </div>
            </div>
        </Card>
    );
}
