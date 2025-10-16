import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { getProposalCount, canExecuteProposal, executeProposalDirect } from '@/lib/daoHelpers';

const RELAYER_PRIVATE_KEY = process.env.RELAYER_PRIVATE_KEY || '';
const RPC_URL = process.env.RPC_URL || 'http://127.0.0.1:8545';

/**
 * Daemon endpoint to check and execute approved proposals
 * This should be called periodically (e.g., via cron job or interval)
 */
export async function GET(request: NextRequest) {
  try {
    if (!RELAYER_PRIVATE_KEY) {
      return NextResponse.json(
        { error: 'Daemon not configured: RELAYER_PRIVATE_KEY missing' },
        { status: 500 }
      );
    }

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const relayer = new ethers.Wallet(RELAYER_PRIVATE_KEY, provider);

    console.log('[Daemon] Checking for executable proposals...');

    const proposalCount = await getProposalCount(provider);
    const executed: number[] = [];
    const errors: { id: number; error: string }[] = [];

    // Check all proposals
    for (let i = 1; i <= proposalCount; i++) {
      try {
        const canExecute = await canExecuteProposal(provider, i);

        if (canExecute) {
          console.log(`[Daemon] Executing proposal #${i}...`);

          await executeProposalDirect(relayer, i);
          console.log(`[Daemon] Proposal #${i} executed successfully`);

          executed.push(i);
        }
      } catch (error: any) {
        console.error(`[Daemon] Error executing proposal #${i}:`, error);
        errors.push({
          id: i,
          error: error.message || 'Unknown error'
        });
      }
    }

    return NextResponse.json({
      success: true,
      checked: Number(proposalCount),
      executed,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('[Daemon] Error:', error);
    return NextResponse.json(
      {
        error: 'Daemon execution failed',
        message: error.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
}
