import React, { useCallback, useEffect, useState } from 'react';
import { UserRole, CertificationContract } from '../types/contracts';
import { initContract, getCurrentAccount, getCurrentUserRole, checkNetwork, switchNetwork } from '../utils/contractUtils';
import { ContractContext } from './contract-context';

const REQUIRED_CHAIN_ID = 31337;

export const ContractProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [contract, setContract] = useState<CertificationContract | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshAccount = useCallback(async () => {
    if (!contract) return;

    try {
      const currentAccount = await getCurrentAccount();
      const userRole = await getCurrentUserRole();

      setAccount(currentAccount);
      setRole(userRole);
    } catch (err) {
      console.error('Error refreshing account:', err);
      setError('Failed to refresh account information');
    }
  }, [contract]);

  const handleAccountsChanged = useCallback((accounts: string[]) => {
    if (accounts.length === 0) {
      setAccount(null);
      setRole(UserRole.NONE);
    } else if (account !== accounts[0]) {
      setAccount(accounts[0]);
      void refreshAccount();
    }
  }, [account, refreshAccount]);

  const handleChainChanged = useCallback(() => {
    window.location.reload();
  }, []);

  const initialize = useCallback(async () => {
    if (isInitialized || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      if (typeof window.ethereum === 'undefined') {
        throw new Error('Please install MetaMask to use this application');
      }

      const contractInstance = await initContract();
      setContract(contractInstance);

      const currentAccount = await getCurrentAccount();
      setAccount(currentAccount);

      const userRole = await getCurrentUserRole();
      setRole(userRole);

      setIsInitialized(true);
    } catch (err: unknown) {
      console.error('Error initializing contract:', err);
      setError(err instanceof Error ? err.message : 'Failed to initialize contract');
    } finally {
      setIsLoading(false);
    }
  }, [isInitialized, isLoading]);

  const connectWallet = useCallback(async () => {
    if (typeof window.ethereum === 'undefined') {
      setError('Please install MetaMask');
      return;
    }
    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      await initialize();
    } catch (err: unknown) {
      console.error('Error connecting wallet:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect wallet');
    }
  }, [initialize]);

  useEffect(() => {
    const checkNetworkConnection = async () => {
      if (!contract) return;

      try {
        const isCorrectNetwork = await checkNetwork(REQUIRED_CHAIN_ID);
        if (!isCorrectNetwork) {
          await switchNetwork(REQUIRED_CHAIN_ID);
        }
      } catch (err: unknown) {
        console.error('Network error:', err);
        setError(`Please switch to the required network (Chain ID: ${REQUIRED_CHAIN_ID})`);
      }
    };

    void checkNetworkConnection();
  }, [contract, account]);

  useEffect(() => {
    if (!isInitialized || typeof window.ethereum === 'undefined') return;

    const eth = window.ethereum;
    eth.on('accountsChanged', handleAccountsChanged);
    eth.on('chainChanged', handleChainChanged);

    return () => {
      eth.removeListener('accountsChanged', handleAccountsChanged);
      eth.removeListener('chainChanged', handleChainChanged);
    };
  }, [isInitialized, handleAccountsChanged, handleChainChanged]);

  return (
    <ContractContext.Provider
      value={{
        contract,
        account,
        role,
        isInitialized,
        isLoading,
        error,
        connectWallet,
        refreshAccount,
        requiredChainId: REQUIRED_CHAIN_ID,
      }}
    >
      {children}
    </ContractContext.Provider>
  );
};
