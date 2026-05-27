'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { BrowserProvider, Contract, Signer } from 'ethers';
import {
  ESCROW_ADDRESS,
  TOKEN_A_ADDRESS,
  TOKEN_B_ADDRESS,
  ESCROW_ABI,
  ERC20_ABI,
} from './contracts';

export interface EthereumContextType {
  connected: boolean;
  account: string | null;
  provider: BrowserProvider | null;
  signer: Signer | null;
  chainId: number | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  escrowContract: Contract | null;
  tokenAContract: Contract | null;
  tokenBContract: Contract | null;
  error: string | null;
}

const EthereumContext = createContext<EthereumContextType | undefined>(undefined);

export function EthereumProvider({ children }: { children: React.ReactNode }) {
  const [connected, setConnected] = useState(false);
  const [account, setAccount] = useState<string | null>(null);
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [signer, setSigner] = useState<Signer | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const connect = async () => {
    try {
      // Check if MetaMask is installed
      const injectedProvider = (window as unknown as { ethereum?: Record<string, unknown> }).ethereum;
      if (!injectedProvider) {
        throw new Error('MetaMask not installed. Please install MetaMask to connect.');
      }

      // Request accounts from MetaMask
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const provider = new BrowserProvider(injectedProvider as any);
      const accounts = await provider.send('eth_requestAccounts', []);

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts available');
      }

      // Get signer and network information
      const signer = await provider.getSigner();
      const network = await provider.getNetwork();

      setProvider(provider);
      setAccount(accounts[0]);
      setSigner(signer);
      setChainId(Number(network.chainId));
      setConnected(true);
      setError(null);

      console.log('✅ Connected to MetaMask:', accounts[0]);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Connection failed';
      console.error('❌ Connection error:', errorMessage);
      setError(errorMessage);
      setConnected(false);
      setAccount(null);
    }
  };

  const disconnect = () => {
    setConnected(false);
    setAccount(null);
    setProvider(null);
    setSigner(null);
    setChainId(null);
    setError(null);
    console.log('🔌 Disconnected from MetaMask');
  };

  // Auto-connect on page load if previously connected
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as unknown as { ethereum?: unknown }).ethereum) {
      // Check if user has previously connected
      const previouslyConnected = localStorage.getItem('escrow-wallet-connected');
      if (previouslyConnected === 'true') {
        connect();
      }
    }
  }, []);

  // Save connection state to localStorage
  useEffect(() => {
    if (connected) {
      localStorage.setItem('escrow-wallet-connected', 'true');
    } else {
      localStorage.removeItem('escrow-wallet-connected');
    }
  }, [connected]);

  // ─────────────────────────────────────────────────────────────────────────
  // Escuchar eventos de MetaMask: cambio de cuenta (accountsChanged)
  // ─────────────────────────────────────────────────────────────────────────
  // Cuando el usuario cambia de cuenta en MetaMask, la DApp debe:
  //   1. Detectar el nuevo account
  //   2. Recrear el provider + signer con la nueva cuenta
  //   3. Actualizar el chainId (por si la nueva cuenta está en otra red)
  //
  // Edge case: si accounts[] está vacío, el usuario desconectó todo desde MetaMask
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const injected = (window as unknown as { ethereum?: Record<string, unknown> }).ethereum;
    if (!injected) return;

    const handleAccountsChanged = async (accounts: unknown) => {
      const accs = accounts as string[];
      console.log('🔄 MetaMask accountsChanged:', accs);

      if (accs.length === 0) {
        // El usuario desconectó todas las cuentas desde MetaMask
        setConnected(false);
        setAccount(null);
        setProvider(null);
        setSigner(null);
        setChainId(null);
        setError(null);
        localStorage.removeItem('escrow-wallet-connected');
        return;
      }

      const newAccount = accs[0];

      // Evitar reaccionar si es la misma cuenta (case-insensitive)
      // Nota: usamos una ref para evitar closure stale con el state actual
      // eslint-disable-next-line react-hooks/exhaustive-deps
      try {
        const newProvider = new BrowserProvider(injected as any);
        const newSigner = await newProvider.getSigner();
        const network = await newProvider.getNetwork();

        setProvider(newProvider);
        setSigner(newSigner);
        setAccount(newAccount);
        setChainId(Number(network.chainId));
        setConnected(true);
        setError(null);
        localStorage.setItem('escrow-wallet-connected', 'true');
        console.log('✅ Account updated to:', newAccount);
      } catch (err) {
        console.error('❌ Error updating account after MetaMask change:', err);
      }
    };

    (injected as any).on('accountsChanged', handleAccountsChanged);
    return () => {
      (injected as any).removeListener('accountsChanged', handleAccountsChanged);
    };
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // Escuchar eventos de MetaMask: cambio de red (chainChanged)
  // ─────────────────────────────────────────────────────────────────────────
  // MetaMask recomienda RECARGAR LA PÁGINA al cambiar de red:
  //   "We recommend reloading the page on chain change unless you have
  //    a very good reason not to"
  //
  // Esto es lo más seguro porque:
  //   - El provider/signer quedan inválidos al cambiar de red
  //   - Las direcciones de contrato en .env.local son específicas de Anvil
  //   - La recarga garantiza que todo el estado se refresque correctamente
  //
  // Sin recarga, las transacciones se enviarían a la red incorrecta y
  // los contratos no existirían allí (causando errores confusos).
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const injected = (window as unknown as { ethereum?: Record<string, unknown> }).ethereum;
    if (!injected) return;

    const handleChainChanged = () => {
      console.log('🔄 MetaMask chainChanged — reloading page');
      window.location.reload();
    };

    (injected as any).on('chainChanged', handleChainChanged);
    return () => {
      (injected as any).removeListener('chainChanged', handleChainChanged);
    };
  }, []);

  // Instantiate contract objects
  const escrowContract =
    signer && ESCROW_ADDRESS ? new Contract(ESCROW_ADDRESS, ESCROW_ABI, signer) : null;
  const tokenAContract =
    signer && TOKEN_A_ADDRESS ? new Contract(TOKEN_A_ADDRESS, ERC20_ABI, signer) : null;
  const tokenBContract =
    signer && TOKEN_B_ADDRESS ? new Contract(TOKEN_B_ADDRESS, ERC20_ABI, signer) : null;

  const value: EthereumContextType = {
    connected,
    account,
    provider,
    signer,
    chainId,
    connect,
    disconnect,
    escrowContract,
    tokenAContract,
    tokenBContract,
    error,
  };

  return (
    <EthereumContext.Provider value={value}>
      {children}
    </EthereumContext.Provider>
  );
}

export function useEthereum(): EthereumContextType {
  const context = useContext(EthereumContext);
  if (context === undefined) {
    throw new Error('useEthereum must be used within an EthereumProvider');
  }
  return context;
}
