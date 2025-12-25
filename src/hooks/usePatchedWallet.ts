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
     * Enhanced signAndSendTransaction with logging
     * 
     * The SDK handles signing internally, so we can't patch the signature here.
     * Instead, we add logging to help debug transaction issues.
     */
    const patchedSignAndSendTransaction = useCallback(async (payload: Parameters<typeof wallet.signAndSendTransaction>[0]) => {
        console.log('🔧 usePatchedWallet: Sending transaction...', {
            instructionCount: payload.instructions?.length ?? 0,
        });

        try {
            const signature = await wallet.signAndSendTransaction(payload);
            console.log('✅ usePatchedWallet: Transaction confirmed:', signature);
            return signature;
        } catch (error) {
            console.error('❌ usePatchedWallet: Transaction failed:', error);

            // Check for specific error types
            const errorMessage = error instanceof Error ? error.message : String(error);

            if (errorMessage.includes('0x2') || errorMessage.includes('invalid signature')) {
                console.error(
                    '🚨 High-S signature detected! The SDK may need patching.\n' +
                    'See: https://github.com/lazor-kit/lazor-kit/issues for updates.'
                );
            }

            if (errorMessage.includes('too large') || errorMessage.includes('1232')) {
                console.error(
                    '🚨 Transaction too large! Consider:\n' +
                    '- Reducing instruction count\n' +
                    '- Using Address Lookup Tables\n' +
                    '- Splitting into multiple transactions'
                );
            }

            throw error;
        }
    }, [wallet.signAndSendTransaction]);

    // Return the wallet with patched methods
    return {
        ...wallet,
        signMessage: patchedSignMessage,
        signAndSendTransaction: patchedSignAndSendTransaction,
    };
}
