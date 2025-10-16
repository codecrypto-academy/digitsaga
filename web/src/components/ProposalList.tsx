'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { getProvider, getSigner } from '@/lib/web3';
import { getDAOContract, getForwarderContract, VoteType, Proposal, DAO_CONTRACT_ADDRESS } from '@/lib/contracts';
import { signMetaTxRequest, buildVoteRequest } from '@/lib/metaTx';
import { voteDirect, getProposalCount, getProposal, getUserVote } from '@/lib/daoHelpers';

interface ProposalWithVote extends Proposal {
  userVote?: number;
}

export default function ProposalList() {
  const [proposals, setProposals] = useState<ProposalWithVote[]>([]);
  const [loading, setLoading] = useState(true);
  const [votingProposal, setVotingProposal] = useState<number | null>(null);
  const [useGasless, setUseGasless] = useState(true);
  const [userAddress, setUserAddress] = useState<string | null>(null);
  const [blockchainTime, setBlockchainTime] = useState<number>(0);

  useEffect(() => {
    loadProposals();
    const interval = setInterval(loadProposals, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const loadProposals = async () => {
    try {
      const provider = getProvider();
      if (!provider) {
        console.error('No provider available');
        setLoading(false);
        return;
      }

      console.log('Loading proposals...');

      // Get current blockchain timestamp FIRST
      try {
        // Force fresh block by getting block number first, then fetching that specific block
        const blockNumber = await provider.getBlockNumber();
        console.log('Current block number:', blockNumber);

        const latestBlock = await provider.getBlock(blockNumber);
        console.log('Latest block:', latestBlock);
        if (latestBlock) {
          const timestamp = Number(latestBlock.timestamp);
          console.log('Blockchain timestamp (number):', timestamp);
          console.log('Blockchain time:', new Date(timestamp * 1000).toLocaleString());
          setBlockchainTime(timestamp);
        } else {
          console.error('Latest block is null');
        }
      } catch (error) {
        console.error('Error getting latest block:', error);
      }

      const count = await getProposalCount(provider);
      const proposalsList: ProposalWithVote[] = [];

      // Get user address if connected
      let currentUserAddress: string | null = null;
      try {
        const signer = await getSigner();
        if (signer) {
          currentUserAddress = await signer.getAddress();
          setUserAddress(currentUserAddress);
        }
      } catch {
        // User not connected
      }

      for (let i = 1; i <= count; i++) {
        const proposal = await getProposal(provider, i);

        // Get user's vote if connected
        let userVote: number | undefined = undefined;
        if (currentUserAddress) {
          try {
            const vote = await getUserVote(provider, i, currentUserAddress);
            userVote = Number(vote);
          } catch {
            // Error getting vote, skip
          }
        }

        proposalsList.push({
          id: proposal[0],
          recipient: proposal[1],
          amount: proposal[2],
          votingDeadline: proposal[3],
          executionDelay: proposal[4],
          executed: proposal[5],
          forVotes: proposal[6],
          againstVotes: proposal[7],
          abstainVotes: proposal[8],
          description: proposal[9],
          userVote,
        });
      }

      setProposals(proposalsList.reverse()); // Show newest first
      setLoading(false);
    } catch (error) {
      console.error('Error loading proposals:', error);
      setLoading(false);
    }
  };

  const handleVote = async (proposalId: number, voteType: VoteType) => {
    setVotingProposal(proposalId);

    try {
      const signer = await getSigner();
      if (!signer) {
        alert('Please connect your wallet');
        return;
      }

      if (useGasless) {
        // Gasless meta-transaction flow
        const userAddress = await signer.getAddress();
        const forwarderContract = getForwarderContract(signer);

        // Build vote request
        const request = await buildVoteRequest(
          DAO_CONTRACT_ADDRESS,
          userAddress,
          proposalId,
          voteType
        );

        // Sign meta-transaction
        const { request: signedRequest, signature } = await signMetaTxRequest(
          signer,
          forwarderContract,
          request
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
          throw new Error(errorData.message || 'Failed to vote');
        }

        alert('Vote submitted successfully! (Gasless transaction)');
      } else {
        // Direct transaction (user pays gas)
        await voteDirect(signer, proposalId, voteType);
        alert('Vote submitted successfully!');
      }

      // Reload proposals
      setTimeout(loadProposals, 2000);
    } catch (err: any) {
      console.error('Error voting:', err);
      alert(err.message || 'Failed to vote');
    } finally {
      setVotingProposal(null);
    }
  };

  const formatDate = (timestamp: bigint) => {
    return new Date(Number(timestamp) * 1000).toLocaleString();
  };

  const getProposalStatus = (proposal: Proposal) => {
    const now = blockchainTime > 0 ? blockchainTime : Math.floor(Date.now() / 1000);
    if (proposal.executed) return 'Executed';
    if (now < Number(proposal.votingDeadline)) return 'Active';
    if (proposal.forVotes > proposal.againstVotes) return 'Approved';
    return 'Rejected';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'Approved': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'Rejected': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'Executed': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const canVote = (proposal: Proposal) => {
    const now = blockchainTime > 0 ? blockchainTime : Math.floor(Date.now() / 1000);
    return now < Number(proposal.votingDeadline) && !proposal.executed;
  };

  const getVoteTypeLabel = (voteType: number) => {
    switch (voteType) {
      case 0: return { label: 'Abstain', color: 'text-gray-600 dark:text-gray-400' };
      case 1: return { label: 'For', color: 'text-green-600 dark:text-green-400' };
      case 2: return { label: 'Against', color: 'text-red-600 dark:text-red-400' };
      default: return { label: 'Unknown', color: 'text-gray-600 dark:text-gray-400' };
    }
  };

  const getTimeRemaining = (deadline: bigint) => {
    if (blockchainTime === 0) return '';

    const remaining = Number(deadline) - blockchainTime;
    if (remaining <= 0) return 'Ended';

    const days = Math.floor(remaining / 86400);
    const hours = Math.floor((remaining % 86400) / 3600);
    const minutes = Math.floor((remaining % 3600) / 60);

    if (days > 0) return `${days}d ${hours}h remaining`;
    if (hours > 0) return `${hours}h ${minutes}m remaining`;
    return `${minutes}m remaining`;
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-4 dark:text-white">Proposals</h2>
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">Loading proposals...</div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold dark:text-white">Proposals</h2>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="useGaslessVoting"
            checked={useGasless}
            onChange={(e) => setUseGasless(e.target.checked)}
            className="w-4 h-4"
          />
          <label htmlFor="useGaslessVoting" className="text-sm text-gray-700 dark:text-gray-300">
            Gasless voting
          </label>
        </div>
      </div>

      {blockchainTime > 0 && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="text-sm text-gray-700 dark:text-gray-300">
            <span className="font-semibold">⏰ Blockchain Time: </span>
            <span className="font-mono text-blue-600 dark:text-blue-400">
              {formatDate(BigInt(blockchainTime))}
            </span>
            <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
              (Timestamp: {blockchainTime})
            </span>
          </div>
        </div>
      )}

      {proposals.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No proposals yet. Create the first one!
        </div>
      ) : (
        <div className="space-y-4">
          {proposals.map((proposal) => {
            const status = getProposalStatus(proposal);
            const totalVotes = proposal.forVotes + proposal.againstVotes + proposal.abstainVotes;

            return (
              <div key={proposal.id.toString()} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 dark:bg-gray-700/30">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-lg dark:text-white">Proposal #{proposal.id.toString()}</h3>
                    <span className={`inline-block px-2 py-1 text-xs rounded-full ${getStatusColor(status)} mt-1`}>
                      {status}
                    </span>
                  </div>
                  <div className="text-right text-sm">
                    <div className="font-medium dark:text-white">{ethers.formatEther(proposal.amount)} ETH</div>
                    <div className="text-gray-600 dark:text-gray-400">to {proposal.recipient.slice(0, 10)}...</div>
                  </div>
                </div>

                <p className="text-gray-700 dark:text-gray-300 mb-3">{proposal.description}</p>

                {(() => {
                  const totalVotes = Number(proposal.forVotes) + Number(proposal.againstVotes) + Number(proposal.abstainVotes);
                  const forPercentage = totalVotes > 0 ? (Number(proposal.forVotes) / totalVotes * 100).toFixed(1) : '0';
                  const againstPercentage = totalVotes > 0 ? (Number(proposal.againstVotes) / totalVotes * 100).toFixed(1) : '0';
                  const abstainPercentage = totalVotes > 0 ? (Number(proposal.abstainVotes) / totalVotes * 100).toFixed(1) : '0';

                  return (
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-2">
                        <span>Vote Statistics</span>
                        <span className="font-semibold">Total Votes: {totalVotes}</span>
                      </div>

                      {/* Progress bars */}
                      <div className="space-y-2 mb-3">
                        {/* For votes */}
                        <div>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-green-600 dark:text-green-400 font-semibold">For</span>
                            <span className="text-gray-600 dark:text-gray-400">{proposal.forVotes.toString()} ({forPercentage}%)</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div className="bg-green-600 dark:bg-green-500 h-2 rounded-full transition-all" style={{width: `${forPercentage}%`}}></div>
                          </div>
                        </div>

                        {/* Against votes */}
                        <div>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-red-600 dark:text-red-400 font-semibold">Against</span>
                            <span className="text-gray-600 dark:text-gray-400">{proposal.againstVotes.toString()} ({againstPercentage}%)</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div className="bg-red-600 dark:bg-red-500 h-2 rounded-full transition-all" style={{width: `${againstPercentage}%`}}></div>
                          </div>
                        </div>

                        {/* Abstain votes */}
                        <div>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-gray-600 dark:text-gray-400 font-semibold">Abstain</span>
                            <span className="text-gray-600 dark:text-gray-400">{proposal.abstainVotes.toString()} ({abstainPercentage}%)</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div className="bg-gray-500 dark:bg-gray-600 h-2 rounded-full transition-all" style={{width: `${abstainPercentage}%`}}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                <div className="text-xs text-gray-600 dark:text-gray-400 mb-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <span>Voting ends: {formatDate(proposal.votingDeadline)}</span>
                    {getTimeRemaining(proposal.votingDeadline) && (
                      <span className="font-semibold text-blue-600 dark:text-blue-400">
                        {getTimeRemaining(proposal.votingDeadline)}
                      </span>
                    )}
                  </div>
                  {status === 'Approved' && (
                    <div className="flex items-center justify-between">
                      <span>Can execute after: {formatDate(proposal.executionDelay)}</span>
                      {getTimeRemaining(proposal.executionDelay) && (
                        <span className="font-semibold text-green-600 dark:text-green-400">
                          {getTimeRemaining(proposal.executionDelay)}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {userAddress && proposal.userVote !== undefined && (
                  <div className="mb-3 p-2 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <div className="text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Your vote: </span>
                      <span className={`font-semibold ${getVoteTypeLabel(proposal.userVote).color}`}>
                        {getVoteTypeLabel(proposal.userVote).label}
                      </span>
                    </div>
                  </div>
                )}

                {canVote(proposal) && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleVote(Number(proposal.id), VoteType.FOR)}
                      disabled={votingProposal === Number(proposal.id)}
                      className="flex-1 px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 text-sm"
                    >
                      Vote For
                    </button>
                    <button
                      onClick={() => handleVote(Number(proposal.id), VoteType.AGAINST)}
                      disabled={votingProposal === Number(proposal.id)}
                      className="flex-1 px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-400 text-sm"
                    >
                      Vote Against
                    </button>
                    <button
                      onClick={() => handleVote(Number(proposal.id), VoteType.ABSTAIN)}
                      disabled={votingProposal === Number(proposal.id)}
                      className="flex-1 px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:bg-gray-400 text-sm"
                    >
                      Abstain
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
