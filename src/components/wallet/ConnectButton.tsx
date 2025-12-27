/**
 * ConnectButton Component
 * 
 * The primary authentication button for LazorKit passkey login.
 * Handles both connection and disconnection flows.
 * 
 * @example
 * ```tsx
 * import { ConnectButton } from './components/wallet/ConnectButton';
 * 
 * function App() {
 *   return <ConnectButton />;
 * }
 * ```
 * 
 * @see https://docs.lazorkit.com/react-sdk/use-wallet
 */

import { useWallet } from '@lazorkit/wallet';
import { Button } from '../ui/Button';
import { Fingerprint } from 'lucide-react';
import { truncateAddress } from '../../config/lazorkit';
import { Toast, type ToastProps } from '../ui/Toast';
import { useState } from 'react';
import './ConnectButton.css';

// =============================================================================
// COMPONENT
// =============================================================================

export function ConnectButton() {
    // Get wallet state and methods from LazorKit
    const {
        connect,
        disconnect,
        isConnected,
        isConnecting,
        wallet
    } = useWallet();

    const [toast, setToast] = useState<ToastProps | null>(null);

    /**
     * Handle wallet connection
     * 
     * The connect() method will:
     * 1. Check for existing session (auto-reconnect)
     * 2. If no session, open LazorKit portal for passkey auth
     * 3. Create/retrieve smart wallet PDA
     * 4. Return WalletInfo object
     * 
     * feeMode: 'paymaster' means gas fees are sponsored
     */
    const handleConnect = async () => {
        try {
            await connect({ feeMode: 'paymaster' });
        } catch (error: unknown) {

            // Provide user-friendly error messages
            const errorMessage = error instanceof Error ? error.message : String(error);

            if (errorMessage.includes('cancelled') || errorMessage.includes('canceled')) {
                setToast({ message: 'Connection cancelled', type: 'info' });
            } else if (errorMessage.includes('timeout')) {
                setToast({ message: 'Connection timed out. Please try again.', type: 'error' });
            } else if (errorMessage.includes('not allowed')) {
                setToast({ message: 'Passkey creation was blocked.', type: 'error' });
            } else {
                setToast({ message: `Connection failed: ${errorMessage}`, type: 'error' });
            }
        }
    };

    /**
     * Handle wallet disconnection
     * 
     * This clears the local session but does NOT revoke the passkey.
     * User can reconnect instantly with the same passkey.
     */
    const handleDisconnect = async () => {
        try {
            await disconnect();
        } catch (error) {
            console.error('Failed to disconnect:', error);
        }
    };

    // =============================================================================
    // RENDER: Connected State
    // =============================================================================

    if (isConnected && wallet) {
        return (
            <div className="connect-button-connected">
                {/* Wallet address pill */}
                <div className="wallet-address-pill">
                    <span className="wallet-dot" />
                    <span className="wallet-address">
                        {truncateAddress(wallet.smartWallet)}
                    </span>
                </div>

                {/* Disconnect button */}
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDisconnect}
                >
                    Disconnect
                </Button>
            </div>
        );
    }

    // =============================================================================
    // RENDER: Disconnected State
    // =============================================================================

    return (
        <>
            <Button
                variant="primary"
                size="md"
                onClick={handleConnect}
                isLoading={isConnecting}
                leftIcon={!isConnecting && <Fingerprint size={18} strokeWidth={1.5} />}
            >
                {isConnecting ? 'Authenticating...' : 'Connect with Passkey'}
            </Button>
            {toast && (
                <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 1000 }}>
                    <Toast
                        {...toast}
                        onClose={() => setToast(null)}
                    />
                </div>
            )}
        </>
    );
}
