/**
 * useTransaction Hook
 * 
 * A custom hook for managing transaction state and history.
 * Provides loading states, error handling, and transaction tracking.
 */

import { useState, useCallback } from 'react';
import { getExplorerUrl } from '../config/lazorkit';

// =============================================================================
// TYPES
// =============================================================================

export interface Transaction {
    id: string;
    signature: string;
    type: 'transfer' | 'mint' | 'sign' | 'swap';
    status: 'pending' | 'confirmed' | 'failed';
    timestamp: number;
    description: string;
    explorerUrl: string;
}

export interface TransactionState {
    isLoading: boolean;
    error: string | null;
    lastSignature: string | null;
}

// =============================================================================
// HOOK IMPLEMENTATION
// =============================================================================

export function useTransaction() {
    // Transaction execution state
    const [state, setState] = useState<TransactionState>({
        isLoading: false,
        error: null,
        lastSignature: null,
    });

    // Transaction history (persisted in memory for this session)
    const [history, setHistory] = useState<Transaction[]>([]);

    /**
     * Execute a transaction with proper loading/error state management
     * 
     * @param txFunction - Async function that performs the transaction
     * @param type - Type of transaction for history tracking
     * @param description - Human-readable description
     * @returns The transaction signature if successful
     */
    const execute = useCallback(async <T extends string>(
        txFunction: () => Promise<T>,
        type: Transaction['type'],
        description: string
    ): Promise<T | null> => {
        console.log('📋 useTransaction: Starting execute...');

        // Reset state and start loading
        setState({
            isLoading: true,
            error: null,
            lastSignature: null,
        });

        try {
            console.log('📋 useTransaction: Calling txFunction...');

            // Execute the transaction
            const signature = await txFunction();

            console.log('📋 useTransaction: txFunction returned:', signature);

            // Create transaction record
            const tx: Transaction = {
                id: crypto.randomUUID(),
                signature,
                type,
                status: 'confirmed',
                timestamp: Date.now(),
                description,
                explorerUrl: getExplorerUrl(signature),
            };

            console.log('📋 useTransaction: Updating history...');

            // Update history
            setHistory(prev => [tx, ...prev].slice(0, 10)); // Keep last 10

            console.log('📋 useTransaction: Setting success state...');

            // Update state
            setState({
                isLoading: false,
                error: null,
                lastSignature: signature,
            });

            console.log('📋 useTransaction: DONE! Returning signature:', signature);
            return signature;
        } catch (err) {
            // Handle error
            const errorMessage = err instanceof Error ? err.message : 'Transaction failed';

            setState({
                isLoading: false,
                error: errorMessage,
                lastSignature: null,
            });

            // Also add failed transaction to history
            const failedTx: Transaction = {
                id: crypto.randomUUID(),
                signature: '',
                type,
                status: 'failed',
                timestamp: Date.now(),
                description: `${description} (Failed: ${errorMessage})`,
                explorerUrl: '',
            };
            setHistory(prev => [failedTx, ...prev].slice(0, 10));

            return null;
        }
    }, []);

    /**
     * Clear the current error state
     */
    const clearError = useCallback(() => {
        setState(prev => ({ ...prev, error: null }));
    }, []);

    /**
     * Clear transaction history
     */
    const clearHistory = useCallback(() => {
        setHistory([]);
    }, []);

    return {
        // State
        isLoading: state.isLoading,
        error: state.error,
        lastSignature: state.lastSignature,
        history,

        // Actions
        execute,
        clearError,
        clearHistory,
    };
}
