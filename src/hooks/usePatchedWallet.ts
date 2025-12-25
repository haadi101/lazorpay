/**
 * Enhanced Wallet Hook with Signature Normalization
 * 
 * This hook wraps the LazorKit useWallet hook and automatically
 * applies the High-S signature fix for Solana compatibility.
 * 
 * Use this instead of importing useWallet directly from @lazorkit/wallet
 * 
 * @example
 * ```tsx
 * import { usePatchedWallet } from '../hooks/usePatchedWallet';
 * 
 * function MyComponent() {
 *   const { connect, signMessage, signAndSendTransaction } = usePatchedWallet();
 * }
 * ```
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
// PATCHED HOOK
// =============================================================================

export function usePatchedWallet() {
    // Get the original wallet hook
    const wallet = useWallet();

    /**
     * Patched signMessage that normalizes High-S signatures
     * 
     * Note: The SDK returns { signature: string, signedPayload: string }
     * The signature is already base64 encoded, so we need to decode,
     * normalize, and re-encode.
     */
    const patchedSignMessage = useCallback(async (message: string): Promise<SignMessageResult> => {
        // Call the original signMessage
        const result = await wallet.signMessage(message);

        try {
            // Decode the base64 signature
            const sigBytes = Uint8Array.from(atob(result.signature), c => c.charCodeAt(0));

            // Check if it needs normalization
            if (isHighS(sigBytes)) {
                console.log('🔧 usePatchedWallet: Detected High-S signature, normalizing...');

                // Normalize the signature
                const normalizedBytes = normalizeSignature(sigBytes);

                // Re-encode to base64
                const normalizedBase64 = btoa(String.fromCharCode(...normalizedBytes));

                return {
                    signature: normalizedBase64,
                    signedPayload: result.signedPayload,
                };
            }
        } catch (e) {
            // If anything fails in the normalization, return original
            console.warn('⚠️ usePatchedWallet: Could not normalize signature, using original', e);
        }

        return result;
    }, [wallet.signMessage]);

    /**
     * Enhanced signAndSendTransaction with robust response handling
     * 
     * The SDK may return different types depending on the flow:
     * - String: direct signature
     * - Object: { signature: string } or similar
     * - Array: [signature1, signature2] for chunked transactions
     */
    const patchedSignAndSendTransaction = useCallback(async (payload: Parameters<typeof wallet.signAndSendTransaction>[0]): Promise<string> => {
        console.log('🔧 usePatchedWallet: Starting transaction...', {
            instructionCount: payload.instructions?.length ?? 0,
            timestamp: new Date().toISOString(),
        });

        try {
            // Add timeout to prevent infinite loading
            const timeoutMs = 90000; // 90 seconds
            const timeoutPromise = new Promise<never>((_, reject) => {
                setTimeout(() => {
                    console.error('⏰ Transaction timeout reached');
                    reject(new Error('Transaction timed out. Check Solana Explorer for status.'));
                }, timeoutMs);
            });

            console.log('📤 Calling SDK signAndSendTransaction...');

            const result = await Promise.race([
                wallet.signAndSendTransaction(payload),
                timeoutPromise,
            ]);

            console.log('📥 SDK returned:', typeof result, result);

            // Extract signature from various possible return formats
            let signature: string;

            if (typeof result === 'string') {
                // Direct string signature
                signature = result;
            } else if (result && typeof result === 'object') {
                // Object with signature property
                const obj = result as Record<string, unknown>;
                if ('signature' in obj && typeof obj.signature === 'string') {
                    signature = obj.signature;
                } else if ('signatures' in obj && Array.isArray(obj.signatures) && obj.signatures.length > 0) {
                    // Multiple signatures - take the last one (the actual transaction)
                    const sigs = obj.signatures as string[];
                    signature = sigs[sigs.length - 1];
                } else {
                    // Try to stringify and extract
                    const str = JSON.stringify(result);
                    console.warn('⚠️ Unexpected result format:', str);
                    // Try to find a signature-like string (base58, 87-88 chars)
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

            console.log('✅ usePatchedWallet: Transaction confirmed!', signature);
            return signature;

        } catch (error) {
            console.error('❌ usePatchedWallet: Transaction failed:', error);

            // Check for specific error types
            const errorMessage = error instanceof Error ? error.message : String(error);

            if (errorMessage.includes('0x2') || errorMessage.includes('invalid signature')) {
                console.error('🚨 High-S signature detected!');
            }

            if (errorMessage.includes('too large') || errorMessage.includes('1232')) {
                console.error('🚨 Transaction too large!');
            }

            throw error;
        }
    }, [wallet]);

    // Return the wallet with patched methods
    return {
        ...wallet,
        signMessage: patchedSignMessage,
        signAndSendTransaction: patchedSignAndSendTransaction,
    };
}
