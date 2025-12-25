/**
 * WalletInfo Component
 * 
 * Displays detailed information about the connected wallet.
 * Shows smart wallet address, credential info, and balance.
 * 
 * This component demonstrates how to access wallet data from LazorKit.
 */

import { useWallet } from '@lazorkit/wallet';
import { useState } from 'react';
import { Card } from '../ui/Card';
import { ACTIVE_NETWORK, getAccountExplorerUrl, truncateAddress } from '../../config/lazorkit';
import { useSolanaBalance } from '../../hooks/useSolanaBalance';
import './WalletInfo.css';

// =============================================================================
// COMPONENT
// =============================================================================

export function WalletInfo() {
    const { wallet, isConnected, smartWalletPubkey } = useWallet();
    const [copied, setCopied] = useState(false);

    // Use the production-grade balance hook
    const { sol, isLoading } = useSolanaBalance(smartWalletPubkey, {
        refreshInterval: 60000, // Refresh every 60 seconds
        maxRetries: 3,
        autoRefresh: true,
    });

    // Copy wallet address to clipboard
    const copyAddress = async () => {
        if (!wallet?.smartWallet) return;

        try {
            await navigator.clipboard.writeText(wallet.smartWallet);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    // Don't render if not connected
    if (!isConnected || !wallet) {
        return null;
    }

    return (
        <Card className="wallet-info" glow>
            {/* Header with balance */}
            <div className="wallet-info-header">
                <div className="wallet-info-balance">
                    <span className="balance-label">Smart Wallet Balance</span>
                    <span className="balance-value">
                        {isLoading ? (
                            <span className="balance-skeleton" />
                        ) : (
                            <>
                                <span className="balance-amount">{sol.toFixed(4)}</span>
                                <span className="balance-symbol">SOL</span>
                            </>
                        )}
                    </span>
                </div>
                <div className="wallet-info-network">
                    <span className="network-dot" />
                    {ACTIVE_NETWORK.name}
                </div>
            </div>

            {/* Wallet details */}
            <div className="wallet-info-details">
                {/* Smart Wallet Address - This is your main Solana address */}
                <div className="wallet-info-row">
                    <span className="row-label">Smart Wallet</span>
                    <div className="row-value-group">
                        <a
                            href={getAccountExplorerUrl(wallet.smartWallet)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="row-value row-link"
                        >
                            {truncateAddress(wallet.smartWallet, 8)}
                            <span className="link-icon">↗</span>
                        </a>
                        <button
                            className={`copy-btn ${copied ? 'copied' : ''}`}
                            onClick={copyAddress}
                            title="Copy address"
                        >
                            {copied ? '✓' : '📋'}
                        </button>
                    </div>
                </div>

                {/* Platform info */}
                <div className="wallet-info-row">
                    <span className="row-label">Platform</span>
                    <span className="row-value">{wallet.platform || 'Web'}</span>
                </div>

                {/* Account name if available */}
                {wallet.accountName && (
                    <div className="wallet-info-row">
                        <span className="row-label">Account Name</span>
                        <span className="row-value">{wallet.accountName}</span>
                    </div>
                )}

                {/* Credential ID (truncated) */}
                <div className="wallet-info-row">
                    <span className="row-label">Credential ID</span>
                    <span className="row-value row-mono">
                        {wallet.credentialId.slice(0, 16)}...
                    </span>
                </div>
            </div>

            {/* Info footer */}
            <div className="wallet-info-footer">
                <p>
                    💡 This smart wallet is controlled by your passkey.
                    No seed phrase needed!
                </p>
            </div>
        </Card>
    );
}
