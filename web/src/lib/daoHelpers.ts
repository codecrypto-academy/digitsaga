import { ethers } from 'ethers';
import { getDAOContract, VoteType } from './contracts';

/**
 * Helper functions to interact with DAO contract directly (without relay)
 */

/**
 * Create a proposal - pays gas directly
 */
export async function createProposalDirect(
  signer: ethers.Signer,
  recipient: string,
  amount: bigint,
  votingDuration: number,
  description: string
) {
  const daoContract = getDAOContract(signer);

  const tx = await daoContract.createProposal(
    recipient,
    amount,
    votingDuration,
    description
  );

  return await tx.wait();
}

/**
 * Vote on a proposal - pays gas directly
 */
export async function voteDirect(
  signer: ethers.Signer,
  proposalId: number,
  voteType: VoteType
) {
  const daoContract = getDAOContract(signer);

  const tx = await daoContract.vote(proposalId, voteType);

  return await tx.wait();
}

/**
 * Deposit ETH to DAO - pays gas directly
 */
export async function depositDirect(
  signer: ethers.Signer,
  amount: bigint
) {
  const daoContract = getDAOContract(signer);

  const tx = await daoContract.deposit({ value: amount });

  return await tx.wait();
}

/**
 * Execute a proposal - pays gas directly
 */
export async function executeProposalDirect(
  signer: ethers.Signer,
  proposalId: number
) {
  const daoContract = getDAOContract(signer);

  const tx = await daoContract.executeProposal(proposalId);

  return await tx.wait();
}

/**
 * Get user's balance in the DAO
 */
export async function getUserBalance(
  signerOrProvider: ethers.Signer | ethers.Provider,
  userAddress: string
): Promise<bigint> {
  const daoContract = getDAOContract(signerOrProvider);
  return await daoContract.getUserBalance(userAddress);
}

/**
 * Get total deposited in the DAO
 */
export async function getTotalDeposited(
  signerOrProvider: ethers.Signer | ethers.Provider
): Promise<bigint> {
  const daoContract = getDAOContract(signerOrProvider);
  return await daoContract.getTotalDeposited();
}

/**
 * Get DAO balance (same as getTotalDeposited)
 */
export async function getDAOBalance(
  signerOrProvider: ethers.Signer | ethers.Provider
): Promise<bigint> {
  const daoContract = getDAOContract(signerOrProvider);
  return await daoContract.getBalance();
}

/**
 * Get proposal count
 */
export async function getProposalCount(
  signerOrProvider: ethers.Signer | ethers.Provider
): Promise<bigint> {
  const daoContract = getDAOContract(signerOrProvider);
  return await daoContract.proposalCount();
}

/**
 * Get proposal details
 */
export async function getProposal(
  signerOrProvider: ethers.Signer | ethers.Provider,
  proposalId: number
) {
  const daoContract = getDAOContract(signerOrProvider);
  return await daoContract.getProposal(proposalId);
}

/**
 * Check if a proposal can be executed
 */
export async function canExecuteProposal(
  signerOrProvider: ethers.Signer | ethers.Provider,
  proposalId: number
): Promise<boolean> {
  const daoContract = getDAOContract(signerOrProvider);
  return await daoContract.canExecute(proposalId);
}

/**
 * Get user's vote on a proposal
 */
export async function getUserVote(
  signerOrProvider: ethers.Signer | ethers.Provider,
  proposalId: number,
  userAddress: string
): Promise<VoteType> {
  const daoContract = getDAOContract(signerOrProvider);
  return await daoContract.getUserVote(proposalId, userAddress);
}
