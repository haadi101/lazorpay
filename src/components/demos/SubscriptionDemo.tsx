import { useState } from 'react';
import { Connection, PublicKey } from '@solana/web3.js';
import type { ParsedAccountData } from '@solana/web3.js';
import {
    getAssociatedTokenAddress,
    createApproveInstruction
} from '@solana/spl-token';
import { Zap, Shield, CheckCircle, AlertCircle, Sparkles, ExternalLink } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Toast } from '../ui/Toast';

import { useWallet } from '@lazorkit/wallet';
import { usePatchedWallet } from '../../hooks/usePatchedWallet';
import { useTransaction } from '../../hooks/useTransaction';
import { ACTIVE_NETWORK, getActiveTokens, getExplorerUrl } from '../../config/lazorkit';
import { SUBSCRIPTION_PRICE_USDC, SERVICE_WALLET_PUBKEY } from '../../config/constants';
import './demos.css';

export function SubscriptionDemo() {
    const { smartWalletPubkey } = useWallet();
    const { signAndSendTransaction } = usePatchedWallet();
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [showSuccessToast, setShowSuccessToast] = useState(false);
    const { execute, isLoading, error, lastSignature } = useTransaction();

    const handleSubscribe = async () => {
        if (!smartWalletPubkey) {
            alert("Please connect your wallet first!");
            return;
        }

        try {
            await execute(async () => {
                const connection = new Connection(ACTIVE_NETWORK.rpcUrl, 'confirmed');
                const tokens = getActiveTokens();
                const usdcMint = new PublicKey(tokens.USDC.mint);

                let ata: PublicKey;
                try {
                    // Allow owner off curve (true) because Smart Wallets are PDAs!
                    ata = await getAssociatedTokenAddress(usdcMint, smartWalletPubkey, true);
                } catch (ataErr) {
                    console.error('ATA Derivation failed:', ataErr);
                    throw new Error('Failed to find your USDC account address. Please try disconnection and reconnecting.');
                }

                const accountInfo = await connection.getParsedAccountInfo(ata);


                if (!accountInfo.value) {
                    throw new Error(
                        "You don't have a USDC account yet! Try the 'Gasless Transfer' demo first to receive some USDC."
                    );
                }


                const parsedInfo = accountInfo.value.data as ParsedAccountData;
                const balance = parsedInfo.parsed?.info?.tokenAmount?.uiAmount || 0;

                if (balance < SUBSCRIPTION_PRICE_USDC) {
                    throw new Error(
                        `Insufficient USDC. You have ${balance} USDC but need ${SUBSCRIPTION_PRICE_USDC} USDC for this subscription.`
                    );
                }


                // Grants SERVICE_WALLET permission to spend subscription amount
                const amount = SUBSCRIPTION_PRICE_USDC * Math.pow(10, tokens.USDC.decimals);
                const serviceWallet = new PublicKey(SERVICE_WALLET_PUBKEY);

                const approveIx = createApproveInstruction(
                    ata,              // User's USDC Account
                    serviceWallet,    // Delegate (The Service)
                    smartWalletPubkey,// Owner (The User)
                    BigInt(amount)
                );


                const signature = await signAndSendTransaction({
                    instructions: [approveIx],
                    transactionOptions: {
                        computeUnitLimit: 100_000
                    }
                });

                // Verify transaction on-chain
                const confirmation = await connection.confirmTransaction(signature, 'confirmed');
                if (confirmation.value.err) {
                    throw new Error(`Transaction failed: ${confirmation.value.err.toString()}`);
                }

                setIsSubscribed(true);
                setShowSuccessToast(true);
                return signature;

            }, 'sign', 'Subscribed to Lazor+ Pro');
        } catch (err) {
            // Fallback logging
            console.error('Subscription error:', err);
        }
    };

    return (
        <Card className={`demo-card ${isSubscribed ? 'demo-success' : ''}`}>
            <div className="demo-header">
                <div className="demo-icon-wrapper">
                    <Zap className="demo-icon text-yellow-400" />
                </div>
                <div>
                    <h3 className="card-title">
                        Lazor+ Subscription
                        <div className="badge badge-primary">
                            <Sparkles size={10} fill="currentColor" /> Gasless
                        </div>
                    </h3>
                    <p className="card-subtitle">
                        Recurring crypto billing via Token Allowances
                    </p>
                </div>
            </div>

            <div className="demo-content">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', width: '100%' }}>

                    <div
                        className="bg-zinc-900/50 border border-white/5 relative overflow-hidden group"
                        style={{
                            padding: '2.5rem',
                            borderRadius: '16px',
                            background: 'rgba(24, 24, 27, 0.5)',
                            border: '1px solid rgba(255, 255, 255, 0.05)',
                            position: 'relative',
                            overflow: 'hidden',
                            textAlign: 'center',
                            minHeight: '600px',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            alignItems: 'center'
                        }}
                    >
                        <div style={{
                            position: 'absolute',
                            top: 0,
                            right: 0,
                            padding: '0.5rem',
                            opacity: 0.1,
                            pointerEvents: 'none'
                        }}>
                            <Zap size={120} />
                        </div>

                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            marginBottom: '2.5rem',
                            position: 'relative',
                            zIndex: 10,
                            gap: '1rem'
                        }}>
                            <div style={{ textAlign: 'center' }}>
                                <h4 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: 'white', marginBottom: '0.5rem' }}>
                                    Lazor+ Pro
                                </h4>
                                <p style={{ fontSize: '1.125rem', color: '#a1a1aa' }}>Monthly Plan</p>
                            </div>
                            <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                                <span style={{ fontSize: '3.5rem', fontWeight: 'bold', color: 'white' }}>$50</span>
                                <span style={{ fontSize: '1.125rem', color: '#71717a', marginLeft: '0.25rem' }}>/month</span>
                            </div>
                        </div>

                        <ul style={{
                            listStyle: 'none',
                            padding: 0,
                            margin: '0 0 3rem 0',
                            position: 'relative',
                            zIndex: 10,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '1.25rem'
                        }}>
                            <li style={{ display: 'flex', alignItems: 'center', fontSize: '1.125rem', color: '#d4d4d8' }}>
                                <CheckCircle size={20} style={{ color: '#10b981', marginRight: '1rem', flexShrink: 0 }} />
                                Gasless Transactions
                            </li>
                            <li style={{ display: 'flex', alignItems: 'center', fontSize: '1.125rem', color: '#d4d4d8' }}>
                                <CheckCircle size={20} style={{ color: '#10b981', marginRight: '1rem', flexShrink: 0 }} />
                                Priority Support
                            </li>
                            <li style={{ display: 'flex', alignItems: 'center', fontSize: '1.125rem', color: '#d4d4d8' }}>
                                <CheckCircle size={20} style={{ color: '#10b981', marginRight: '1rem', flexShrink: 0 }} />
                                Early Access Features
                            </li>
                        </ul>

                        <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: '400px' }}>
                            {isSubscribed ? (
                                <div style={{
                                    width: '100%',
                                    padding: '1rem',
                                    background: 'rgba(16, 185, 129, 0.2)',
                                    border: '1px solid rgba(16, 185, 129, 0.5)',
                                    borderRadius: '8px',
                                    color: '#10b981',
                                    textAlign: 'center',
                                    fontWeight: 500,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem',
                                    fontSize: '1.125rem'
                                }}>
                                    <CheckCircle size={22} />
                                    Active Subscription
                                </div>
                            ) : (
                                <Button
                                    variant="primary"
                                    fullWidth
                                    onClick={handleSubscribe}
                                    isLoading={isLoading}
                                    size="lg"
                                >
                                    Subscribe Now (Gasless)
                                </Button>
                            )}


                            {error && (
                                <div
                                    className="demo-error"
                                    style={{
                                        marginTop: '0.75rem',
                                        padding: '0.75rem',
                                        background: 'rgba(239, 68, 68, 0.1)',
                                        border: '1px solid rgba(239, 68, 68, 0.3)',
                                        borderRadius: '8px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '0.5rem'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                                        <AlertCircle size={16} style={{ color: '#ef4444', flexShrink: 0, marginTop: '2px' }} />
                                        <p style={{ fontSize: '0.875rem', color: '#ef4444', margin: 0 }}>{error}</p>
                                    </div>

                                    {error.includes("don't have a USDC account") && (
                                        <a
                                            href="https://faucet.circle.com/"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs bg-red-500/20 hover:bg-red-500/30 text-red-300 py-1.5 px-3 rounded text-center transition-colors flex items-center justify-center gap-1 mt-1"
                                            style={{ textDecoration: 'none' }}
                                        >
                                            Get Devnet USDC from Faucet <ExternalLink size={10} />
                                        </a>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>


                    <div className="demo-section border-t border-white/5 pt-4">
                        <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">
                            <Shield size={12} />
                            How it works
                        </h4>
                        <p className="text-sm text-zinc-400 leading-relaxed">
                            Instead of paying immediately, you are approving a
                            <strong> Token Allowance</strong>. This authorizes the service to "pull"
                            payments automatically each month. Your balance implies the capacity to pay,
                            but the actual deduction happens when the service claims it.
                        </p>

                        {error && (
                            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3">
                                <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-red-200">Subscription Failed</p>
                                    <p className="text-xs text-red-400 mt-0.5">{error}</p>
                                </div>
                            </div>
                        )}

                        {lastSignature && (
                            <div className="mt-4">
                                <a
                                    href={getExplorerUrl(lastSignature)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-xs flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors"
                                >
                                    View on Explorer <Zap size={10} />
                                </a>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {showSuccessToast && (
                <Toast
                    type="success"
                    message="Subscription authorized successfully!"
                    onClose={() => setShowSuccessToast(false)}
                />
            )}
        </Card>
    );
}
