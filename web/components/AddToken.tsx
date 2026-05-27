'use client';

import { useState, useEffect, useCallback } from 'react';
import { useEthereum } from '@/lib/ethereum';
import LoadingSpinner from './LoadingSpinner';
import { showToast } from './Toast';

export default function AddToken() {
  const { connected, account, escrowContract } = useEthereum();
  const [isOwner, setIsOwner] = useState(false);
  const [tokenAddress, setTokenAddress] = useState('');
  const [allowedTokens, setAllowedTokens] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  const fetchAllowedTokens = useCallback(async () => {
    if (!escrowContract) return;
    try {
      const tokens: string[] = await escrowContract.getAllowedTokens();
      setAllowedTokens(tokens);
    } catch {
      // silently fail
    }
  }, [escrowContract]);

  const checkOwner = useCallback(async () => {
    if (!escrowContract || !account) {
      setIsOwner(false);
      setChecking(false);
      return;
    }
    try {
      const ownerAddr: string = await escrowContract.owner();
      setIsOwner(ownerAddr.toLowerCase() === account.toLowerCase());
    } catch {
      setIsOwner(false);
    }
    setChecking(false);
  }, [escrowContract, account]);

  useEffect(() => {
    checkOwner();
    fetchAllowedTokens();
  }, [checkOwner, fetchAllowedTokens]);

  const isValidAddress = (addr: string): boolean =>
    /^0x[a-fA-F0-9]{40}$/.test(addr);

  const handleAddToken = async () => {
    if (!escrowContract || !isValidAddress(tokenAddress)) return;
    setLoading(true);
    try {
      const tx = await escrowContract.addToken(tokenAddress);
      await tx.wait();
      showToast('success', 'Token added successfully');
      setTokenAddress('');
      await fetchAllowedTokens();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to add token';
      showToast('error', msg);
    }
    setLoading(false);
  };

  if (!connected || checking) return null;
  if (!isOwner) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
      {/* Instrucción: Solo visible para el owner */}
      <div className="text-xs text-gray-500 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 mb-4">
        💡 <strong>Owner:</strong> Ingresa la dirección de un token ERC20 para autorizarlo en el Escrow.
        Solo los tokens en esta lista pueden usarse en swaps. Esta sección es <strong>solo visible para el owner</strong> del contrato.
      </div>
      <h3 className="font-semibold text-gray-900 mb-3">Add Token (Owner Only)</h3>

      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={tokenAddress}
          onChange={(e) => setTokenAddress(e.target.value)}
          placeholder="0x..."
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
        <button
          onClick={handleAddToken}
          disabled={loading || !isValidAddress(tokenAddress)}
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-lg transition-colors"
        >
          {loading ? <LoadingSpinner size="sm" /> : 'Add Token'}
        </button>
      </div>

      {allowedTokens.length > 0 && (
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
            Allowed Tokens ({allowedTokens.length})
          </p>
          <div className="space-y-1">
            {allowedTokens.map((addr, i) => (
              <div
                key={i}
                className="flex items-center gap-2 text-sm text-gray-600 font-mono bg-gray-50 px-3 py-1.5 rounded"
              >
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                {addr.slice(0, 8)}...{addr.slice(-6)}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
