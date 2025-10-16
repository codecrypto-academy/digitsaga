'use client';

import { useState, useEffect } from 'react';
import { connectWallet, getBalance } from '@/lib/web3';

export default function WalletConnect() {
  const [account, setAccount] = useState<string | null>(null);
  const [balance, setBalance] = useState<string>('0');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if already connected
    if (typeof window.ethereum !== 'undefined') {
      window.ethereum.request({ method: 'eth_accounts' })
        .then((accounts: string[]) => {
          if (accounts.length > 0) {
            setAccount(accounts[0]);
            loadBalance(accounts[0]);
          }
        });

      // Listen for account changes
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          loadBalance(accounts[0]);
        } else {
          setAccount(null);
          setBalance('0');
        }
      });
    }
  }, []);

  const loadBalance = async (address: string) => {
    const bal = await getBalance(address);
    setBalance(bal);
  };

  const handleConnect = async () => {
    setLoading(true);
    const address = await connectWallet();
    if (address) {
      setAccount(address);
      await loadBalance(address);
    }
    setLoading(false);
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <div className="flex items-center gap-4">
      {account ? (
        <div className="flex items-center gap-3">
          <div className="text-sm">
            <div className="font-medium dark:text-white">{formatAddress(account)}</div>
            <div className="text-gray-600 dark:text-gray-400">{parseFloat(balance).toFixed(4)} ETH</div>
          </div>
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
        </div>
      ) : (
        <button
          onClick={handleConnect}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Connecting...' : 'Connect Wallet'}
        </button>
      )}
    </div>
  );
}
