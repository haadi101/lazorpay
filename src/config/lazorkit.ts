/**
 * LazorKit SDK Configuration
 * 
 * This file contains all the configuration needed to connect to LazorKit services.
 * It uses Devnet by default for testing purposes.
 * 
 * @see https://docs.lazorkit.com/react-sdk/getting-started
 */

// =============================================================================
// NETWORK CONFIGURATION
// =============================================================================

/**
 * Solana network endpoints
 * - Devnet: For development and testing (free SOL from faucet)
 * - Mainnet: For production (real SOL required)
 */
export const NETWORKS = {
    devnet: {
        name: 'Devnet',
        rpcUrl: 'https://api.devnet.solana.com',
        explorerUrl: 'https://explorer.solana.com/?cluster=devnet',
    },
    mainnet: {
        name: 'Mainnet',
        rpcUrl: 'https://api.mainnet-beta.solana.com',
        explorerUrl: 'https://explorer.solana.com/',
    },
} as const;

// Current active network
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
 * The paymaster sponsors gas fees, enabling "gasless" transactions
 * 
 * How it works:
 * 1. User signs transaction with passkey
 * 2. Transaction is sent to paymaster
 * 3. Paymaster pays the SOL gas fee
 * 4. User can optionally pay in USDC instead
 */
export const PAYMASTER_CONFIG = {
    // Devnet paymaster (free for testing)
    paymasterUrl: 'https://kora.devnet.lazorkit.com',
    // Uncomment for mainnet:
    // paymasterUrl: 'https://kora.mainnet.lazorkit.com',
    // apiKey: 'YOUR_API_KEY', // Required for mainnet
};

// =============================================================================
// COMPLETE LAZORKIT CONFIG
// =============================================================================

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
    // Native SOL (wrapped)
    SOL: {
        symbol: 'SOL',
        name: 'Solana',
        mint: 'So11111111111111111111111111111111111111112',
        decimals: 9,
        logo: '◎',
    },
    // USDC on Devnet
    USDC: {
        symbol: 'USDC',
        name: 'USD Coin',
        mint: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU', // Devnet USDC
        decimals: 6,
        logo: '$',
    },
} as const;

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
