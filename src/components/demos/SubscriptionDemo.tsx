
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
import { Zap, Shield, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';
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

    const handleSubscribe = async () => {
        if (!smartWalletPubkey) {
            alert("Please connect your wallet first!");
            return;
        }

        try {
            await execute(async () => {
                const connection = new Connection(ACTIVE_NETWORK.rpcUrl, 'confirmed');

                // 1. Check if user has USDC Account
                const usdcMint = new PublicKey(TOKENS.USDC.mint);
                const ata = await getAssociatedTokenAddress(usdcMint, smartWalletPubkey);

                const accountInfo = await connection.getAccountInfo(ata);

                if (!accountInfo) {
                    throw new Error(
                        "You don't have a USDC account yet! Try the 'Gasless Transfer' demo first to receive some USDC."
                    );
                }

                // 2. Create Approve Instruction
                // Grants SERVICE_WALLET permission to spend 50 USDC
                const amount = 50 * Math.pow(10, TOKENS.USDC.decimals);

                const approveIx = createApproveInstruction(
                    ata,              // User's USDC Account
                    SERVICE_WALLET,   // Delegate (The Service)
                    smartWalletPubkey,// Owner (The User)
                    BigInt(amount)
                );

                // 3. Execute Gasless Transaction
                const signature = await signAndSendTransaction({
                    instructions: [approveIx],
                    transactionOptions: { computeUnitLimit: 100_000 }
                });

                setIsSubscribed(true);
                return signature;

            }, 'sign', 'Subscribed to Lazor+ Pro');
        } catch (err) {
            // Fallback alert in case error state doesn't render
            const msg = err instanceof Error ? err.message : 'Unknown error';
            console.error('Subscription error:', msg);
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
                                <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2">
                                    <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
                                    <p className="text-xs text-red-400">{error}</p>
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
