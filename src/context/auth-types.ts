import type { Contract, ContractTransactionResponse, ContractTransactionReceipt } from 'ethers';
import type { User, Certificate } from '../types';

/**
 * Typed surface for `Certification.sol` used by the app.
 * Full ABI is loaded from compiled artifacts at runtime.
 */
export type ICertificationContract = Contract & {
  userRoles: (address: string) => Promise<bigint>;
  issueDocument: (
    documentId: string,
    recipient: string,
    documentHash: string,
    metadataURI: string,
    expirationDays: bigint | number
  ) => Promise<ContractTransactionResponse>;
  requestVerification: (documentId: string, verifier: string) => Promise<ContractTransactionResponse>;
  completeVerification: (
    requestId: string,
    isVerified: boolean,
    notes: string
  ) => Promise<ContractTransactionResponse>;
  getDocument: (documentId: string) => Promise<unknown>;
  getUserDocuments: (user: string) => Promise<bigint[]>;
  getInstitutionDocuments: (institution: string) => Promise<bigint[]>;
  getDocumentVerifications: (documentId: string) => Promise<bigint[]>;
  getVerificationRequest: (requestId: string) => Promise<{
    documentId: string;
    requester: string;
    verifier: string;
    isVerified: boolean;
    isRejected: boolean;
    verificationNotes: string;
    timestamp: bigint;
  }>;
  isDocumentValid: (documentId: string) => Promise<boolean>;
};

export type AuthContextValue = {
  currentUser: User | null;
  loading: boolean;
  error: string | null;
  isNetworkCorrect: boolean;
  /** False when `VITE_CONTRACT_ADDRESS` is missing — app still loads for /demo */
  isChainConfigured: boolean;
  contract: ICertificationContract | null;
  connectWallet: () => Promise<boolean>;
  logout: () => void;
  issueCertificate: (
    recipient: string,
    documentHash: string,
    metadataURI: string,
    expirationDays: number
  ) => Promise<ContractTransactionReceipt | null>;
  getCertificate: (documentHash: string, recipientAddress: string) => Promise<Certificate | null>;
  requestVerification: (
    documentHash: string,
    recipientAddress: string,
    verifierAddress: string
  ) => Promise<ContractTransactionReceipt | null>;
  completeVerification: (
    requestId: string,
    approved: boolean,
    notes: string
  ) => Promise<ContractTransactionReceipt | null>;
  fetchMyCertificates: () => Promise<Certificate[]>;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
};
