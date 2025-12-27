/**
 * LazorKit SDK Configuration
 * 
 * This file contains all the configuration needed to connect to LazorKit services.
 * It uses Devnet by default for testing purposes.
 * 
 * @see https://docs.lazorkit.com/react-sdk/getting-started
 */

// =============================================================================
// CONSTANTS
// =============================================================================

/** Solana signature length in base58 encoding (87-88 characters) */
export const SOLANA_SIGNATURE_LENGTH = { min: 87, max: 88 };

import { COMPUTE_UNIT_LIMIT } from './constants';

/**
 * Default Compute Unit Limit for Paymaster Transactions
 */
export const DEFAULT_COMPUTE_UNIT_LIMIT = COMPUTE_UNIT_LIMIT;

/** Transaction retry configuration */
export const RETRY_CONFIG = {
    maxRetries: 3,
    baseDelayMs: 2000,
    timeoutMs: 90_000,
} as const;

// =============================================================================
// NETWORK CONFIGURATION
// =============================================================================

/**
 * Network configuration with RPC and paymaster URLs tied together
 * This prevents the bug where switching networks uses the wrong paymaster
 */
interface NetworkConfig {
    name: string;
    rpcUrl: string;
    explorerUrl: string;
    paymasterUrl: string;
}

/**
 * Solana network configurations
 * - Devnet: For development and testing (free SOL from faucet)
 * - Mainnet: For production (real SOL required)
 */
export const NETWORKS: Record<'devnet' | 'mainnet', NetworkConfig> = {
    devnet: {
        name: 'Devnet',
        // Use env variable or public endpoint (rate-limited but safe)
        rpcUrl: import.meta.env.VITE_RPC_URL || 'https://api.devnet.solana.com',
        explorerUrl: 'https://explorer.solana.com/?cluster=devnet',
        paymasterUrl: 'https://kora.devnet.lazorkit.com',
    },
    mainnet: {
        name: 'Mainnet',
        rpcUrl: import.meta.env.VITE_MAINNET_RPC_URL || 'https://api.mainnet-beta.solana.com',
        explorerUrl: 'https://explorer.solana.com/',
        paymasterUrl: 'https://kora.mainnet.lazorkit.com',
    },
} as const;

// Current active network - change this to switch networks
export const ACTIVE_NETWORK = NETWORKS.devnet;

// =============================================================================
// LAZORKIT CONFIGURATION
// =============================================================================

/**
 * LazorKit Portal URL
 * This is where passkey authentication happens via WebAuthn
 */
export const PORTAL_URL = 'https://portal.lazor.sh';

/**
 * Paymaster Configuration
 * Now derived from the active network to prevent configuration mismatches
 */
export const PAYMASTER_CONFIG = {
    paymasterUrl: ACTIVE_NETWORK.paymasterUrl,
    /**
     * SECURITY WARNING
     * 
     * You are exposing your Paymaster API Key in the client-side code.
     * This is acceptable for demos/hackathons, but DANGEROUS for production.
     * 
     * In production, malicious users can scrape this key and drain your paymaster balance.
     * 
     * RECOMMENDED FIX:
     * Proxy paymaster requests through your own backend API to hide this key.
     */
    ...(import.meta.env.VITE_PAYMASTER_API_KEY && {
        apiKey: import.meta.env.VITE_PAYMASTER_API_KEY,
    }),
};

/**
 * Combined configuration for LazorkitProvider
 * 
 * @example
 * ```tsx
 * import { LAZORKIT_CONFIG } from './config/lazorkit';
 * 
 * function App() {
 *   return (
 *     <LazorkitProvider {...LAZORKIT_CONFIG}>
 *       <YourApp />
 *     </LazorkitProvider>
 *   );
 * }
 * ```
 */
export const LAZORKIT_CONFIG = {
    rpcUrl: ACTIVE_NETWORK.rpcUrl,
    portalUrl: PORTAL_URL,
    paymasterConfig: PAYMASTER_CONFIG,
};

// =============================================================================
// TOKEN ADDRESSES (Devnet)
// =============================================================================

/**
 * Common token mint addresses on Devnet
 * Note: These are different from mainnet addresses!
 */
export const TOKENS = {
    devnet: {
        SOL: {
            symbol: 'SOL',
            name: 'Solana',
            mint: 'So11111111111111111111111111111111111111112',
            decimals: 9,
            logo: '◎',
        },
        USDC: {
            symbol: 'USDC',
            name: 'USD Coin',
            mint: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU', // Devnet USDC
            decimals: 6,
            logo: '$',
        },
    },
    mainnet: {
        SOL: {
            symbol: 'SOL',
            name: 'Solana',
            mint: 'So11111111111111111111111111111111111111112',
            decimals: 9,
            logo: '◎',
        },
        USDC: {
            symbol: 'USDC',
            name: 'USD Coin',
            mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // Mainnet USDC
            decimals: 6,
            logo: '$',
        },
    },
} as const;

/**
 * Helper to get tokens for the active network
 */
export const getActiveTokens = () => {
    return ACTIVE_NETWORK.name === 'Mainnet' ? TOKENS.mainnet : TOKENS.devnet;
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get Solana Explorer URL for a transaction
 */
export function getExplorerUrl(signature: string): string {
    return `${ACTIVE_NETWORK.explorerUrl}tx/${signature}`;
}

/**
 * Get Solana Explorer URL for an account/address
 */
export function getAccountExplorerUrl(address: string): string {
    return `${ACTIVE_NETWORK.explorerUrl}address/${address}`;
}

/**
 * Truncate address for display (e.g., "7xKz...3nQe")
 */
export function truncateAddress(address: string, chars = 4): string {
    return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}
