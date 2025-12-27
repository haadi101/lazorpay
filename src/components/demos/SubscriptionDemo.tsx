
import { useState } from 'react';
import { useWallet } from '@lazorkit/wallet';
import {
    Connection,
    PublicKey
} from '@solana/web3.js';
import {
    createApproveInstruction,
    getAssociatedTokenAddress
} from '@solana/spl-token';
import { Zap, Shield, CheckCircle, AlertCircle, Sparkles, ExternalLink } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

import { usePatchedWallet } from '../../hooks/usePatchedWallet';
import { useTransaction } from '../../hooks/useTransaction';
import { ACTIVE_NETWORK, TOKENS, getExplorerUrl } from '../../config/lazorkit';
import './demos.css'; // Re-use shared styles

// Mock "Service" Wallet that receives the allowance (using a valid devnet address)
const SERVICE_WALLET = new PublicKey('11111111111111111111111111111111');

export function SubscriptionDemo() {
    const { smartWalletPubkey } = useWallet();
    const { signAndSendTransaction } = usePatchedWallet();

    // State
    const [isSubscribed, setIsSubscribed] = useState(false);

    // Transaction hook
    const { execute, isLoading, error, lastSignature } = useTransaction();

    // Log error state changes
    // useEffect(() => {
    //     console.log('🔴 Error state changed:', error);
    // }, [error]);

    // Log loading state changes
    // useEffect(() => {
    //     console.log('⏳ Loading state:', isLoading);
    // }, [isLoading]);

    const handleSubscribe = async () => {
        // console.log('🔥 handleSubscribe called!');

        if (!smartWalletPubkey) {
            // console.log('❌ No wallet connected');
            alert("Please connect your wallet first!");
            return;
        }

        // console.log('✅ Wallet connected:', smartWalletPubkey.toBase58());

        try {
            // console.log('📤 Starting execute...');
            await execute(async () => {
                // console.log('🔄 Inside execute callback');
                const connection = new Connection(ACTIVE_NETWORK.rpcUrl, 'confirmed');

                // 1. Check if user has USDC Account
                // console.log('🔍 Checking for USDC account...');
                const usdcMint = new PublicKey(TOKENS.USDC.mint);

                let ata: PublicKey;
                try {
                    // console.log('🧩 Deriving ATA for mint:', usdcMint.toBase58(), 'owner:', smartWalletPubkey.toBase58());
                    // Allow owner off curve (true) because Smart Wallets are PDAs!
                    ata = await getAssociatedTokenAddress(usdcMint, smartWalletPubkey, true);
                    // console.log('📍 USDC ATA:', ata.toBase58());
                } catch (ataErr) {
                    console.error('ATA Derivation failed:', ataErr);
                    throw new Error('Failed to find your USDC account address. Please try disconnection and reconnecting.');
                }

                const accountInfo = await connection.getAccountInfo(ata);
                // console.log('📄 Account info:', accountInfo ? 'EXISTS' : 'NULL');

                if (!accountInfo) {
                    // console.log('❌ No USDC account found!');
                    throw new Error(
                        "You don't have a USDC account yet! Try the 'Gasless Transfer' demo first to receive some USDC."
                    );
                }

                // 2. Create Approve Instruction
                // console.log('✍️ Creating approve instruction...');
                // Grants SERVICE_WALLET permission to spend 50 USDC
                const amount = 50 * Math.pow(10, TOKENS.USDC.decimals);

                const approveIx = createApproveInstruction(
                    ata,              // User's USDC Account
                    SERVICE_WALLET,   // Delegate (The Service)
                    smartWalletPubkey,// Owner (The User)
                    BigInt(amount)
                );

                // 3. Execute Gasless Transaction
                // console.log('🚀 Sending transaction...');
                const signature = await signAndSendTransaction({
                    instructions: [approveIx],
                    transactionOptions: { computeUnitLimit: 100_000 }
                });

                // console.log('✅ Transaction sent:', signature);
                setIsSubscribed(true);
                return signature;

            }, 'sign', 'Subscribed to Lazor+ Pro');
            // console.log('✅ Execute completed');
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
                <div className="flex flex-col gap-6 w-full">
                    {/* Visual Tier Card */}
                    <div className="p-4 rounded-xl bg-zinc-900/50 border border-white/5 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
                            <Zap size={80} />
                        </div>

                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <div>
                                <h4 className="text-lg font-bold text-white">Lazor+ Pro</h4>
                                <p className="text-sm text-zinc-400">Monthly Plan</p>
                            </div>
                            <div className="text-right">
                                <span className="text-2xl font-bold text-white">$50</span>
                                <span className="text-xs text-zinc-500 block">/month</span>
                            </div>
                        </div>

                        <ul className="space-y-2 mb-6 relative z-10">
                            <li className="flex items-center text-sm text-zinc-300">
                                <CheckCircle size={14} className="text-emerald-400 mr-2" />
                                Gasless Transactions
                            </li>
                            <li className="flex items-center text-sm text-zinc-300">
                                <CheckCircle size={14} className="text-emerald-400 mr-2" />
                                Priority Support
                            </li>
                            <li className="flex items-center text-sm text-zinc-300">
                                <CheckCircle size={14} className="text-emerald-400 mr-2" />
                                Early Access Features
                            </li>
                        </ul>

                        <div className="relative z-10">
                            {isSubscribed ? (
                                <div className="w-full py-2 bg-emerald-500/20 border border-emerald-500/50 rounded-lg text-emerald-400 text-center font-medium flex items-center justify-center gap-2">
                                    <CheckCircle size={16} />
                                    Active Subscription
                                </div>
                            ) : (
                                <Button
                                    variant="primary"
                                    fullWidth
                                    onClick={handleSubscribe}
                                    isLoading={isLoading}
                                >
                                    Subscribe Now (Gasless)
                                </Button>
                            )}

                            {/* Error display - immediately visible under button */}
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

                    {/* Technical Explanation */}
                    <div className="demo-section border-t border-white/5 pt-4">
                        <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">
                            <Shield size={12} />
                            How it works
                        </h4>
                        <p className="text-sm text-zinc-400 leading-relaxed">
                            Instead of signing a transaction every month, you approve a
                            <strong> Token Allowance</strong> for the service provider.
                            LazorPay executes this approval <strong>gaslessly</strong> so you don't need SOL.
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
        </Card>
    );
}
