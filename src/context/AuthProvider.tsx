import { useState, useEffect, useCallback, ReactNode } from 'react';
import { ethers, BrowserProvider, JsonRpcSigner } from 'ethers';
import type { User, Certificate } from '../types';
import type { ICertificationContract, AuthContextValue } from './auth-types';
import { AuthContext } from './auth-context';
import CertificationArtifact from '../../artifacts/contracts/Certification.sol/Certification.json';
import { computeDocumentId, normalizeDocumentHash } from '../utils/documentId';
import {
  enrichCertificateFromChain,
  findPendingRequestForVerifier,
  rowToOnChainDocument,
  asDocumentIdHex,
} from '../utils/certificationBridge';

const CONTRACT_ADDRESS = (import.meta.env.VITE_CONTRACT_ADDRESS ?? '').trim();
const DEFAULT_CHAIN_ID = import.meta.env.VITE_DEFAULT_CHAIN_ID || '11155111';
const IS_CHAIN_CONFIGURED = Boolean(CONTRACT_ADDRESS);

if (!IS_CHAIN_CONFIGURED) {
  console.warn(
    'VITE_CONTRACT_ADDRESS is not set — wallet features are disabled. Use /demo for wallet-free sample verification.'
  );
}

type AuthProviderProps = {
  children: ReactNode;
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isNetworkCorrect, setIsNetworkCorrect] = useState(false);
  const [loading, setLoading] = useState(true);
  const [contract, setContract] = useState<ICertificationContract | null>(null);
  const [, setProvider] = useState<BrowserProvider | null>(null);

  const checkIfSepolia = useCallback(async (provider: BrowserProvider): Promise<boolean> => {
    try {
      const network = await provider.getNetwork();
      return network.chainId === BigInt(parseInt(DEFAULT_CHAIN_ID, 10));
    } catch (err) {
      console.error('Error checking network:', err);
      return false;
    }
  }, []);

  const initContract = useCallback(async (signer: JsonRpcSigner): Promise<ICertificationContract> => {
    if (!CONTRACT_ADDRESS) {
      throw new Error('Contract address not configured (set VITE_CONTRACT_ADDRESS).');
    }
    try {
      const contractInstance = new ethers.Contract(
        CONTRACT_ADDRESS,
        CertificationArtifact.abi,
        signer
      ) as unknown as ICertificationContract;

      await contractInstance.userRoles(await signer.getAddress());

      return contractInstance;
    } catch (error) {
      console.error('Error initializing contract:', error);
      throw new Error(
        'Failed to initialize contract. Make sure you are connected to the correct network and the contract address is correct.'
      );
    }
  }, []);

  const updateUserState = useCallback(
    async (address: string) => {
      if (!contract) return null;

      try {
        const roleRaw = await contract.userRoles(address);
        const n = Number(roleRaw);
        const isInstitution = n === 3;
        const isVerifier = n === 2;
        const role = isInstitution ? 'institution' : isVerifier ? 'verifier' : 'user';
        const user: User = { address: ethers.getAddress(address), isInstitution, isVerifier, role };
        setCurrentUser(user);
        return user;
      } catch (err) {
        console.error('Error updating user state:', err);
        setError('Failed to fetch user role');
        return null;
      }
    },
    [contract]
  );

  const connectWallet = useCallback(async (): Promise<boolean> => {
    if (!IS_CHAIN_CONFIGURED) {
      setError(
        'Live blockchain mode needs VITE_CONTRACT_ADDRESS. Try “Try demo” (/demo) to verify samples without a wallet.'
      );
      return false;
    }

    if (typeof window === 'undefined' || !window.ethereum) {
      setError('Please install MetaMask');
      return false;
    }

    try {
      setLoading(true);
      setError(null);

      const accounts = (await window.ethereum.request({
        method: 'eth_requestAccounts',
      })) as string[];

      if (!accounts || accounts.length === 0) {
        setError('No accounts found. Please unlock MetaMask and try again.');
        return false;
      }

      const web3Provider = new BrowserProvider(window.ethereum);
      const signer = await web3Provider.getSigner();

      const isSepolia = await checkIfSepolia(web3Provider);
      if (!isSepolia) {
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: `0x${parseInt(DEFAULT_CHAIN_ID, 10).toString(16)}` }],
          });
          window.location.reload();
          return true;
        } catch (switchError: unknown) {
          console.error('Failed to switch network:', switchError);
          setError('Please switch to the configured network for this app');
          return false;
        }
      }

      let contractInstance;
      try {
        contractInstance = await initContract(signer);
      } catch (err) {
        console.error('Contract initialization failed:', err);
        throw new Error(
          `Contract initialization failed: ${err instanceof Error ? err.message : 'Unknown error'}`
        );
      }

      setProvider(web3Provider);
      setContract(contractInstance);
      await updateUserState(accounts[0]);
      setIsNetworkCorrect(true);

      const handleAccountsChanged = (accts: string[]) => {
        if (accts.length === 0) {
          setCurrentUser(null);
          setContract(null);
        } else {
          void updateUserState(accts[0]);
        }
      };

      const handleChainChanged = () => {
        window.location.reload();
      };

      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum.removeListener('chainChanged', handleChainChanged);

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return true;
    } catch (err: unknown) {
      console.error('Error connecting wallet:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect wallet');
      return false;
    } finally {
      setLoading(false);
    }
  }, [checkIfSepolia, initContract, updateUserState]);

  const logout = useCallback(() => {
    setCurrentUser(null);
    setContract(null);
    setProvider(null);
    setError(null);
  }, []);

  const issueCertificate = useCallback(
    async (
      recipient: string,
      documentHash: string,
      metadataURI: string,
      expirationDays: number
    ) => {
      if (!contract) {
        throw new Error('Contract not initialized');
      }

      const recipientAddr = ethers.getAddress(recipient);
      const hashNorm = normalizeDocumentHash(documentHash);
      const docId = computeDocumentId(hashNorm, recipientAddr);

      try {
        setLoading(true);
        const tx = await contract.issueDocument(
          docId,
          recipientAddr,
          hashNorm,
          metadataURI,
          expirationDays
        );
        const receipt = await tx.wait();
        return receipt;
      } catch (err) {
        console.error('Error issuing certificate:', err);
        setError('Failed to issue certificate');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [contract]
  );

  const getCertificate = useCallback(
    async (documentHash: string, recipientAddress: string): Promise<Certificate | null> => {
      if (!contract) {
        throw new Error('Contract not initialized');
      }

      try {
        const recipientAddr = ethers.getAddress(recipientAddress);
        const hashNorm = normalizeDocumentHash(documentHash);
        const docId = computeDocumentId(hashNorm, recipientAddr);

        let row: unknown;
        try {
          row = await contract.getDocument(docId);
        } catch {
          return null;
        }

        const doc = rowToOnChainDocument(row);
        if (normalizeDocumentHash(doc.documentHash) !== hashNorm) {
          return null;
        }

        const cert = await enrichCertificateFromChain(contract, docId, doc);

        if (currentUser?.isVerifier) {
          const pendingRid = await findPendingRequestForVerifier(contract, docId, currentUser.address);
          cert.pendingRequestId = pendingRid ?? undefined;
        }

        return cert;
      } catch (err) {
        console.error('Error reading certificate:', err);
        setError('Failed to load certificate');
        throw err;
      }
    },
    [contract, currentUser]
  );

  const requestVerification = useCallback(
    async (documentHash: string, recipientAddress: string, verifierAddress: string) => {
      if (!contract) {
        throw new Error('Contract not initialized');
      }

      const recipientAddr = ethers.getAddress(recipientAddress);
      const verifierAddr = ethers.getAddress(verifierAddress);
      const hashNorm = normalizeDocumentHash(documentHash);
      const docId = computeDocumentId(hashNorm, recipientAddr);

      try {
        setLoading(true);
        const tx = await contract.requestVerification(docId, verifierAddr);
        const receipt = await tx.wait();
        return receipt;
      } catch (err) {
        console.error('Error requesting verification:', err);
        setError('Failed to request verification');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [contract]
  );

  const completeVerification = useCallback(
    async (requestId: string, approved: boolean, notes: string) => {
      if (!contract) {
        throw new Error('Contract not initialized');
      }

      try {
        setLoading(true);
        const rid = ethers.zeroPadValue(requestId as `0x${string}`, 32);
        const tx = await contract.completeVerification(rid, approved, notes);
        const receipt = await tx.wait();
        return receipt;
      } catch (err) {
        console.error('Error completing verification:', err);
        setError('Failed to complete verification');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [contract]
  );

  const fetchMyCertificates = useCallback(async (): Promise<Certificate[]> => {
    if (!contract || !currentUser) return [];

    const addr = currentUser.address;
    let ids: bigint[] = [];

    if (currentUser.isInstitution) {
      ids = await contract.getInstitutionDocuments(addr);
    } else if (!currentUser.isVerifier) {
      ids = await contract.getUserDocuments(addr);
    } else {
      return [];
    }

    const out: Certificate[] = [];
    for (const raw of ids) {
      const docId = asDocumentIdHex(raw);
      try {
        const row = await contract.getDocument(docId);
        const doc = rowToOnChainDocument(row);
        const cert = await enrichCertificateFromChain(contract, docId, doc);
        out.push(cert);
      } catch {
        continue;
      }
    }

    return out.reverse();
  }, [contract, currentUser]);

  useEffect(() => {
    const init = async () => {
      if (!IS_CHAIN_CONFIGURED) {
        setLoading(false);
        return;
      }

      if (typeof window === 'undefined' || !window.ethereum) {
        setLoading(false);
        return;
      }

      try {
        const web3Provider = new BrowserProvider(window.ethereum);
        const accounts = await web3Provider.listAccounts();

        if (accounts.length > 0) {
          const signer = await web3Provider.getSigner();
          const contractInstance = await initContract(signer);

          setProvider(web3Provider);
          setContract(contractInstance);
          await updateUserState(await signer.getAddress());
          setIsNetworkCorrect(await checkIfSepolia(web3Provider));
        }
      } catch (err) {
        console.error('Initialization error:', err);
      } finally {
        setLoading(false);
      }
    };

    void init();
  }, [checkIfSepolia, initContract, updateUserState]);

  const contextValue: AuthContextValue = {
    currentUser,
    loading,
    error,
    isNetworkCorrect,
    isChainConfigured: IS_CHAIN_CONFIGURED,
    contract,
    connectWallet,
    logout,
    issueCertificate,
    getCertificate,
    requestVerification,
    completeVerification,
    fetchMyCertificates,
    setError,
    setLoading,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
