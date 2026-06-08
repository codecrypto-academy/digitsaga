import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';

const EUROTOKEN_ABI = [
  "function mint(address to, uint256 amount) external",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address account) view returns (uint256)",
  "function decimals() view returns (uint8)"
];

export async function POST(request: NextRequest) {
  try {
    const { walletAddress, amount } = await request.json();

    if (!walletAddress || !amount) {
      return NextResponse.json(
        { error: 'Wallet address and amount are required' },
        { status: 400 }
      );
    }

    // Connect to blockchain
    const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');

    const signer = new ethers.Wallet(
      process.env.OWNER_PRIVATE_KEY!,
      provider
    );

    const contract = new ethers.Contract(
      process.env.NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS!,
      EUROTOKEN_ABI,
      signer
    );

    // Calculate amount with 6 decimals
    const amountToMint = ethers.parseUnits(amount.toString(), 6);

    // Mint tokens
    const tx = await contract.mint(walletAddress, amountToMint);
    await tx.wait();

    // Get updated balances
    const newBalance = await contract.balanceOf(walletAddress);
    const totalSupply = await contract.totalSupply();

    return NextResponse.json({
      success: true,
      transactionHash: tx.hash,
      amountMinted: amount,
      walletAddress,
      newBalance: ethers.formatUnits(newBalance, 6),
      totalSupply: ethers.formatUnits(totalSupply, 6)
    });

  } catch (error) {
    console.error('Error minting tokens:', error);
    return NextResponse.json(
      { error: 'Failed to mint tokens', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}