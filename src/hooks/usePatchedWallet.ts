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
import { MAX_RETRIES, BASE_DELAY_MS, TIMEOUT_MS } from '../config/constants';
import { normalizeSignature, isHighS } from '../utils/lazor-patch';



interface SignMessageResult {
    signature: string;
    signedPayload: string;
}




const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));


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
            console.error('Signature normalization failed:', e);
            throw new Error('Failed to normalize signature. Your wallet may be producing incompatible signatures.');
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


                const val = result as unknown;

                if (typeof val === 'string') {
                    return val;
                }

                if (val && typeof val === 'object' && 'signature' in val) {
                    const sig = (val as any).signature;
                    if (typeof sig === 'string') return sig;
                }

                console.error('Unexpected SDK result:', val);
                throw new Error(`Unexpected result format from wallet SDK: ${typeof val}`);


            } catch (error) {
                if (timerId) clearTimeout(timerId);
                lastError = error instanceof Error ? error : new Error(String(error));

                console.error(`Attempt ${attempt} failed:`, lastError.message);


                if (is429Error(error) && attempt < MAX_RETRIES) {
                    const delay = BASE_DELAY_MS * Math.pow(2, attempt - 1);
                    await sleep(delay);
                    continue;
                }


                if (!is429Error(error)) {
                    break;
                }
            }
        }


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

