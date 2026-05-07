import React, { useState, useEffect, useLayoutEffect, useCallback, useRef, ReactNode } from 'react';
import type { MetaMaskInpageProvider } from '@metamask/providers';
import type { User, Certificate, NotificationData } from '../types';
import { AppContext } from './app-context';

type EthereumWindow = Window & { ethereum?: MetaMaskInpageProvider };

const AUTHORIZED_VERIFIERS = ['0x203C2945B811e748e669fac95584959718Fec9E0'];
const AUTHORIZED_INSTITUTIONS = ['0x481A100167E7AF51A556322F6Cf7aF63Ecb57603'];

type AppUserRole = 'user' | 'institution' | 'verifier';

function buildUser(address: string, role: AppUserRole): User {
  return {
    address,
    role,
    isInstitution: role === 'institution',
    isVerifier: role === 'verifier',
  };
}

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [isMetaMaskConnected, setIsMetaMaskConnected] = useState(false);

  const getUserRole = useCallback((address: string): AppUserRole => {
    if (AUTHORIZED_VERIFIERS.includes(address)) return 'verifier';
    if (AUTHORIZED_INSTITUTIONS.includes(address)) return 'institution';
    return 'user';
  }, []);

  const accountsChangedListenerRef = useRef<(accounts: string[]) => void>(() => {});

  const stableAccountsListener = useCallback((accounts: string[]) => {
    accountsChangedListenerRef.current(accounts);
  }, []);

  const disconnectMetaMask = useCallback(() => {
    const w = window as EthereumWindow;
    if (w.ethereum) {
      w.ethereum.removeListener('accountsChanged', stableAccountsListener);
    }
    sessionStorage.removeItem('metamask_connected');
    setUser(null);
    setIsMetaMaskConnected(false);
  }, [stableAccountsListener]);

  useLayoutEffect(() => {
    accountsChangedListenerRef.current = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnectMetaMask();
      } else {
        const newAddress = accounts[0];
        const newRole = getUserRole(newAddress);
        setUser(buildUser(newAddress, newRole));
      }
    };
  }, [disconnectMetaMask, getUserRole]);

  const connectMetaMask = async () => {
    const w = window as EthereumWindow;

    if (!w.ethereum) {
      alert('MetaMask is not installed. Please install MetaMask to continue.');
      return;
    }

    try {
      const accounts = await w.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts.length > 0) {
        const address = accounts[0];
        const role = getUserRole(address);

        setUser(buildUser(address, role));
        setIsMetaMaskConnected(true);

        sessionStorage.setItem('metamask_connected', 'true');
        w.ethereum.removeListener('accountsChanged', stableAccountsListener);
        w.ethereum.on('accountsChanged', stableAccountsListener);
      }
    } catch (error) {
      console.error('Failed to connect MetaMask:', error);
    }
  };

  const addCertificate = (cert: Certificate) => {
    setCertificates(prev => [cert, ...prev]);
  };

  const updateCertificate = (id: string, updates: Partial<Certificate>) => {
    setCertificates(prev =>
      prev.map(cert => cert.id === id ? { ...cert, ...updates } : cert)
    );
  };

  const addNotification = (notification: NotificationData) => {
    setNotifications(prev => [notification, ...prev]);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  const isAuthorizedVerifier = (address: string) => AUTHORIZED_VERIFIERS.includes(address);

  const isAuthorizedInstitution = (address: string) => AUTHORIZED_INSTITUTIONS.includes(address);

  useEffect(() => {
    const w = window as EthereumWindow;
    if (!w.ethereum) return;
    w.ethereum.request({ method: 'eth_accounts' })
      .then((accounts: string[]) => {
        if (accounts.length > 0) {
          const address = accounts[0];
          const role = getUserRole(address);
          setUser(buildUser(address, role));
          setIsMetaMaskConnected(true);

          w.ethereum!.removeListener('accountsChanged', stableAccountsListener);
          w.ethereum!.on('accountsChanged', stableAccountsListener);
        }
      });
  }, [getUserRole, stableAccountsListener]);

  return (
    <AppContext.Provider value={{
      user,
      certificates,
      notifications,
      isMetaMaskConnected,
      connectMetaMask,
      disconnectMetaMask,
      addCertificate,
      updateCertificate,
      addNotification,
      removeNotification,
      isAuthorizedVerifier,
      isAuthorizedInstitution,
    }}>
      {children}
    </AppContext.Provider>
  );
};
