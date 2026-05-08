'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
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

  const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' }
  }
};

const inputVariants = {
  focus: { scale: 1.01, borderColor: '#3b82f6' }
};

return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6"
    >
      <motion.h2 
        className="text-2xl font-bold mb-2 dark:text-white"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
      >
        Create Proposal
      </motion.h2>
      
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="inline-flex items-center gap-1.5 mb-4"
      >
        <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-full">
          New
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          Submit a new funding request
        </span>
      </motion.div>

      <motion.form 
          onSubmit={handleSubmit} 
          className="space-y-4"
          variants={containerVariants}
        >
        <motion.div
          variants={inputVariants}
          whileFocus="focus"
        >
          <label className="block text-sm font-medium mb-1 dark:text-gray-200">
            Recipient Address
          </label>
          <input
            type="text"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="0x..."
            required
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 transition-colors"
          />
        </motion.div>

        <motion.div variants={inputVariants} whileFocus="focus">
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
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 transition-colors"
          />
        </motion.div>

        <motion.div variants={inputVariants} whileFocus="focus">
          <label className="block text-sm font-medium mb-1 dark:text-gray-200">
            Voting Duration (days)
          </label>
          <input
            type="number"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            min="1"
            required
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 transition-colors"
          />
        </motion.div>

        <motion.div variants={inputVariants} whileFocus="focus">
          <label className="block text-sm font-medium mb-1 dark:text-gray-200">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the proposal..."
            required
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 transition-colors"
          />
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-3 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-400 rounded"
          >
            {error}
          </motion.div>
        )}

        <motion.div 
          className="flex items-center gap-3 mb-3"
          whileTap={{ scale: 0.98 }}
        >
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
        </motion.div>

        <motion.button
          type="submit"
          disabled={loading || submitting}
          whileHover={loading || submitting ? {} : { backgroundColor: '#16a34a' }}
          whileTap={loading || submitting ? {} : { scale: 0.98 }}
          className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {loading || submitting ? (
            <motion.span
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              Creating Proposal...
            </motion.span>
          ) : useGasless ? 'Create Proposal (Gasless)' : 'Create Proposal (Pay Gas)'}
        </motion.button>

        <motion.p 
          className="text-sm text-gray-600 dark:text-gray-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          Note: You need at least 10% of the DAO contract balance to create a proposal.
        </motion.p>
      </motion.form>
    </motion.div>
  );
}
