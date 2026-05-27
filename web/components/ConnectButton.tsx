'use client';

import { useEthereum } from '@/lib/ethereum';

export default function ConnectButton() {
  const { connected, account, chainId, connect, disconnect, error } = useEthereum();

  if (connected && account) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-lg">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-sm text-green-700 font-mono font-medium">
            {account.slice(0, 6)}...{account.slice(-4)}
          </span>
          <span className="text-xs text-green-500 ml-0.5">(Chain: {chainId})</span>
        </div>
        <button
          onClick={disconnect}
          className="px-3 py-1.5 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {error && (
        <span className="text-sm text-red-600 bg-red-50 px-3 py-1.5 rounded-lg border border-red-200">
          {error}
        </span>
      )}
      <button
        onClick={connect}
        className="px-5 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm"
      >
        Connect MetaMask
      </button>
    </div>
  );
}
