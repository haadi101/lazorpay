/**
 * LazorPay Starter Template
 * 
 * A comprehensive example application demonstrating LazorKit SDK integration.
 * This template showcases:
 * 
 * 1. Passkey authentication (seedless login)
 * 2. Gasless transactions (paymaster-sponsored)
 * 3. Message signing
 * 4. Token minting (program interaction)
 * 
 * @author Your Name
 * @see https://docs.lazorkit.com
 * @see https://github.com/lazor-kit/lazor-kit
 */

import { useState } from 'react';
import { LazorkitProvider } from '@lazorkit/wallet';
import { LAZORKIT_CONFIG } from './config/lazorkit';

// Lucide Icons - Professional iconography
import {
  Fingerprint,
  ArrowRightLeft,
  PenLine,
  Coins,
  Zap,
  User,
  KeyRound,
  Wallet,
  Fuel,
  Circle,
  X,
  Check,
  ChevronRight
} from 'lucide-react';

// Components
import { ConnectButton } from './components/wallet/ConnectButton';
import { WalletInfo } from './components/wallet/WalletInfo';

// Demo Components
import { PasskeyDemo } from './components/demos/PasskeyDemo';
import { GaslessTransfer } from './components/demos/GaslessTransfer';
import { MessageSign } from './components/demos/MessageSign';
import { SponsoredMint } from './components/demos/SponsoredMint';

// Styles
import './index.css';

// =============================================================================
// DEMO TABS - Using Lucide Icons
// =============================================================================

type DemoTab = 'passkey' | 'transfer' | 'sign' | 'mint';

interface TabConfig {
  id: DemoTab;
  label: string;
  Icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
}

const tabs: TabConfig[] = [
  { id: 'passkey', label: 'Passkey Auth', Icon: Fingerprint },
  { id: 'transfer', label: 'Gasless Transfer', Icon: ArrowRightLeft },
  { id: 'sign', label: 'Sign Message', Icon: PenLine },
  { id: 'mint', label: 'Token Mint', Icon: Coins },
];

// =============================================================================
// MAIN APP
// =============================================================================


