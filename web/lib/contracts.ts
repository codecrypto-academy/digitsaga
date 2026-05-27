// Smart contract addresses (populated by deploy.sh)
export const ESCROW_ADDRESS = process.env.NEXT_PUBLIC_ESCROW_ADDRESS || '';
export const TOKEN_A_ADDRESS = process.env.NEXT_PUBLIC_TOKEN_A_ADDRESS || '';
export const TOKEN_B_ADDRESS = process.env.NEXT_PUBLIC_TOKEN_B_ADDRESS || '';
export const CHAIN_ID = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '31337', 10);

// Escrow contract ABI (extracted from compiled Escrow.sol)
export { default as ESCROW_ABI } from './escrow-abi.json';

// ERC20 contract ABI (minimal set for DApp interaction)
export const ERC20_ABI = [
  'function balanceOf(address account) external view returns (uint256)',
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function transfer(address to, uint256 amount) external returns (bool)',
  'function transferFrom(address from, address to, uint256 amount) external returns (bool)',
  'function allowance(address owner, address spender) external view returns (uint256)',
  'function decimals() external view returns (uint8)',
  'function symbol() external view returns (string)',
  'function name() external view returns (string)',
];
