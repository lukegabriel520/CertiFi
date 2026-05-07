import { ethers } from 'ethers';

/** Normalize hex hash from SHA-256 (with or without 0x). */
export function normalizeDocumentHash(hash: string): string {
  const t = hash.trim().toLowerCase();
  return t.startsWith('0x') ? t : `0x${t}`;
}

/**
 * Must match issuance: keccak256(abi.encodePacked(documentHash, recipient)).
 * documentHash is the UTF-8 string as stored on-chain (e.g. 0x + 64 hex chars).
 */
export function computeDocumentId(documentHash: string, recipientAddress: string): string {
  const hash = normalizeDocumentHash(documentHash);
  const recipient = ethers.getAddress(recipientAddress);
  return ethers.solidityPackedKeccak256(['string', 'address'], [hash, recipient]);
}
