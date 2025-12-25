/**
 * Lazorkit Signature Normalization Patch
 * 
 * This utility fixes the "High-S" signature issue that causes
 * Solana's secp256r1 precompile to reject valid passkey signatures.
 * 
 * Background:
 * - ECDSA signatures have two valid forms: (r, s) and (r, n-s)
 * - Solana's secp256r1 precompile requires "Low-S" form
 * - Some passkey implementations return "High-S" signatures
 * - This patch normalizes all signatures to Low-S form
 * 
 * @see https://bitcoin.stackexchange.com/questions/83408/in-ecdsa-why-is-r-s-equivalent-to-r-n-s
 * @see https://docs.solana.com/developing/runtime-facilities/programs#secp256r1-program
 */

// =============================================================================
// SECP256R1 CURVE CONSTANTS
// =============================================================================

/**
 * secp256r1 (P-256/prime256v1) curve order
 * This is the value 'n' - the order of the curve's generator point
 */
const CURVE_ORDER = BigInt(
    '0xFFFFFFFF00000000FFFFFFFFFFFFFFFFBCE6FAADA7179E84F3B9CAC2FC632551'
);

/**
 * Half of the curve order - used to determine if S is "High"
 * High-S: s > n/2
 * Low-S:  s <= n/2
 */
const HALF_CURVE_ORDER = CURVE_ORDER / BigInt(2);

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Convert a Uint8Array to a BigInt (big-endian)
 */
function bytesToBigInt(bytes: Uint8Array): bigint {
    let result = BigInt(0);
    for (let i = 0; i < bytes.length; i++) {
        result = (result << BigInt(8)) + BigInt(bytes[i]);
    }
    return result;
}

/**
 * Convert a BigInt to a Uint8Array of specified length (big-endian)
 */
function bigIntToBytes(value: bigint, length: number): Uint8Array {
    const bytes = new Uint8Array(length);
    let remaining = value;
    for (let i = length - 1; i >= 0; i--) {
        bytes[i] = Number(remaining & BigInt(0xff));
        remaining = remaining >> BigInt(8);
    }
    return bytes;
}

// =============================================================================
// MAIN PATCH FUNCTION
// =============================================================================

/**
 * Normalize an ECDSA signature to Low-S form
 * 
 * This function takes a 64-byte signature (r || s) and:
 * 1. Checks if S is greater than half the curve order (High-S)
 * 2. If High-S, calculates Low-S = CURVE_ORDER - S
 * 3. Returns the normalized signature
 * 
 * @param signature - 64-byte ECDSA signature (r: 32 bytes, s: 32 bytes)
 * @returns Normalized 64-byte signature with Low-S
 * 
 * @example
 * ```typescript
 * const rawSignature = await signWithPasskey(message);
 * const normalizedSig = normalizeSignature(rawSignature);
 * await sendToSolana(normalizedSig);
 * ```
 */
export function normalizeSignature(signature: Uint8Array): Uint8Array {
    // Validate signature length
    if (signature.length !== 64) {
        console.warn(
            `⚠️ Vibecoder Patch: Expected 64-byte signature, got ${signature.length} bytes. Returning as-is.`
        );
        return signature;
    }

    // Split signature into r and s components
    const r = signature.slice(0, 32);
    const s = signature.slice(32, 64);

    // Convert s to BigInt for comparison
    const sBigInt = bytesToBigInt(s);

    // Check if s is "High" (greater than half the curve order)
    if (sBigInt > HALF_CURVE_ORDER) {
        // Calculate Low-S: lowS = CURVE_ORDER - s
        const lowS = CURVE_ORDER - sBigInt;

        // Convert back to bytes
        const lowSBytes = bigIntToBytes(lowS, 32);

        // Log the fix
        console.log('⚠️ Vibecoder Patch: Normalized High-S signature to Low-S form.');

        // Return normalized signature (r || lowS)
        const normalized = new Uint8Array(64);
        normalized.set(r, 0);
        normalized.set(lowSBytes, 32);
        return normalized;
    }

    // Signature is already Low-S, return as-is
    return signature;
}

/**
 * Check if a signature has High-S (without modifying it)
 * Useful for debugging/logging
 */
export function isHighS(signature: Uint8Array): boolean {
    if (signature.length !== 64) return false;

    const s = signature.slice(32, 64);
    const sBigInt = bytesToBigInt(s);

    return sBigInt > HALF_CURVE_ORDER;
}

/**
 * Validate that a signature is in proper Low-S form
 * Returns true if valid, false if needs normalization
 */
export function isValidLowS(signature: Uint8Array): boolean {
    if (signature.length !== 64) return false;

    const s = signature.slice(32, 64);
    const sBigInt = bytesToBigInt(s);

    // Valid Low-S: 0 < s <= n/2
    return sBigInt > BigInt(0) && sBigInt <= HALF_CURVE_ORDER;
}

// =============================================================================
// TRANSACTION SIZE HELPERS
// =============================================================================

/**
 * Solana transaction size limit
 */
export const SOLANA_TX_SIZE_LIMIT = 1232;

/**
 * Estimate if a transaction might exceed size limits
 * This is a rough heuristic - actual size depends on many factors
 * 
 * @param instructionCount - Number of instructions in the transaction
 * @param avgInstructionSize - Average instruction size in bytes (default: 200)
 * @returns true if transaction might be too large
 */
export function mightExceedSizeLimit(
    instructionCount: number,
    avgInstructionSize: number = 200
): boolean {
    // Base transaction overhead (signatures, header, etc.)
    const baseOverhead = 300;

    // Estimated total size
    const estimatedSize = baseOverhead + (instructionCount * avgInstructionSize);

    return estimatedSize > SOLANA_TX_SIZE_LIMIT;
}

/**
 * Log transaction size warning if needed
 */
export function warnIfTooLarge(serializedTx: Uint8Array): void {
    if (serializedTx.length > SOLANA_TX_SIZE_LIMIT) {
        console.warn(
            `⚠️ Vibecoder Patch: Transaction size (${serializedTx.length} bytes) exceeds ` +
            `Solana limit (${SOLANA_TX_SIZE_LIMIT} bytes). Consider splitting into multiple transactions.`
        );
    }
}
