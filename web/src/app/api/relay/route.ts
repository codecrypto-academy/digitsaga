import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';

const RELAYER_PRIVATE_KEY = process.env.RELAYER_PRIVATE_KEY || '';
const FORWARDER_ADDRESS = process.env.NEXT_PUBLIC_FORWARDER_CONTRACT_ADDRESS || '';
const RPC_URL = process.env.RPC_URL || 'http://127.0.0.1:8545';

const FORWARDER_ABI = [
  'function execute((address from,address to,uint256 value,uint256 gas,uint256 nonce,bytes data) req, bytes signature) payable returns (bool, bytes)',
  'function getNonce(address from) view returns (uint256)'
];

export async function POST(request: NextRequest) {
  let userAddress: string | null = null;
  
  try {
    const body = await request.json();
    const { request: forwardRequest, signature } = body;

    // Check if user is already processing a transaction
    userAddress = forwardRequest.from.toLowerCase();
   
    // Lock the user

    if (!forwardRequest || !signature) {
      return NextResponse.json(
        { error: 'Missing request or signature' },
        { status: 400 }
      );
    }

    // Validate relayer configuration
    if (!RELAYER_PRIVATE_KEY) {
      console.error('RELAYER_PRIVATE_KEY not configured');
      return NextResponse.json(
        { error: 'Relayer not configured' },
        { status: 500 }
      );
    }

    if (!FORWARDER_ADDRESS) {
      console.error('NEXT_PUBLIC_FORWARDER_CONTRACT_ADDRESS not configured');
      return NextResponse.json(
        { error: 'Forwarder contract not configured' },
        { status: 500 }
      );
    }

    // Connect to blockchain
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const relayer = new ethers.Wallet(RELAYER_PRIVATE_KEY, provider);
    const forwarder = new ethers.Contract(FORWARDER_ADDRESS, FORWARDER_ABI, relayer);

    console.log('Relaying transaction from:', forwardRequest.from);
    console.log('To contract:', forwardRequest.to);
    console.log('Request:', forwardRequest);
    console.log('Signature:', signature);
    console.log('Gas limit:', forwardRequest.gas);
    console.log('Nonce:', forwardRequest.nonce);
    console.log('Data:', forwardRequest.data);
    console.log('Value:', forwardRequest.value);
    console.log('From:', forwardRequest.from);
    console.log('To:', forwardRequest.to);

    // Check current nonce on forwarder
    const currentNonce = await forwarder.getNonce(forwardRequest.from);
    console.log('🔢 Nonce verification:');
    console.log('  Current nonce on forwarder:', currentNonce.toString());
    console.log('  Requested nonce:', forwardRequest.nonce);
    console.log('  From address:', forwardRequest.from);

    // Validate nonce before executing
    const requestedNonce = BigInt(forwardRequest.nonce);
    if (requestedNonce !== currentNonce) {
      console.error('Nonce mismatch! Expected:', currentNonce.toString(), 'Got:', forwardRequest.nonce);
      return NextResponse.json(
        { error: 'Nonce mismatch', expected: currentNonce.toString(), received: forwardRequest.nonce },
        { status: 400 }
      );
    }

    // Try to estimate gas first
    try {
      const gasEstimate = await forwarder.execute.estimateGas(forwardRequest, signature);
      console.log('Gas estimate:', gasEstimate.toString());
    } catch (gasError) {
      console.error('Gas estimation failed:', gasError);
    }

    // Execute the meta-transaction
    const tx = await forwarder.execute(forwardRequest, signature, {
      gasLimit: 3000000
    });

    console.log('Transaction sent:', tx.hash);

    // Wait for confirmation
    const receipt = await tx.wait();
   

    console.log('Transaction confirmed:', receipt.hash);

    // Unlock the user
    

    return NextResponse.json({
      success: true,
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber
    });

  } catch (error: unknown) {
    console.error('Error relaying transaction:', error);

    // Unlock the user in case of error
    if (userAddress) {
      userLocks.delete(userAddress);
      console.log('🔓 Unlocked user after error:', userAddress);
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        error: 'Failed to relay transaction',
        message: errorMessage
      },
      { status: 500 }
    );
  }
}
