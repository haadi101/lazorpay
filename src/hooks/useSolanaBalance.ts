/**
 * useSolanaBalance Hook
 * 
 * Production-grade hook for fetching SOL balance with:
 * - Exponential backoff retry logic
 * - Rate limit handling (429 errors)
 * - Configurable refresh intervals
 * - Clean state management
 */

import { useState, useEffect, useCallback } from 'react';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { ACTIVE_NETWORK } from '../config/lazorkit';

interface BalanceState {
    sol: number;
    isLoading: boolean;
    error: string | null;
    lastUpdated: number | null;
}

interface UseSolanaBalanceOptions {
    /** Refresh interval in ms (default: 60000 = 1 minute) */
    refreshInterval?: number;
    /** Max retry attempts (default: 3) */
    maxRetries?: number;
    /** Enable auto-refresh (default: true) */
    autoRefresh?: boolean;
}

const DEFAULT_OPTIONS: Required<UseSolanaBalanceOptions> = {
    refreshInterval: 60000,
    maxRetries: 3,
    autoRefresh: true,
};

export function useSolanaBalance(
    publicKey: PublicKey | null,
    options: UseSolanaBalanceOptions = {}
) {
    const config = { ...DEFAULT_OPTIONS, ...options };

    const [state, setState] = useState<BalanceState>({
        sol: 0,
        isLoading: false,
        error: null,
        lastUpdated: null,
    });

    const fetchBalance = useCallback(async (showLoading = true) => {
        if (!publicKey) {
            setState({ sol: 0, isLoading: false, error: null, lastUpdated: null });
            return;
        }

        if (showLoading) {
            setState(prev => ({ ...prev, isLoading: true, error: null }));
        }

        let lastError: Error | null = null;

        for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
            try {
                const connection = new Connection(ACTIVE_NETWORK.rpcUrl, {
                    commitment: 'confirmed',
                });

                const lamports = await connection.getBalance(publicKey);
                const sol = lamports / LAMPORTS_PER_SOL;

                setState({
                    sol,
                    isLoading: false,
                    error: null,
                    lastUpdated: Date.now(),
                });

                return; // Success - exit the retry loop

            } catch (err) {
                lastError = err instanceof Error ? err : new Error('Unknown error');

                // Check if it's a rate limit error
                const isRateLimited = lastError.message.includes('429') ||
                    lastError.message.includes('rate');

                if (attempt < config.maxRetries) {
                    // Exponential backoff: 2s, 4s, 8s
                    const delay = Math.min(2000 * Math.pow(2, attempt), 10000);
                    console.warn(`Balance fetch attempt ${attempt + 1} failed${isRateLimited ? ' (rate limited)' : ''}, retrying in ${delay / 1000}s`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }

        // All retries exhausted
        console.error('Balance fetch failed after all retries');
        setState(prev => ({
            ...prev,
            isLoading: false,
            error: lastError?.message || 'Failed to fetch balance',
        }));
    }, [publicKey, config.maxRetries]);

    // Initial fetch + auto-refresh
    useEffect(() => {
        if (!publicKey) {
            setState({ sol: 0, isLoading: false, error: null, lastUpdated: null });
            return;
        }

        let isMounted = true;
        let refreshTimer: ReturnType<typeof setTimeout>;

        const startFetch = async () => {
            await fetchBalance(true);

            if (isMounted && config.autoRefresh) {
                const scheduleRefresh = () => {
                    refreshTimer = setTimeout(async () => {
                        if (isMounted) {
                            await fetchBalance(false);
                            scheduleRefresh();
                        }
                    }, config.refreshInterval);
                };
                scheduleRefresh();
            }
        };

        startFetch();

        return () => {
            isMounted = false;
            if (refreshTimer) clearTimeout(refreshTimer);
        };
    }, [publicKey, fetchBalance, config.autoRefresh, config.refreshInterval]);

    // Manual refresh function
    const refresh = useCallback(() => {
        fetchBalance(true);
    }, [fetchBalance]);

    return {
        ...state,
        refresh,
    };
}
