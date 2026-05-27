'use client';

import { useState, useEffect, useCallback } from 'react';
import { Contract, ethers } from 'ethers';
import { useEthereum } from '@/lib/ethereum';
import { ERC20_ABI } from '@/lib/contracts';
import LoadingSpinner from './LoadingSpinner';
import { showToast } from './Toast';

interface TokenOption {
  address: string;
  symbol: string;
}

export default function CreateOperation() {
  const { connected, account, signer, escrowContract } = useEthereum();
  const [tokens, setTokens] = useState<TokenOption[]>([]);
  const [tokenA, setTokenA] = useState('');
  const [tokenB, setTokenB] = useState('');
  const [amountA, setAmountA] = useState('');
  const [amountB, setAmountB] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');

  const fetchTokens = useCallback(async () => {
    if (!escrowContract) return;
    try {
      const addresses: string[] = await escrowContract.getAllowedTokens();
      const tokenList: TokenOption[] = [];
      for (const addr of addresses) {
        let symbol = addr.slice(0, 6) + '...';
        try {
          const tc = new Contract(addr, ERC20_ABI, signer || undefined);
          symbol = await tc.symbol();
        } catch {
          // fallback to truncated address
        }
        tokenList.push({ address: addr, symbol });
      }
      setTokens(tokenList);
      if (tokenList.length > 0) {
        if (!tokenA) setTokenA(tokenList[0].address);
        if (!tokenB && tokenList.length > 1) setTokenB(tokenList[1].address);
      }
    } catch {
      // silently fail
    }
  }, [escrowContract, signer, tokenA, tokenB]);

  useEffect(() => {
    fetchTokens();
  }, [fetchTokens]);

  const isValidAmount = (val: string): boolean =>
    val !== '' && !isNaN(Number(val)) && Number(val) > 0;

  const canSubmit =
    connected &&
    tokenA &&
    tokenB &&
    tokenA !== tokenB &&
    isValidAmount(amountA) &&
    isValidAmount(amountB) &&
    !loading;

  const handleCreate = async () => {
    if (!escrowContract || !account || !canSubmit) return;

    setLoading(true);
    try {
      const parsedA = ethers.parseUnits(amountA, 18);
      const parsedB = ethers.parseUnits(amountB, 18);

      // Check allowance
      setLoadingMsg('Checking allowance...');
      const tokenAContract = new Contract(tokenA, ERC20_ABI, signer || undefined);
      const allowance: bigint = await tokenAContract.allowance(account, escrowContract.target);

      if (allowance < parsedA) {
        setLoadingMsg('Approving token transfer...');
        const approveTx = await tokenAContract.approve(escrowContract.target, parsedA);
        await approveTx.wait();
        showToast('info', 'Token approved');
      }

      // Create operation
      setLoadingMsg('Creating operation...');
      const tx = await escrowContract.createOperation(tokenA, tokenB, parsedA, parsedB);
      const receipt = await tx.wait();

      // Extract operation ID from event
      const event = receipt.logs.find(
        (log: { topics: string[] }) =>
          log.topics[0] === escrowContract.interface.getEvent('OperationCreated')?.topicHash
      );
      const opId = event ? Number(event.topics[1]) : '?';

      showToast('success', `Operation #${opId} created successfully`);
      setAmountA('');
      setAmountB('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create operation';
      showToast('error', msg);
    }
    setLoading(false);
    setLoadingMsg('');
  };

  if (!connected) return null;

  const TokenSelect = ({
    value,
    onChange,
    label,
  }: {
    value: string;
    onChange: (v: string) => void;
    label: string;
  }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
      >
        <option value="" disabled>
          Select token...
        </option>
        {tokens.map((t) => (
          <option key={t.address} value={t.address}>
            {t.symbol} ({t.address.slice(0, 6)}...)
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
      {/* Instrucción: Crear operación de swap */}
      <div className="text-xs text-gray-500 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 mb-4">
        💡 <strong>Create a swap:</strong> Select the token you want to give (Token A), the token you want to receive (Token B),
        and the amounts. First time? You'll need to <strong>approve</strong> the token (MetaMask will prompt you).
        Anyone can create a swap — another user must complete it.
      </div>
      <h3 className="font-semibold text-gray-900 mb-4">Create Swap Operation</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <TokenSelect value={tokenA} onChange={setTokenA} label="You give (Token A)" />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Amount A</label>
          <input
            type="number"
            value={amountA}
            onChange={(e) => setAmountA(e.target.value)}
            placeholder="0.0"
            min="0"
            step="any"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <TokenSelect value={tokenB} onChange={setTokenB} label="You receive (Token B)" />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Amount B</label>
          <input
            type="number"
            value={amountB}
            onChange={(e) => setAmountB(e.target.value)}
            placeholder="0.0"
            min="0"
            step="any"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {tokenA && tokenB && tokenA === tokenB && (
        <p className="text-sm text-amber-600 mb-3">Tokens must be different</p>
      )}

      <button
        onClick={handleCreate}
        disabled={!canSubmit}
        className="w-full py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <LoadingSpinner size="sm" />
            <span>{loadingMsg}</span>
          </>
        ) : (
          'Create Operation'
        )}
      </button>
    </div>
  );
}


