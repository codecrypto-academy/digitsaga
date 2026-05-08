'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { connectWallet, getBalance } from '@/lib/web3';

declare const window: Window & {
  ethereum?: {
    request(args: { method: string; params?: unknown[] }): Promise<unknown>;
    on(event: string, listener: (...args: unknown[]) => void): void;
    removeListener(event: string, listener: (...args: unknown[]) => void): void;
  };
};

export default function WalletConnect() {
  const [account, setAccount] = useState<string | null>(null);
  const [balance, setBalance] = useState<string>('0');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if already connected
    if (typeof window.ethereum !== 'undefined') {
      window.ethereum.request({ method: 'eth_accounts' })
        .then((accounts) => {
          const accs = accounts as string[];
          if (accs.length > 0) {
            setAccount(accs[0]);
            loadBalance(accs[0]);
          }
        });

      // Listen for account changes
      window.ethereum.on('accountsChanged', (accounts) => {
        const accs = accounts as unknown as string[];
        if (accs.length > 0) {
          setAccount(accs[0]);
          loadBalance(accs[0]);
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
      <AnimatePresence mode="wait">
        {account ? (
          <motion.div
            key="connected"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-3"
          >
            <div className="text-sm">
              <div className="font-medium dark:text-white">{formatAddress(account)}</div>
              <div className="text-gray-600 dark:text-gray-400">{parseFloat(balance).toFixed(4)} ETH</div>
            </div>
            <motion.div
              animate={{ 
                scale: [1, 1.2, 1],
                boxShadow: ['0 0 0 rgba(34, 197, 94, 0)', '0 0 0 4px rgba(34, 197, 94, 0.3)', '0 0 0 0 rgba(34, 197, 94, 0)']
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-3 h-3 bg-green-500 rounded-full"
            />
          </motion.div>
        ) : (
          <motion.button
            key="disconnected"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            onClick={handleConnect}
            disabled={loading}
            whileHover={{ scale: loading ? 1 : 1.05, backgroundColor: loading ? undefined : '#2563eb' }}
            whileTap={{ scale: loading ? 1 : 0.95 }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Connecting...' : 'Connect Wallet'}
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
