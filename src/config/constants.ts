/**
 * LazorPay Constants
 * 
 * Centralized configuration constants with documentation.
 * All magic numbers are extracted here with explanations.
 */

// =============================================================================
// SOLANA TRANSACTION LIMITS
// =============================================================================

/**
 * Maximum compute units for complex transactions.
 * Token minting with multiple instructions needs higher limits than default (200k).
 * Set to 300k to provide headroom for token creation + ATA + minting.
 */
export const COMPUTE_UNIT_LIMIT = 300_000;

/**
 * Solana transaction size limit in bytes.
 * All serialized transactions must fit within this limit.
 */
export const SOLANA_TX_SIZE_LIMIT = 1232;

/**
 * Average instruction size estimate for transaction size calculations.
 * Used as a heuristic when pre-checking if a transaction might be too large.
 */
export const AVG_INSTRUCTION_SIZE = 200;

/**
 * Base transaction overhead in bytes (signatures, headers, etc).
 * Used in conjunction with instruction count to estimate total tx size.
 */
export const BASE_TX_OVERHEAD = 300;

// =============================================================================
// RETRY & TIMEOUT CONFIGURATION
// =============================================================================

/**
 * Maximum retry attempts for rate-limited (429) transactions.
 * LazorKit's devnet paymaster has aggressive rate limits.
 */
export const MAX_RETRIES = 3;

/**
 * Base delay for exponential backoff in milliseconds.
 * Delays: 2s -> 4s -> 8s for attempts 1, 2, 3.
 */
export const BASE_DELAY_MS = 2000;

/**
 * Transaction timeout in milliseconds (90 seconds).
 * Passkey prompts can take significant user interaction time.
 */
export const TIMEOUT_MS = 90_000;

// =============================================================================
// BALANCE REFRESH CONFIGURATION
// =============================================================================

/**
 * How often to refresh wallet balance (in milliseconds).
 * 60 seconds is a good balance between freshness and RPC load.
 */
export const BALANCE_REFRESH_INTERVAL = 60_000;

/**
 * Maximum retries for balance fetching.
 * Public RPC endpoints can be flaky.
 */
export const BALANCE_MAX_RETRIES = 3;

// =============================================================================
// UI & HISTORY CONFIGURATION
// =============================================================================

/**
 * Maximum transactions to keep in history.
 * Prevents memory growth while keeping recent activity visible.
 */
export const MAX_HISTORY_ITEMS = 10;

// =============================================================================
// SIGNATURE VALIDATION
// =============================================================================

/**
 * Valid Solana signature length range in base58 encoding.
 * Signatures are 64 bytes, which encode to 87-88 base58 characters.
 */
export const SOLANA_SIGNATURE_LENGTH = { min: 87, max: 88 };

// =============================================================================
// SUBSCRIPTION CONFIGURATION
// =============================================================================

/**
 * Monthly subscription price in USDC.
 * Used for token allowance demos.
 */
export const SUBSCRIPTION_PRICE_USDC = 50;

/**
 * Service wallet address for receiving subscriptions.
 * This is a demo keypair (not a real service).
 */
export const SERVICE_WALLET_PUBKEY = 'HzBz2t5b5c5d5e5f5g5h5i5j5k5l5m5n5o5p5q5r5s5t';
