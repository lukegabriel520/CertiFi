import { normalizeDocumentHash } from '../utils/documentId';
import type { ManifestVerifyResult } from './sampleManifest';
import { DEMO_SAMPLES } from './sampleManifest';

export function verifyAgainstManifest(documentHash: string): ManifestVerifyResult {
  const norm = normalizeDocumentHash(documentHash);
  const hit = DEMO_SAMPLES.find(s => normalizeDocumentHash(s.expectedHash) === norm);
  if (hit) return { match: true, sample: hit };
  return {
    match: false,
    reason: 'This SHA-256 does not match any bundled demo file. Download a sample and try again without editing it.',
  };
}
