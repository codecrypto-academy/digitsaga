'use client';

import { useState } from 'react';
import { ethers } from 'ethers';
import { getSigner } from '@/lib/web3';
import { getDAOContract, getForwarderContract, DAO_CONTRACT_ADDRESS } from '@/lib/contracts';
import { signMetaTxRequest, buildCreateProposalRequest } from '@/lib/metaTx';
import { createProposalDirect, getUserBalance } from '@/lib/daoHelpers';

interface CreateProposalProps {
  onProposalCreated: () => void;
}

export default function CreateProposal({ onProposalCreated }: CreateProposalProps) {
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [duration, setDuration] = useState('7'); // days
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [useGasless, setUseGasless] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent multiple simultaneous submissions
    if (submitting) {
      console.log('⚠️ Transaction already in progress, ignoring duplicate submission');
      return;
    }
    
    setError('');
    setLoading(true);
    setSubmitting(true);

    try {
      const signer = await getSigner();
      if (!signer) {
        throw new Error('Wallet not connected');
      }

      const userAddress = await signer.getAddress();

      // Check if user has enough balance in the DAO to create proposal
      const userBalanceInDAO = await getUserBalance(signer, userAddress);
      const daoContract = getDAOContract(signer);
      const contractBalance = await daoContract.getBalance();
      const requiredBalance = (contractBalance * BigInt(10)) / BigInt(100); // 10%

      if (userBalanceInDAO < requiredBalance) {
        throw new Error(
          `You need at least ${ethers.formatEther(requiredBalance)} ETH deposited in the DAO to create a proposal (10% of DAO balance). ` +
          `You currently have ${ethers.formatEther(userBalanceInDAO)} ETH deposited.`
        );
      }

      // Convert amount to wei
      const amountWei = ethers.parseEther(amount);

      // Convert duration from days to seconds
      const votingDuration = parseInt(duration) * 24 * 60 * 60;

      if (useGasless) {
        // Gasless meta-transaction flow
        const forwarderContract = getForwarderContract(signer);

        // Build meta-transaction request
        const request = await buildCreateProposalRequest(
          DAO_CONTRACT_ADDRESS,
          userAddress,
          recipient,
          amountWei,
          votingDuration,
          description
        );

        // Sign the meta-transaction
        const { request: signedRequest, signature } = await signMetaTxRequest(
          signer,
          forwarderContract,
          { ...request, from: userAddress }
        );

        // Send to relayer
        const response = await fetch('/api/relay', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            request: {
              from: signedRequest.from,
              to: signedRequest.to,
              value: signedRequest.value.toString(),
              gas: signedRequest.gas.toString(),
              nonce: signedRequest.nonce.toString(),
              data: signedRequest.data,
            },
            signature,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to create proposal.');
        }

        alert('Proposal created successfully! (Gasless transaction)');
      } else {
        // Direct transaction (user pays gas)
        await createProposalDirect(
          signer,
          recipient,
          amountWei,
          votingDuration,
          description
        );

        alert('Proposal created successfully!');
      }

      // Reset form
      setRecipient('');
      setAmount('');
      setDuration('7');
      setDescription('');

      // Notify parent
      onProposalCreated();
    } catch (err: unknown) {
      console.error('Error creating proposal:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to create proposal';
      setError(errorMessage);
    } finally {
      setLoading(false);
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-4 dark:text-white">Create Proposal</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1 dark:text-gray-200">
            Recipient Address
          </label>
          <input
            type="text"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="0x..."
            required
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 dark:text-gray-200">
            Amount (ETH)
          </label>
          <input
            type="number"
            step="0.001"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.0"
            required
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 dark:text-gray-200">
            Voting Duration (days)
          </label>
          <input
            type="number"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            min="1"
            required
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 dark:text-gray-200">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the proposal..."
            required
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
          />
        </div>

        {error && (
          <div className="p-3 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-400 rounded">
            {error}
          </div>
        )}

        <div className="flex items-center gap-3 mb-3">
          <input
            type="checkbox"
            id="useGasless"
            checked={useGasless}
            onChange={(e) => setUseGasless(e.target.checked)}
            className="w-4 h-4"
          />
          <label htmlFor="useGasless" className="text-sm text-gray-700 dark:text-gray-300">
            Use gasless transaction (relayer pays gas)
          </label>
        </div>

        <button
          type="submit"
          disabled={loading || submitting}
          className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {loading || submitting ? 'Creating Proposal...' : useGasless ? 'Create Proposal (Gasless)' : 'Create Proposal (Pay Gas)'}
        </button>

        <p className="text-sm text-gray-600 dark:text-gray-400">
          Note: You need at least 10% of the DAO contract balance to create a proposal.
        </p>
      </form>
    </div>
  );
}
