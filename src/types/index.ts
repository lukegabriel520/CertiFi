import type { ContractTransactionReceipt } from 'ethers';

export interface User {
  address: string;
  isInstitution: boolean;
  isVerifier: boolean;
  role: 'user' | 'institution' | 'verifier';
}

export interface Certificate {
  issuer: string;
  fileName: string;
  isVerified: boolean;
  isRevoked: boolean;
  verificationNotes: string;
}

export interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  connectWallet: () => Promise<void>;
  logout: () => void;
  issueCertificate: (documentHash: string, documentName: string) => Promise<ContractTransactionReceipt | null>;
  getCertificate: (documentHash: string) => Promise<Certificate | null>;
  verifyDocument: (documentHash: string, notes: string) => Promise<ContractTransactionReceipt | null>;
}
