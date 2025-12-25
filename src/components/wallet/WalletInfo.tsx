/**
 * WalletInfo Component
 * 
 * Displays detailed information about the connected wallet.
 * Shows smart wallet address, credential info, and balance.
 * 
 * This component demonstrates how to access wallet data from LazorKit.
 */

import { useWallet } from '@lazorkit/wallet';
import { useEffect, useState } from 'react';
import { Connection, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { Card } from '../ui/Card';
import { ACTIVE_NETWORK, getAccountExplorerUrl, truncateAddress } from '../../config/lazorkit';
import './WalletInfo.css';

// =============================================================================
// TYPES
// =============================================================================

interface WalletBalance {
    sol: number;
    isLoading: boolean;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function WalletInfo() {
    const { wallet, isConnected, smartWalletPubkey } = useWallet();
    const [balance, setBalance] = useState<WalletBalance>({ sol: 0, isLoading: true });

    // Fetch SOL balance when wallet connects
    useEffect(() => {
        if (!smartWalletPubkey) {
            setBalance({ sol: 0, isLoading: false });
            return;
        }

        const fetchBalance = async () => {
            setBalance(prev => ({ ...prev, isLoading: true }));

            try {
                const connection = new Connection(ACTIVE_NETWORK.rpcUrl);
                const lamports = await connection.getBalance(smartWalletPubkey);
                setBalance({ sol: lamports / LAMPORTS_PER_SOL, isLoading: false });
            } catch (error) {
                console.error('Failed to fetch balance:', error);
                setBalance({ sol: 0, isLoading: false });
            }
        };

        fetchBalance();

        // Refresh balance every 30 seconds
        const interval = setInterval(fetchBalance, 30000);
        return () => clearInterval(interval);
    }, [smartWalletPubkey]);

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
                        {balance.isLoading ? (
                            <span className="balance-loading">Loading...</span>
                        ) : (
                            <>
                                <span className="balance-amount">{balance.sol.toFixed(4)}</span>
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
                    <a
                        href={getAccountExplorerUrl(wallet.smartWallet)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="row-value row-link"
                    >
                        {truncateAddress(wallet.smartWallet, 8)}
                        <span className="link-icon">↗</span>
                    </a>
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
