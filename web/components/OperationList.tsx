'use client';

import { useState, useEffect, useCallback } from 'react';
import { Contract, ethers } from 'ethers';
import { useEthereum } from '@/lib/ethereum';
import { ERC20_ABI } from '@/lib/contracts';
import LoadingSpinner from './LoadingSpinner';
import { showToast } from './Toast';

interface OperationData {
  id: bigint;
  creator: string;
  tokenA: string;
  tokenB: string;
  amountA: bigint;
  amountB: bigint;
  status: bigint;
}

const STATUS_MAP = ['PENDING', 'COMPLETED', 'CANCELLED'] as const;
const STATUS_COLORS = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-gray-100 text-gray-500',
} as const;

function formatAmount(amount: bigint): string {
  return ethers.formatUnits(amount, 18);
}

function shortenAddress(addr: string): string {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

async function getTokenSymbol(contract: Contract, address: string): Promise<string> {
  try {
    const tc = new Contract(address, ERC20_ABI, contract.runner || undefined);
    return await tc.symbol();
  } catch {
    return address.slice(0, 6) + '...';
  }
}

export default function OperationList() {
  const { connected, account, signer, escrowContract } = useEthereum();
  const [operations, setOperations] = useState<OperationData[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [symbolCache, setSymbolCache] = useState<Record<string, string>>({});
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;

  const fetchOperations = useCallback(async () => {
    if (!escrowContract) return;
    setLoading(true);
    try {
      const ops: OperationData[] = await escrowContract.getAllOperations();
      setOperations(ops);
    } catch {
      // silently fail
    }
    setLoading(false);
  }, [escrowContract]);

  // Fetch symbols for token addresses
  useEffect(() => {
    if (!escrowContract || operations.length === 0) return;
    const tokens = new Set<string>();
    operations.forEach((op) => {
      tokens.add(op.tokenA);
      tokens.add(op.tokenB);
    });
    tokens.forEach(async (addr) => {
      if (!symbolCache[addr]) {
        const sym = await getTokenSymbol(escrowContract, addr);
        setSymbolCache((prev) => ({ ...prev, [addr]: sym }));
      }
    });
  }, [escrowContract, operations, symbolCache]);

  // Auto-refresh every 5 seconds
  useEffect(() => {
    if (!connected) return;
    fetchOperations();
    const interval = setInterval(fetchOperations, 5000);
    return () => clearInterval(interval);
  }, [connected, fetchOperations]);

  const handleComplete = async (opId: bigint) => {
    if (!escrowContract || !signer) return;
    setActionLoading(Number(opId));
    try {
      // Approve tokenB first
      const op = operations.find((o) => o.id === opId);
      if (!op) return;

      const tokenBContract = new Contract(op.tokenB, ERC20_ABI, signer);
      const txApprove = await tokenBContract.approve(escrowContract.target, op.amountB);
      await txApprove.wait();

      const tx = await escrowContract.completeOperation(opId);
      await tx.wait();
      showToast('success', `Operation #${opId} completed`);
      await fetchOperations();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to complete operation';
      showToast('error', msg);
    }
    setActionLoading(null);
  };

  const handleCancel = async (opId: bigint) => {
    if (!escrowContract) return;
    setActionLoading(Number(opId));
    try {
      const tx = await escrowContract.cancelOperation(opId);
      await tx.wait();
      showToast('success', `Operation #${opId} cancelled`);
      await fetchOperations();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to cancel operation';
      showToast('error', msg);
    }
    setActionLoading(null);
  };

  if (!connected) return null;

  // Filter
  const filtered = operations.filter(
    (op) => statusFilter === 'ALL' || STATUS_MAP[Number(op.status)] === statusFilter
  );

  // Paginate
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
      {/* Instrucción: Explorar operaciones */}
      <div className="text-xs text-gray-500 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 mb-4">
        💡 <strong>Browse operations:</strong> View all swap operations. Use the filter to see PENDING, COMPLETED, or CANCELLED.
        • <strong>Complete</strong> a PENDING swap (you must be a different user) — you send Token B, receive Token A.
        • <strong>Cancel</strong> your own PENDING operation to get your tokens back.
        Auto-refreshes every 5 seconds.
      </div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Operations</h3>
        <div className="flex items-center gap-3">
          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(0);
            }}
            className="px-2 py-1 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
          >
            <option value="ALL">All</option>
            <option value="PENDING">Pending</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <button
            onClick={fetchOperations}
            disabled={loading}
            className="px-3 py-1 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors"
          >
            {loading ? '...' : 'Refresh'}
          </button>
        </div>
      </div>

      {loading && operations.length === 0 ? (
        <div className="py-8">
          <LoadingSpinner message="Loading operations..." />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-8 text-gray-500 text-sm">
          {operations.length === 0
            ? 'No operations yet. Create one to get started.'
            : 'No operations match the selected filter.'}
        </div>
      ) : (
        <>
          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-xs text-gray-500 uppercase tracking-wider">
                  <th className="pb-2 pr-3">ID</th>
                  <th className="pb-2 pr-3">Creator</th>
                  <th className="pb-2 pr-3">Give</th>
                  <th className="pb-2 pr-3">Receive</th>
                  <th className="pb-2 pr-3">Status</th>
                  <th className="pb-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((op) => {
                  const statusLabel = STATUS_MAP[Number(op.status)];
                  const statusColor = STATUS_COLORS[statusLabel];
                  const isCreator =
                    account && op.creator.toLowerCase() === account.toLowerCase();
                  const isPending = op.status === 0n;

                  return (
                    <tr key={op.id.toString()} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 pr-3 font-mono text-gray-900">
                        #{op.id.toString()}
                      </td>
                      <td className="py-3 pr-3 font-mono text-gray-600">
                        {shortenAddress(op.creator)}
                      </td>
                      <td className="py-3 pr-3">
                        <div className="font-mono text-gray-900">
                          {formatAmount(op.amountA)} {symbolCache[op.tokenA] || '...'}
                        </div>
                      </td>
                      <td className="py-3 pr-3">
                        <div className="font-mono text-gray-900">
                          {formatAmount(op.amountB)} {symbolCache[op.tokenB] || '...'}
                        </div>
                      </td>
                      <td className="py-3 pr-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusColor}`}
                        >
                          {statusLabel}
                        </span>
                      </td>
                      <td className="py-3">
                        {isPending && (
                          <div className="flex gap-2">
                            {isCreator ? (
                              <button
                                onClick={() => handleCancel(op.id)}
                                disabled={actionLoading === Number(op.id)}
                                className="px-3 py-1 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 disabled:opacity-50 rounded-md transition-colors"
                              >
                                {actionLoading === Number(op.id) ? (
                                  <LoadingSpinner size="sm" />
                                ) : (
                                  'Cancel'
                                )}
                              </button>
                            ) : (
                              <button
                                onClick={() => handleComplete(op.id)}
                                disabled={actionLoading === Number(op.id)}
                                className="px-3 py-1 text-xs font-medium text-green-600 bg-green-50 hover:bg-green-100 disabled:opacity-50 rounded-md transition-colors"
                              >
                                {actionLoading === Number(op.id) ? (
                                  <LoadingSpinner size="sm" />
                                ) : (
                                  'Complete'
                                )}
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
              <span className="text-xs text-gray-500">
                Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of{' '}
                {filtered.length}
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="px-3 py-1 text-xs border border-gray-300 rounded-md disabled:opacity-40 hover:bg-gray-50"
                >
                  Prev
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="px-3 py-1 text-xs border border-gray-300 rounded-md disabled:opacity-40 hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
