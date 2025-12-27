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
import { SystemProgram, PublicKey, LAMPORTS_PER_SOL, Connection } from '@solana/web3.js';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { usePatchedWallet } from '../../hooks/usePatchedWallet';
import { getExplorerUrl, ACTIVE_NETWORK } from '../../config/lazorkit';
import { ArrowRightLeft, CheckCircle, ExternalLink } from 'lucide-react';
import './demos.css';

// =============================================================================
// UTILITIES
// =============================================================================

/**
 * Convert SOL string to lamports using string parsing (avoids floating point errors)
 * Example: "0.1" -> 100000000n
 */
/**
 * Convert SOL string to lamports safely.
 * Uses string manipulation to avoid floating point errors.
 * Handles both '.' and ',' decimal separators.
 */
function solToLamports(sol: string): bigint {
    // Normalize decimal separator
    const normalized = sol.replace(',', '.').trim();
    const [whole = '0', frac = ''] = normalized.split('.');
    const fracPadded = frac.padEnd(9, '0').slice(0, 9);
    return BigInt(whole + fracPadded);
}

// =============================================================================
// COMPONENT
// =============================================================================

export function GaslessTransfer() {
    // Use patched wallet for enhanced error handling
    const { smartWalletPubkey, isConnected } = useWallet();
    const { signAndSendTransaction } = usePatchedWallet();

    // State with forced sync updates
    const [isLoading, setIsLoading] = useState(false);
    const [txError, setTxError] = useState<string | null>(null);
    const [txSignature, setTxSignature] = useState<string | null>(null);

    // Form state
    const [recipient, setRecipient] = useState('');
    const [amount, setAmount] = useState('0.001');

    /**
     * Handle SOL transfer with balance validation
     */
    const handleTransfer = async () => {
        if (!smartWalletPubkey || !recipient) return;

        setIsLoading(true);
        setTxError(null);
        setTxSignature(null);

        try {
            // Validate recipient address
            let destinationPubkey: PublicKey;
            try {
                destinationPubkey = new PublicKey(recipient);
            } catch (e) {
                const msg = e instanceof Error ? e.message : 'Unknown error';
                throw new Error(`Invalid recipient address: ${msg}`);
            }

            // Convert SOL to lamports using safe BigInt
            const lamports = solToLamports(amount);
            if (lamports <= 0n) {
                throw new Error('Amount must be greater than 0');
            }

            // Check balance before attempting transfer
            const connection = new Connection(ACTIVE_NETWORK.rpcUrl);
            const balance = await connection.getBalance(smartWalletPubkey);

            // balance is number (lamports), lamports is bigint. Compare safely.
            if (BigInt(balance) < lamports) {
                throw new Error(
                    `Insufficient balance. You have ${(balance / LAMPORTS_PER_SOL).toFixed(4)} SOL ` +
                    `but trying to send ${amount} SOL`
                );
            }

            // Create transfer instruction
            const instruction = SystemProgram.transfer({
                fromPubkey: smartWalletPubkey,
                toPubkey: destinationPubkey,
                lamports,
            });

            // Sign and send with paymaster
            const sig = await signAndSendTransaction({
                instructions: [instruction],
                transactionOptions: {},
            });

            setTxSignature(sig);

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Transaction failed';
            setTxError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    // Show connect prompt if not connected
    if (!isConnected) {
        return (
            <Card
                title="Gasless SOL Transfer"
                subtitle="Send SOL without paying gas fees"
                className="demo-card"
                icon={<ArrowRightLeft size={20} strokeWidth={1.5} className="text-emerald-400" />}
            >
                <div className="demo-connect-prompt">
                    <p>Connect your wallet to try gasless transfers</p>
                </div>
            </Card>
        );
    }

    return (
        <Card
            title="Gasless SOL Transfer"
            subtitle="Send SOL without paying gas fees"
            className="demo-card"
            icon={<ArrowRightLeft size={20} strokeWidth={1.5} className="text-emerald-400" />}
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
                        onChange={(e) => {
                            const val = e.target.value;
                            // Sanitize input: allow empty or valid decimals (up to 9 places)
                            if (val === '' || /^\d*\.?\d{0,9}$/.test(val)) {
                                setAmount(val);
                            }
                        }}
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
                    <div className="success-icon">
                        <CheckCircle size={24} strokeWidth={1.5} className="text-emerald-400" />
                    </div>
                    <div className="success-content">
                        <h5>Transfer Successful!</h5>
                        <a
                            href={getExplorerUrl(txSignature)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="explorer-link group"
                        >
                            View on Solana Explorer
                            <ExternalLink size={14} strokeWidth={1.5} className="ml-1 group-hover:translate-x-0.5 transition-transform" />
                        </a>
                    </div>
                </div>
            )}

            {/* How It Works */}
            <div className="demo-section">
                <h4 className="demo-section-title">How Gasless Works</h4>
                <div className="demo-info-grid">
                    <div className="info-item">
                        <span className="info-step">1</span>
                        <span className="info-text">You build the transaction</span>
                    </div>
                    <div className="info-item">
                        <span className="info-step">2</span>
                        <span className="info-text">Sign with your passkey</span>
                    </div>
                    <div className="info-item">
                        <span className="info-step">3</span>
                        <span className="info-text">Paymaster pays gas fee</span>
                    </div>
                    <div className="info-item">
                        <span className="info-step">4</span>
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
