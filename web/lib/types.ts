// TypeScript interfaces for the ESCROW DApp

export interface Operation {
  id: bigint;
  creator: string;
  tokenA: string;
  tokenB: string;
  amountA: bigint;
  amountB: bigint;
  status: number; // 0=PENDING, 1=COMPLETED, 2=CANCELLED
}

export interface ContractAddresses {
  escrow: string;
  tokenA: string;
  tokenB: string;
}

export interface OperationStatus {
  PENDING: 0;
  COMPLETED: 1;
  CANCELLED: 2;
}

export interface UserBalance {
  tokenA: bigint;
  tokenB: bigint;
}

export interface EthereumContextType {
  connected: boolean;
  account: string | null;
  provider: any; // BrowserProvider
  signer: any; // Signer
  chainId: number | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  escrowContract: any; // Contract
  tokenAContract: any; // Contract
  tokenBContract: any; // Contract
  error: string | null;
}
