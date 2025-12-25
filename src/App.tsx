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
// DEMO TABS
// =============================================================================

type DemoTab = 'passkey' | 'transfer' | 'sign' | 'mint';

const tabs: { id: DemoTab; label: string; icon: string }[] = [
  { id: 'passkey', label: 'Passkey Auth', icon: '🔐' },
  { id: 'transfer', label: 'Gasless Transfer', icon: '💸' },
  { id: 'sign', label: 'Sign Message', icon: '✍️' },
  { id: 'mint', label: 'Token Mint', icon: '🪙' },
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
            <div className="header-brand">
              <span className="brand-logo">⚡</span>
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
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  className={`demo-tab ${activeTab === tab.id ? 'demo-tab-active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <span className="tab-icon">{tab.icon}</span>
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
                  <span className="arch-icon">👤</span>
                  <span className="arch-label">User</span>
                  <span className="arch-desc">Authenticates with biometrics</span>
                </div>
                <div className="arch-arrow">→</div>
                <div className="arch-box arch-passkey">
                  <span className="arch-icon">🔐</span>
                  <span className="arch-label">Passkey</span>
                  <span className="arch-desc">WebAuthn credential in Secure Enclave</span>
                </div>
                <div className="arch-arrow">→</div>
                <div className="arch-box arch-wallet">
                  <span className="arch-icon">💼</span>
                  <span className="arch-label">Smart Wallet</span>
                  <span className="arch-desc">PDA controlled by passkey</span>
                </div>
              </div>
              <div className="arch-row arch-row-second">
                <div className="arch-box arch-paymaster">
                  <span className="arch-icon">⛽</span>
                  <span className="arch-label">Paymaster</span>
                  <span className="arch-desc">Sponsors gas fees</span>
                </div>
                <div className="arch-arrow">→</div>
                <div className="arch-box arch-solana">
                  <span className="arch-icon">◎</span>
                  <span className="arch-label">Solana</span>
                  <span className="arch-desc">Transaction executed on-chain</span>
                </div>
              </div>
            </div>
            <div className="architecture-comparison">
              <div className="comparison-card">
                <h4>❌ Traditional Wallet</h4>
                <ul>
                  <li>Install browser extension</li>
                  <li>Write down 24 seed words</li>
                  <li>Store seed phrase securely</li>
                  <li>Hold SOL for every transaction</li>
                </ul>
              </div>
              <div className="comparison-card comparison-card-good">
                <h4>✅ LazorKit Smart Wallet</h4>
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