function App() {
  const [activeTab, setActiveTab] = useState<DemoTab>('passkey');

  return (
    /**
     * LazorkitProvider wraps your entire application.
     * It provides the wallet context to all child components.
     * 
     * Required Props:
     * - rpcUrl: Solana RPC endpoint
     * - portalUrl: LazorKit authentication portal
     * - paymasterConfig: Paymaster settings for gasless transactions
     */
    <LazorkitProvider
      rpcUrl={LAZORKIT_CONFIG.rpcUrl}
      portalUrl={LAZORKIT_CONFIG.portalUrl}
      paymasterConfig={LAZORKIT_CONFIG.paymasterConfig}
    >
      <div className="app">
        {/* Background gradient effect */}
        <div className="app-bg" />

        {/* Header */}
        <header className="header">
          <div className="header-content">
            <div className="header-brand group">
              <span className="brand-logo">
                <Zap size={20} strokeWidth={2} className="text-yellow-400 group-hover:text-yellow-300 transition-colors" />
              </span>
              <span className="brand-name">LazorPay</span>
              <span className="brand-badge">Starter Template</span>
            </div>
            <ConnectButton />
          </div>
        </header>

        {/* Main Content */}
        <main className="main">
          {/* Hero Section */}
          <section className="hero">
            <h1 className="hero-title">
              Build <span className="gradient-text">Passkey-Native</span> Solana Apps
            </h1>
            <p className="hero-subtitle">
              This template demonstrates LazorKit SDK integration with passkey
              authentication, gasless transactions, and smart wallet features.
            </p>
          </section>

          {/* Wallet Info (shown when connected) */}
          <section className="wallet-section">
            <WalletInfo />
          </section>

          {/* Demo Tabs */}
          <section className="demos-section">
            <nav className="demo-tabs">
              {/* Sliding indicator */}
              <div
                className="demo-tabs-indicator"
                style={{
                  transform: `translateX(${tabs.findIndex(t => t.id === activeTab) * 100}%)`,
                  width: `calc((100% - 0.75rem) / ${tabs.length})`,
                }}
              />
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  className={`demo-tab group ${activeTab === tab.id ? 'demo-tab-active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <span className="tab-icon">
                    <tab.Icon
                      size={18}
                      strokeWidth={1.5}
                      className={`transition-all duration-200 ${activeTab === tab.id
                        ? 'text-white'
                        : 'text-zinc-400 group-hover:text-zinc-200'
                        }`}
                    />
                  </span>
                  <span className="tab-label">{tab.label}</span>
                </button>
              ))}
            </nav>

            {/* Demo Content */}
            <div className="demo-content">
              {activeTab === 'passkey' && <PasskeyDemo />}
              {activeTab === 'transfer' && <GaslessTransfer />}
              {activeTab === 'sign' && <MessageSign />}
              {activeTab === 'mint' && <SponsoredMint />}
            </div>
          </section>

          {/* Architecture Diagram */}
          <section className="architecture-section">
            <h2 className="section-title">How LazorKit Works</h2>
            <div className="architecture-diagram">
              <div className="arch-row">
                <div className="arch-box arch-user">
                  <span className="arch-icon">
                    <User size={24} strokeWidth={1.5} className="text-blue-400" />
                  </span>
                  <span className="arch-label">User</span>
                  <span className="arch-desc">Authenticates with biometrics</span>
                </div>
                <div className="arch-arrow">
                  <ChevronRight size={20} strokeWidth={2} className="text-zinc-500" />
                </div>
                <div className="arch-box arch-passkey">
                  <span className="arch-icon">
                    <KeyRound size={24} strokeWidth={1.5} className="text-purple-400" />
                  </span>
                  <span className="arch-label">Passkey</span>
                  <span className="arch-desc">WebAuthn credential in Secure Enclave</span>
                </div>
                <div className="arch-arrow">
                  <ChevronRight size={20} strokeWidth={2} className="text-zinc-500" />
                </div>
                <div className="arch-box arch-wallet">
                  <span className="arch-icon">
                    <Wallet size={24} strokeWidth={1.5} className="text-emerald-400" />
                  </span>
                  <span className="arch-label">Smart Wallet</span>
                  <span className="arch-desc">PDA controlled by passkey</span>
                </div>
              </div>
              <div className="arch-row arch-row-second">
                <div className="arch-box arch-paymaster">
                  <span className="arch-icon">
                    <Fuel size={24} strokeWidth={1.5} className="text-orange-400" />
                  </span>
                  <span className="arch-label">Paymaster</span>
                  <span className="arch-desc">Sponsors gas fees</span>
                </div>
                <div className="arch-arrow">
                  <ChevronRight size={20} strokeWidth={2} className="text-zinc-500" />
                </div>
                <div className="arch-box arch-solana">
                  <span className="arch-icon">
                    <Circle size={24} strokeWidth={1.5} className="text-gradient-solana" />
                  </span>
                  <span className="arch-label">Solana</span>
                  <span className="arch-desc">Transaction executed on-chain</span>
                </div>
              </div>
            </div>
            <div className="architecture-comparison">
              <div className="comparison-card">
                <h4 className="comparison-header-bad">
                  <X size={18} strokeWidth={2} className="text-red-400" />
                  <span>Traditional Wallet</span>
                </h4>
                <ul>
                  <li>Install browser extension</li>
                  <li>Write down 24 seed words</li>
                  <li>Store seed phrase securely</li>
                  <li>Hold SOL for every transaction</li>
                </ul>
              </div>
              <div className="comparison-card comparison-card-good">
                <h4 className="comparison-header-good">
                  <Check size={18} strokeWidth={2} className="text-emerald-400" />
                  <span>LazorKit Smart Wallet</span>
                </h4>
                <ul>
                  <li>Use existing biometrics</li>
                  <li>No seed phrase needed</li>
                  <li>Keys never leave device</li>
                  <li>Gasless transactions possible</li>
                </ul>
              </div>
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="footer">
          <div className="footer-content">
            <p>
              Built with{' '}
              <a href="https://lazorkit.com" target="_blank" rel="noopener noreferrer">
                LazorKit SDK
              </a>
              {' • '}
              <a href="https://docs.lazorkit.com" target="_blank" rel="noopener noreferrer">
                Docs
              </a>
              {' • '}
              <a href="https://github.com/lazor-kit/lazor-kit" target="_blank" rel="noopener noreferrer">
                GitHub
              </a>
            </p>
            <p className="footer-network">
              Connected to <strong>Devnet</strong>
            </p>
          </div>
        </footer>
      </div>
    </LazorkitProvider>
  );
}

export default App;
