'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { getProvider, getSigner } from '@/lib/web3';
import { getDAOBalance, getUserBalance as getUserBalanceHelper, getProposalCount as getProposalCountHelper, depositDirect } from '@/lib/daoHelpers';

export default function DAOStats() {
  const [balance, setBalance] = useState('0');
  const [userBalance, setUserBalance] = useState('0');
  const [proposalCount, setProposalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [depositing, setDepositing] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [userAddress, setUserAddress] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const loadStats = async () => {
    try {
      const provider = getProvider();
      if (!provider) {
        setLoading(false);
        return;
      }

      const bal = await getDAOBalance(provider);
      const count = await getProposalCountHelper(provider);

      setBalance(ethers.formatEther(bal));
      setProposalCount(Number(count));

      // Get user's balance in the DAO
      try {
        const signer = await getSigner();
        if (signer) {
          const address = await signer.getAddress();
          setUserAddress(address);
          const userBal = await getUserBalanceHelper(provider, address);
          setUserBalance(ethers.formatEther(userBal));
        }
      } catch (err) {
        // User not connected, it's ok
      }

      setLoading(false);
    } catch (error) {
      console.error('Error loading stats:', error);
      setLoading(false);
    }
  };

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDepositing(true);

    try {
      const signer = await getSigner();
      if (!signer) {
        alert('Please connect your wallet');
        return;
      }

      const amountWei = ethers.parseEther(depositAmount);
      await depositDirect(signer, amountWei);

      alert('Deposit successful!');
      setDepositAmount('');
      await loadStats();
    } catch (err: any) {
      console.error('Error depositing:', err);
      alert(err.message || 'Failed to deposit');
    } finally {
      setDepositing(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-4 dark:text-white">DAO Treasury</h2>
        <div className="text-center py-4 text-gray-500 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-4 dark:text-white">DAO Treasury</h2>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Treasury Balance</div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{parseFloat(balance).toFixed(4)} ETH</div>
        </div>
        <div className="bg-green-50 dark:bg-green-900/30 p-4 rounded-lg">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Proposals</div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">{proposalCount}</div>
        </div>
      </div>

      {userAddress && (
        <div className="bg-purple-50 dark:bg-purple-900/30 p-4 rounded-lg mb-6">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Your Balance in DAO</div>
          <div className="text-xl font-bold text-purple-600 dark:text-purple-400">{parseFloat(userBalance).toFixed(4)} ETH</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {parseFloat(balance) > 0
              ? `${((parseFloat(userBalance) / parseFloat(balance)) * 100).toFixed(2)}% of total`
              : '0% of total'}
          </div>
        </div>
      )}

      <form onSubmit={handleDeposit} className="space-y-3">
        <div>
          <label className="block text-sm font-medium mb-1 dark:text-gray-200">
            Deposit ETH to DAO
          </label>
          <input
            type="number"
            step="0.001"
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value)}
            placeholder="0.0"
            required
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
          />
        </div>
        <button
          type="submit"
          disabled={depositing}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {depositing ? 'Depositing...' : 'Deposit to DAO'}
        </button>
        <p className="text-xs text-gray-600 dark:text-gray-400">
          Depositing ETH allows you to participate in voting (requires minimum balance)
        </p>
      </form>
    </div>
  );
}
