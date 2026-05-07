import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ethers } from 'ethers';
import { computeDocumentId, normalizeDocumentHash } from '../src/utils/documentId';

/** Public mapping getter — does not revert when missing (issuer is address zero). */
const DOCUMENTS_ABI = [
  'function documents(bytes32 documentId) view returns (address issuer, address recipient, string documentHash, string metadataURI, uint256 timestamp, uint256 expirationDate, bool isValid, bool isRevoked)',
];

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, reason: 'method_not_allowed' });
    return;
  }

  const rpc = process.env.SEPOLIA_RPC_URL?.trim();
  const contractAddr = process.env.CERTIFI_CONTRACT_ADDRESS?.trim();

  if (!rpc || !contractAddr) {
    res.status(503).json({ ok: false, reason: 'server_not_configured', unavailable: true });
    return;
  }

  const rawBody = req.body;
  const body =
    typeof rawBody === 'string'
      ? (JSON.parse(rawBody || '{}') as Record<string, unknown>)
      : ((rawBody ?? {}) as Record<string, unknown>);

  const documentHash = body.documentHash as string | undefined;
  const recipientAddress = body.recipientAddress as string | undefined;

  if (!documentHash || !recipientAddress) {
    res.status(400).json({ ok: false, reason: 'missing_fields' });
    return;
  }

  try {
    ethers.getAddress(recipientAddress);
  } catch {
    res.status(400).json({ ok: false, reason: 'invalid_recipient' });
    return;
  }

  const norm = normalizeDocumentHash(documentHash);
  const docId = computeDocumentId(norm, recipientAddress);

  try {
    const provider = new ethers.JsonRpcProvider(rpc);
    const c = new ethers.Contract(contractAddr, DOCUMENTS_ABI, provider);
    const row = await c.documents(docId);
    const issuer = String(row.issuer);
    if (!issuer || issuer === ethers.ZeroAddress) {
      res.status(200).json({ ok: false, reason: 'document_not_found', unavailable: false });
      return;
    }
    const stored = normalizeDocumentHash(String(row.documentHash));
    if (stored !== norm) {
      res.status(200).json({ ok: false, reason: 'hash_mismatch_on_chain', issuer });
      return;
    }
    res.status(200).json({
      ok: true,
      issuer,
      recipient: String(row.recipient),
      documentHash: stored,
    });
  } catch (e) {
    console.error('[verify-document]', e);
    res.status(200).json({ ok: false, reason: 'rpc_error', unavailable: true });
  }
}
