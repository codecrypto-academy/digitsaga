'use client';

import { useState, useEffect, useCallback } from 'react';
import { Contract, ethers, Signer } from 'ethers';
import { useEthereum } from '@/lib/ethereum';
import { ERC20_ABI, TOKEN_A_ADDRESS, TOKEN_B_ADDRESS } from '@/lib/contracts';

function formatAmount(amount: bigint): string {
  const formatted = ethers.formatUnits(amount, 18);
  const parts = formatted.split('.');
  if (parts.length === 2 && parts[1].length > 4) {
    return `${parts[0]}.${parts[1].slice(0, 4)}`;
  }
  return formatted;
}

async function getTokenSymbol(
  signer: Signer | null,
  address: string
): Promise<string> {
  if (!signer || !address || address === '0x0000000000000000000000000000000000000000') return '—';
  try {
    const tc = new Contract(address, ERC20_ABI, signer);
    return await tc.symbol();
  } catch {
    return address.slice(0, 6) + '...';
  }
}

export default function BalanceDebug() {
  const { connected, account, signer, escrowContract } = useEthereum();
  const [tokenASymbol, setTokenASymbol] = useState('TKA');
  const [tokenBSymbol, setTokenBSymbol] = useState('TKB');
  const [userBalanceA, setUserBalanceA] = useState<bigint>(0n);
  const [userBalanceB, setUserBalanceB] = useState<bigint>(0n);
  const [contractBalanceA, setContractBalanceA] = useState<bigint>(0n);
  const [contractBalanceB, setContractBalanceB] = useState<bigint>(0n);
  const [operationCount, setOperationCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  const fetchBalances = useCallback(async () => {
    if (!escrowContract || !account || !signer) return;
    setLoading(true);
    try {
      const tokenAContract = new Contract(TOKEN_A_ADDRESS, ERC20_ABI, signer);
      const tokenBContract = new Contract(TOKEN_B_ADDRESS, ERC20_ABI, signer);

      const [ubA, ubB, cbA, cbB, count, symA, symB] = await Promise.all([
        tokenAContract.balanceOf(account),
        tokenBContract.balanceOf(account),
        escrowContract.getContractBalance(TOKEN_A_ADDRESS),
        escrowContract.getContractBalance(TOKEN_B_ADDRESS),
        escrowContract.operationCount(),
        getTokenSymbol(signer, TOKEN_A_ADDRESS),
        getTokenSymbol(signer, TOKEN_B_ADDRESS),
      ]);

      setUserBalanceA(ubA as bigint);
      setUserBalanceB(ubB as bigint);
      setContractBalanceA(cbA as bigint);
      setContractBalanceB(cbB as bigint);
      setOperationCount(Number(count));
      setTokenASymbol(symA);
      setTokenBSymbol(symB);
    } catch {
      // silently fail
    }
    setLoading(false);
  }, [escrowContract, account, signer]);

  useEffect(() => {
    fetchBalances();
  }, [fetchBalances]);

  if (!connected) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
      {/* Instrucción: Panel de depuración */}
      <div className="text-xs text-gray-500 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 mb-4">
        💡 <strong>Debug panel:</strong> Monitor token balances and contract state.
        • <strong>Your Balances</strong> — Tokens in your connected wallet.
        • <strong>Contract Balances</strong> — Tokens held by the Escrow contract (locked in active swaps).
        • <strong>Total Operations</strong> — Number of swap operations created since deployment.
        Click <strong>Refresh</strong> to update.
      </div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Debug Panel</h3>
        <button
          onClick={fetchBalances}
          disabled={loading}
          className="px-3 py-1 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors"
        >
          {loading ? '...' : 'Refresh'}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
          <p className="text-xs font-medium text-blue-600 uppercase tracking-wider mb-1">
            Your Balances
          </p>
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">{tokenASymbol}:</span>
              <span className="font-mono font-medium text-gray-900">
                {formatAmount(userBalanceA)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">{tokenBSymbol}:</span>
              <span className="font-mono font-medium text-gray-900">
                {formatAmount(userBalanceB)}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-amber-50 rounded-lg p-4 border border-amber-100">
          <p className="text-xs font-medium text-amber-600 uppercase tracking-wider mb-1">
            Contract Balances
          </p>
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">{tokenASymbol}:</span>
              <span className="font-mono font-medium text-gray-900">
                {formatAmount(contractBalanceA)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">{tokenBSymbol}:</span>
              <span className="font-mono font-medium text-gray-900">
                {formatAmount(contractBalanceB)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm bg-gray-50 rounded-lg px-4 py-3 border border-gray-100">
        <span className="text-gray-600 font-medium">Total Operations</span>
        <span className="font-mono font-bold text-indigo-600 text-lg">
          {operationCount}
        </span>
      </div>
    </div>
  );
}
