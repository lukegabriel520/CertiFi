import type { Contract } from 'ethers';
import { ethers } from 'ethers';
import type { Certificate } from '../types';

/** Normalize bytes32 values returned from the contract (string or bigint). */
export function asDocumentIdHex(raw: bigint | string): string {
  if (typeof raw === 'string') {
    if (raw.startsWith('0x') && raw.length === 66) return raw.toLowerCase();
    return ethers.zeroPadValue(raw as `0x${string}`, 32);
  }
  return ethers.zeroPadValue(ethers.toBeHex(raw), 32);
}

export type OnChainDocumentRow = {
  issuer: string;
  recipient: string;
  documentHash: string;
  metadataURI: string;
  timestamp: bigint;
  expirationDate: bigint;
  isValid: boolean;
  isRevoked: boolean;
};

export function parseCertificateMetadata(metadataURI: string): {
  fileName?: string;
  fileSize?: number;
  fileType?: string;
} {
  try {
    const o = JSON.parse(metadataURI) as Record<string, unknown>;
    return {
      fileName: typeof o.fileName === 'string' ? o.fileName : undefined,
      fileSize: typeof o.fileSize === 'number' ? o.fileSize : undefined,
      fileType: typeof o.fileType === 'string' ? o.fileType : undefined,
    };
  } catch {
    return {};
  }
}

export async function findPendingRequestForVerifier(
  contract: Contract,
  documentId: string,
  verifierAddress: string
): Promise<string | null> {
  const v = ethers.getAddress(verifierAddress).toLowerCase();
  const ids = (await contract.getDocumentVerifications(documentId)) as bigint[];
  for (const raw of ids) {
    const vid = asDocumentIdHex(raw);
    const req = await contract.getVerificationRequest(vid);
    const verifier = ethers.getAddress(String(req.verifier)).toLowerCase();
    if (verifier !== v) continue;
    if (req.isVerified || req.isRejected) continue;
    return vid;
  }
  return null;
}

export async function enrichCertificateFromChain(
  contract: Contract,
  documentId: string,
  doc: OnChainDocumentRow
): Promise<Certificate> {
  const meta = parseCertificateMetadata(doc.metadataURI);
  const verIds = (await contract.getDocumentVerifications(documentId)) as bigint[];

  let status: NonNullable<Certificate['status']> = 'pending';
  let verificationNotes: string | undefined;
  let verifierAddress: string | undefined;
  let pendingRequestId: string | undefined;

  let terminal: { status: 'verified' | 'rejected'; notes: string; verifier: string } | undefined;

  for (const raw of verIds) {
    const vid = asDocumentIdHex(raw);
    const req = await contract.getVerificationRequest(vid);
    if (req.isVerified) {
      terminal = {
        status: 'verified',
        notes: String(req.verificationNotes ?? ''),
        verifier: String(req.verifier),
      };
      break;
    }
    if (req.isRejected) {
      terminal = {
        status: 'rejected',
        notes: String(req.verificationNotes ?? ''),
        verifier: String(req.verifier),
      };
      break;
    }
  }

  if (terminal) {
    status = terminal.status;
    verificationNotes = terminal.notes || undefined;
    verifierAddress = terminal.verifier;
  } else {
    for (const raw of verIds) {
      const vid = asDocumentIdHex(raw);
      const req = await contract.getVerificationRequest(vid);
      if (!req.isVerified && !req.isRejected) {
        pendingRequestId = vid;
        verifierAddress = String(req.verifier);
        status = 'pending';
        break;
      }
    }
  }

  if (doc.isRevoked || !doc.isValid) {
    status = 'rejected';
  }

  return {
    id: documentId,
    issuer: doc.issuer,
    recipient: doc.recipient,
    documentHash: doc.documentHash,
    timestamp: Number(doc.timestamp),
    metadataURI: doc.metadataURI,
    isVerified: status === 'verified',
    isRevoked: doc.isRevoked,
    verificationResult: verificationNotes ?? '',
    status,
    fileName: meta.fileName ?? 'Certified document',
    fileSize: meta.fileSize,
    fileType: meta.fileType,
    userAddress: doc.recipient,
    institutionAddress: doc.issuer,
    verifierAddress,
    verificationNotes,
    hash: doc.documentHash,
    uploadDate: new Date(Number(doc.timestamp) * 1000).toISOString(),
    pendingRequestId,
  };
}

export function rowToOnChainDocument(row: unknown): OnChainDocumentRow {
  const r = row as Record<string, unknown>;
  return {
    issuer: String(r.issuer),
    recipient: String(r.recipient),
    documentHash: String(r.documentHash),
    metadataURI: String(r.metadataURI),
    timestamp: BigInt(String(r.timestamp)),
    expirationDate: BigInt(String(r.expirationDate)),
    isValid: Boolean(r.isValid),
    isRevoked: Boolean(r.isRevoked),
  };
}
