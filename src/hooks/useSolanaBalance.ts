/**
 * useSolanaBalance Hook
 * 
 * Production-grade hook for fetching SOL balance with:
 * - Exponential backoff retry logic
 * - Rate limit handling (429 errors)
 * - Configurable refresh intervals
 * - Clean state management
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { ACTIVE_NETWORK } from '../config/lazorkit';
import {
    BALANCE_MAX_RETRIES,
    BALANCE_REFRESH_INTERVAL,
    BASE_DELAY_MS
} from '../config/constants';

interface BalanceState {
    sol: number;
    isLoading: boolean;
    error: string | null;
    lastUpdated: number | null;
}

interface UseSolanaBalanceOptions {
    /** Refresh interval in ms */
    refreshInterval?: number;
    /** Max retry attempts */
    maxRetries?: number;
    /** Enable auto-refresh */
    autoRefresh?: boolean;
}

export function useSolanaBalance(
    publicKey: PublicKey | null,
    options: UseSolanaBalanceOptions = {}
) {
    // Memoize options to prevent effect loops
    const config = useMemo(() => ({
        refreshInterval: options.refreshInterval ?? BALANCE_REFRESH_INTERVAL,
        maxRetries: options.maxRetries ?? BALANCE_MAX_RETRIES,
        autoRefresh: options.autoRefresh ?? true,
    }), [options.refreshInterval, options.maxRetries, options.autoRefresh]);

    const [state, setState] = useState<BalanceState>({
        sol: 0,
        isLoading: false,
        error: null,
        lastUpdated: null,
    });

    // Use refs to track mounted state and preventing race conditions
    const isMounted = useRef(true);
    const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    // Cleanup on unmount
    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
            if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
            if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
        };
    }, []);

    const fetchBalance = useCallback(async (showLoading = true) => {
        if (!publicKey) {
            if (isMounted.current) {
                setState({ sol: 0, isLoading: false, error: null, lastUpdated: null });
            }
            return;
        }

        if (showLoading && isMounted.current) {
            setState(prev => ({ ...prev, isLoading: true, error: null }));
        }

        let lastError: Error | null = null;
        let success = false;

        for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
            if (!isMounted.current) return;

            try {
                const connection = new Connection(ACTIVE_NETWORK.rpcUrl, 'confirmed');
                const lamports = await connection.getBalance(publicKey);
                const sol = lamports / LAMPORTS_PER_SOL;

                if (isMounted.current) {
                    setState({
                        sol,
                        isLoading: false,
                        error: null,
                        lastUpdated: Date.now(),
                    });
                    success = true;
                }
                break; // Success
            } catch (err) {
                lastError = err instanceof Error ? err : new Error('Unknown error');

                // Check if it's a rate limit error (429)
                const isRateLimited = lastError.message.includes('429');

                if (attempt < config.maxRetries && isMounted.current) {
                    const delay = Math.min(BASE_DELAY_MS * Math.pow(2, attempt), 10000);

                    if (isRateLimited) {
                        console.warn(`Balance fetch rate limited (429), retrying in ${delay}ms...`);
                    }

                    await new Promise(resolve => {
                        retryTimeoutRef.current = setTimeout(resolve, delay);
                    });

                    // If component unmounted during the delay, stop processing
                    if (!isMounted.current) return;
                }
            }
        }

        if (!success && isMounted.current) {
            setState(prev => ({
                ...prev,
                isLoading: false,
                error: lastError?.message || 'Failed to fetch balance',
            }));
        }
    }, [publicKey?.toBase58(), config.maxRetries]); // Stable dependencies (fixed race condition)

    // Initial fetch + auto-refresh
    useEffect(() => {
        if (!publicKey) return;

        fetchBalance(true);

        if (config.autoRefresh) {
            const startRefreshLoop = () => {
                refreshTimerRef.current = setTimeout(() => {
                    if (isMounted.current) {
                        fetchBalance(false).then(() => {
                            if (isMounted.current && config.autoRefresh) {
                                startRefreshLoop();
                            }
                        });
                    }
                }, config.refreshInterval);
            };
            startRefreshLoop();
        }

        return () => {
            if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
            if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
        };
    }, [publicKey?.toBase58(), config.autoRefresh, config.refreshInterval, fetchBalance]);

    return {
        ...state,
        refresh: () => fetchBalance(true),
    };
}
