import { createContext } from 'react';
import type { UserRole, CertificationContract } from '../types/contracts';

export type ContractContextValue = {
  contract: CertificationContract | null;
  account: string | null;
  role: UserRole | null;
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  connectWallet: () => Promise<void>;
  refreshAccount: () => Promise<void>;
  requiredChainId: number;
};

export const ContractContext = createContext<ContractContextValue | undefined>(undefined);
