'use client';

import { useState } from 'react';
import { useEthereum } from '@/lib/ethereum';
import ConnectButton from '@/components/ConnectButton';
import AddToken from '@/components/AddToken';
import CreateOperation from '@/components/CreateOperation';
import OperationList from '@/components/OperationList';
import BalanceDebug from '@/components/BalanceDebug';
import ErrorBoundary from '@/components/ErrorBoundary';
import Toast from '@/components/Toast';

type Tab = 'create' | 'browse' | 'debug';

const TABS: { key: Tab; label: string }[] = [
  { key: 'create', label: 'Create Operation' },
  { key: 'browse', label: 'Browse Operations' },
  { key: 'debug', label: 'Debug' },
];

export default function Page() {
  const { connected } = useEthereum();
  const [activeTab, setActiveTab] = useState<Tab>('create');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Toast />

      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">ESCROW DApp</h1>
            <p className="text-sm text-gray-500">Secure peer-to-peer token swaps with escrow</p>
          </div>
          <ConnectButton />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Disconnected state */}
        {!connected && (
          <div className="max-w-lg mx-auto mt-16">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
              <div className="text-5xl mb-4">🔒</div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Welcome to ESCROW DApp
              </h2>
              <p className="text-gray-500 mb-6">
                Connect your MetaMask wallet to start swapping tokens securely.
                Make sure you are connected to the Anvil local network (chain ID 31337).
              </p>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm">
                <span className="w-2 h-2 bg-blue-500 rounded-full" />
                Click &ldquo;Connect MetaMask&rdquo; to get started
              </div>
            </div>
          </div>
        )}

        {/* Connected state */}
        {connected && (
          <>
            {/* Tab Navigation */}
            <div className="mb-6">
              <div className="flex gap-1 bg-white rounded-xl shadow-sm border border-gray-200 p-1">
                {TABS.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${
                      activeTab === tab.key
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <ErrorBoundary>
              {activeTab === 'create' && (
                <div className="space-y-4">
                  <AddToken />
                  <CreateOperation />
                </div>
              )}

              {activeTab === 'browse' && <OperationList />}

              {activeTab === 'debug' && <BalanceDebug />}
            </ErrorBoundary>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-gray-500">
          <p>ESCROW DApp &bull; Built with Solidity, Next.js 15, and ethers.js v6</p>
        </div>
      </footer>
    </div>
  );
}
