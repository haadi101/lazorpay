/**
 * PasskeyDemo Component
 * 
 * Demonstrates the passkey authentication flow with visual feedback.
 * This is the first demo users will see - it shows how simple
 * onboarding becomes with LazorKit.
 * 
 * Key Learning Points:
 * 1. No seed phrases or private keys
 * 2. Biometric authentication (Face ID, Touch ID, Windows Hello)
 * 3. Session persistence across page refreshes
 * 4. Smart wallet creation is automatic
 */

import { useWallet } from '@lazorkit/wallet';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import './demos.css';

// =============================================================================
// COMPONENT
// =============================================================================

export function PasskeyDemo() {
    const {
        connect,
        disconnect,
        isConnected,
        isConnecting,
        wallet
    } = useWallet();

    // Steps shown to user explaining the flow
    const steps = [
        {
            number: 1,
            title: 'Click Connect',
            description: 'Triggers the LazorKit authentication portal',
            status: isConnected ? 'complete' : isConnecting ? 'active' : 'pending',
        },
        {
            number: 2,
            title: 'Authenticate with Biometrics',
            description: 'Use Face ID, Touch ID, or Windows Hello',
            status: isConnected ? 'complete' : 'pending',
        },
        {
            number: 3,
            title: 'Smart Wallet Created',
            description: 'A Solana smart wallet (PDA) is derived from your passkey',
            status: isConnected ? 'complete' : 'pending',
        },
    ];

    return (
        <Card
            title="🔐 Passkey Authentication"
            subtitle="Seed phrase-free login with biometrics"
            className="demo-card"
        >
            {/* How It Works Section */}
            <div className="demo-section">
                <h4 className="demo-section-title">How It Works</h4>

                <div className="demo-steps">
                    {steps.map((step) => (
                        <div
                            key={step.number}
                            className={`demo-step demo-step-${step.status}`}
                        >
                            <div className="step-number">
                                {step.status === 'complete' ? '✓' : step.number}
                            </div>
                            <div className="step-content">
                                <span className="step-title">{step.title}</span>
                                <span className="step-description">{step.description}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Action Section */}
            <div className="demo-section">
                <h4 className="demo-section-title">Try It</h4>

                {!isConnected ? (
                    <div className="demo-action">
                        <Button
                            variant="primary"
                            size="lg"
                            fullWidth
                            isLoading={isConnecting}
                            onClick={() => connect({ feeMode: 'paymaster' })}
                            leftIcon={!isConnecting && <span>🔐</span>}
                        >
                            {isConnecting ? 'Opening Passkey Portal...' : 'Connect with Passkey'}
                        </Button>
                        <p className="demo-hint">
                            This will open the LazorKit portal where you can create or use an existing passkey.
                        </p>
                    </div>
                ) : (
                    <div className="demo-success">
                        <div className="success-icon">✓</div>
                        <div className="success-content">
                            <h5>Successfully Connected!</h5>
                            <p>Your smart wallet address:</p>
                            <code className="wallet-address-code">{wallet?.smartWallet}</code>
                        </div>
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => disconnect()}
                        >
                            Disconnect to Try Again
                        </Button>
                    </div>
                )}
            </div>

            {/* Technical Details */}
            <div className="demo-section">
                <h4 className="demo-section-title">Under the Hood</h4>
                <div className="demo-code-block">
                    <pre>{`// 1. Import the hook
import { useWallet } from '@lazorkit/wallet';

// 2. Use in your component
const { connect, wallet } = useWallet();

// 3. Trigger authentication
await connect({ feeMode: 'paymaster' });

// 4. Access wallet info
console.log(wallet.smartWallet); // Your Solana address`}</pre>
                </div>
            </div>
        </Card>
    );
}
