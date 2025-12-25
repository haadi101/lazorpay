/**
 * MessageSign Component
 * 
 * Demonstrates message signing with passkey authentication.
 * Useful for:
 * - Login verification
 * - Off-chain signatures
 * - Proving wallet ownership
 * 
 * Key Learning Points:
 * 1. signMessage() for arbitrary data signing
 * 2. Passkey provides cryptographic proof
 * 3. Signature can be verified on-chain or off-chain
 */

import { useState } from 'react';
import { useWallet } from '@lazorkit/wallet';
import { usePatchedWallet } from '../../hooks/usePatchedWallet';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import './demos.css';

// =============================================================================
// COMPONENT
// =============================================================================

export function MessageSign() {
    // Use patched wallet for normalized signatures
    const { isConnected, wallet } = useWallet();
    const { signMessage } = usePatchedWallet();

    const [message, setMessage] = useState('Hello from LazorKit! 🚀');
    const [signature, setSignature] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /**
     * Handle message signing
     * 
     * signMessage() encodes the message and triggers passkey authentication.
     * The resulting signature proves the wallet owner signed the message.
     */
    const handleSign = async () => {
        if (!message) return;

        setIsLoading(true);
        setError(null);
        setSignature(null);

        try {
            // Convert message to string for signing
            // LazorKit signMessage expects a string message
            const result = await signMessage(message);

            // The result contains the signature string
            // Display it directly
            setSignature(result.signature);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to sign message');
        } finally {
            setIsLoading(false);
        }
    };

    // Show connect prompt if not connected
    if (!isConnected) {
        return (
            <Card
                title="✍️ Message Signing"
                subtitle="Sign arbitrary messages with your passkey"
                className="demo-card"
            >
                <div className="demo-connect-prompt">
                    <p>Connect your wallet to try message signing</p>
                </div>
            </Card>
        );
    }

    return (
        <Card
            title="✍️ Message Signing"
            subtitle="Sign arbitrary messages with your passkey"
            className="demo-card"
        >
            {/* Sign Form */}
            <div className="demo-section">
                <h4 className="demo-section-title">Sign a Message</h4>

                <div className="demo-form">
                    <Input
                        label="Message to Sign"
                        placeholder="Enter your message..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        helperText="Any text you want to sign"
                    />

                    <Button
                        variant="primary"
                        fullWidth
                        isLoading={isLoading}
                        onClick={handleSign}
                        disabled={!message}
                    >
                        {isLoading ? 'Authenticating...' : 'Sign Message'}
                    </Button>
                </div>
            </div>

            {/* Error Display */}
            {error && (
                <div className="demo-error">
                    <strong>Error:</strong> {error}
                </div>
            )}

            {/* Signature Display */}
            {signature && (
                <div className="demo-section">
                    <h4 className="demo-section-title">Signature Result</h4>
                    <div className="signature-result">
                        <div className="signature-item">
                            <span className="signature-label">Signer</span>
                            <code className="signature-value">{wallet?.smartWallet}</code>
                        </div>
                        <div className="signature-item">
                            <span className="signature-label">Message</span>
                            <code className="signature-value">{message}</code>
                        </div>
                        <div className="signature-item">
                            <span className="signature-label">Signature (Base64)</span>
                            <code className="signature-value signature-long">{signature}</code>
                        </div>
                    </div>
                </div>
            )}

            {/* Use Cases */}
            <div className="demo-section">
                <h4 className="demo-section-title">Use Cases</h4>
                <div className="demo-info-grid">
                    <div className="info-item">
                        <span className="info-icon">🔑</span>
                        <span className="info-text">Login verification</span>
                    </div>
                    <div className="info-item">
                        <span className="info-icon">📝</span>
                        <span className="info-text">Terms acceptance</span>
                    </div>
                    <div className="info-item">
                        <span className="info-icon">🎫</span>
                        <span className="info-text">NFT claims</span>
                    </div>
                    <div className="info-item">
                        <span className="info-icon">✅</span>
                        <span className="info-text">Ownership proof</span>
                    </div>
                </div>
            </div>

            {/* Code Example */}
            <div className="demo-section">
                <h4 className="demo-section-title">Code Example</h4>
                <div className="demo-code-block">
                    <pre>{`const { signMessage } = useWallet();

// Convert message to bytes
const messageBytes = new TextEncoder().encode('Hello!');

// Sign with passkey authentication
const signature = await signMessage(messageBytes);

// Signature can be verified off-chain or on-chain`}</pre>
                </div>
            </div>
        </Card>
    );
}
