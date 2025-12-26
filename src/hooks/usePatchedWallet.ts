/**
 * Enhanced Wallet Hook with Signature Normalization & Rate Limit Handling
 * 
 * This hook wraps the LazorKit useWallet hook and automatically:
 * 1. Applies High-S signature fix for Solana compatibility
 * 2. Handles 429 rate limit errors with exponential backoff
 * 3. Provides robust error handling for various SDK response formats
 * 
 * Use this instead of importing useWallet directly from @lazorkit/wallet
 */

import { useWallet } from '@lazorkit/wallet';
import { useCallback } from 'react';
import { normalizeSignature, isHighS } from '../utils/lazor-patch';

// =============================================================================
// TYPES
// =============================================================================

interface SignMessageResult {
    signature: string;
    signedPayload: string;
}

// =============================================================================
// RETRY UTILITY
// =============================================================================

/**
 * Sleep for a given number of milliseconds
 */
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Check if error is a rate limit (429) error
 */
const is429Error = (error: unknown): boolean => {
    if (error instanceof Error) {
        const msg = error.message.toLowerCase();
        return msg.includes('429') ||
            msg.includes('rate limit') ||
            msg.includes('too many requests') ||
            msg.includes('throttl');
    }
    return false;
};

// =============================================================================
// PATCHED HOOK
// =============================================================================

export function usePatchedWallet() {
    const wallet = useWallet();

    /**
     * Patched signMessage that normalizes High-S signatures
     */
    const patchedSignMessage = useCallback(async (message: string): Promise<SignMessageResult> => {
        const result = await wallet.signMessage(message);

        try {
            const sigBytes = Uint8Array.from(atob(result.signature), c => c.charCodeAt(0));

            if (isHighS(sigBytes)) {
                const normalizedBytes = normalizeSignature(sigBytes);
                const normalizedBase64 = btoa(String.fromCharCode(...normalizedBytes));

                return {
                    signature: normalizedBase64,
                    signedPayload: result.signedPayload,
                };
            }
        } catch (e) {
            console.warn('⚠️ Could not normalize signature, using original', e);
        }

        return result;
    }, [wallet.signMessage]);

    /**
     * Enhanced signAndSendTransaction with:
     * - Exponential backoff retry for 429 errors
     * - Timeout protection
     * - Robust response parsing
     */
    const patchedSignAndSendTransaction = useCallback(async (
        payload: Parameters<typeof wallet.signAndSendTransaction>[0]
    ): Promise<string> => {
        const MAX_RETRIES = 3;
        const BASE_DELAY_MS = 2000;
        const TIMEOUT_MS = 90000;

        let lastError: Error | null = null;

        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            let timerId: ReturnType<typeof setTimeout> | undefined;

            try {
                const timeoutPromise = new Promise<never>((_, reject) => {
                    timerId = setTimeout(() => {
                        reject(new Error('Transaction timed out. Check Solana Explorer for status.'));
                    }, TIMEOUT_MS);
                });

                const result = await Promise.race([
                    wallet.signAndSendTransaction(payload),
                    timeoutPromise,
                ]);

                if (timerId) clearTimeout(timerId);

                // Extract signature from various possible return formats
                let signature: string;

                if (typeof result === 'string') {
                    signature = result;
                } else if (result && typeof result === 'object') {
                    const obj = result as Record<string, unknown>;
                    if ('signature' in obj && typeof obj.signature === 'string') {
                        signature = obj.signature;
                    } else if ('signatures' in obj && Array.isArray(obj.signatures) && obj.signatures.length > 0) {
                        const sigs = obj.signatures as string[];
                        signature = sigs[sigs.length - 1];
                    } else {
                        const str = JSON.stringify(result);
                        const match = str.match(/[1-9A-HJ-NP-Za-km-z]{87,88}/);
                        if (match) {
                            signature = match[0];
                        } else {
                            throw new Error('Could not extract signature from result');
                        }
                    }
                } else {
                    throw new Error(`Unexpected result type: ${typeof result}`);
                }

                return signature;

            } catch (error) {
                if (timerId) clearTimeout(timerId);
                lastError = error instanceof Error ? error : new Error(String(error));

                console.error(`❌ Attempt ${attempt} failed:`, lastError.message);

                // If it's a 429 error and we have retries left, wait and retry
                if (is429Error(error) && attempt < MAX_RETRIES) {
                    const delay = BASE_DELAY_MS * Math.pow(2, attempt - 1);
                    await sleep(delay);
                    continue;
                }

                // For non-429 errors or last attempt, don't retry
                if (!is429Error(error)) {
                    break;
                }
            }
        }

        // All retries exhausted
        const errorMessage = lastError?.message || 'Transaction failed after all retries';

        if (is429Error(lastError)) {
            throw new Error(
                `LazorKit paymaster is rate limiting requests (429). ` +
                `This is a temporary infrastructure issue. Please wait 30-60 seconds and try again. ` +
                `Original error: ${errorMessage}`
            );
        }

        throw lastError || new Error(errorMessage);
    }, [wallet]);

    return {
        ...wallet,
        signMessage: patchedSignMessage,
        signAndSendTransaction: patchedSignAndSendTransaction,
    };
}

