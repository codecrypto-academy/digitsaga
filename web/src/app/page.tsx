'use client';

import { useEffect, useState } from 'react';
import ConfigCheck from '@/components/ConfigCheck';
import WalletConnect from '@/components/WalletConnect';
import DAOStats from '@/components/DAOStats';
import CreateProposal from '@/components/CreateProposal';
import ProposalList from '@/components/ProposalList';
import { startDaemon } from '@/lib/daemon';

export default function Home() {
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    // Start the daemon to monitor proposals
    startDaemon(60000); // Check every 60 seconds
  }, []);

  const handleProposalCreated = () => {
    // Refresh proposal list
    setRefreshKey(prev => prev + 1);
  };

  return (
    <ConfigCheck>
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">DAO Voting Platform</h1>
          <WalletConnect />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-1">
            <DAOStats key={refreshKey} />
          </div>
          <div className="lg:col-span-2">
            <CreateProposal onProposalCreated={handleProposalCreated} />
          </div>
        </div>

        <div>
          <ProposalList key={refreshKey} />
        </div>
      </main>

      <footer className="bg-white dark:bg-gray-800 border-t dark:border-gray-700 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-sm text-gray-600 dark:text-gray-400">
            <p className="mb-2">
              <strong className="dark:text-gray-200">DAO Voting Platform</strong> - Gasless voting powered by EIP-2771
            </p>
            <p className="text-xs">
              Connect your MetaMask wallet • Deposit ETH to participate • Create and vote on proposals
            </p>
          </div>
        </div>
      </footer>
    </div>
    </ConfigCheck>
  );
}
