import { createContext } from 'react';
import type { User, Certificate, NotificationData } from '../types';

export type AppContextType = {
  user: User | null;
  certificates: Certificate[];
  notifications: NotificationData[];
  isMetaMaskConnected: boolean;
  connectMetaMask: () => Promise<void>;
  disconnectMetaMask: () => void;
  addCertificate: (cert: Certificate) => void;
  updateCertificate: (id: string, updates: Partial<Certificate>) => void;
  addNotification: (notification: NotificationData) => void;
  removeNotification: (id: string) => void;
  isAuthorizedVerifier: (address: string) => boolean;
  isAuthorizedInstitution: (address: string) => boolean;
};

export const AppContext = createContext<AppContextType | undefined>(undefined);
