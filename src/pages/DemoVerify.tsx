import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { sha256 } from 'js-sha256';
import { DEMO_SAMPLES } from '../demo/sampleManifest';
import { verifyAgainstManifest } from '../demo/verifyAgainstManifest';

type ChainBadge =
  | { state: 'skipped' }
  | { state: 'loading' }
  | { state: 'ok'; issuer?: string }
  | { state: 'error'; reason: string };

const ENABLE_ONCHAIN =
  import.meta.env.VITE_ENABLE_ONCHAIN_DEMO === '1' ||
  import.meta.env.VITE_ENABLE_ONCHAIN_DEMO === 'true';

async function fetchOnChainVerify(
  documentHash: string,
  recipientAddress: string
): Promise<{ ok: boolean; reason?: string; issuer?: string; unavailable?: boolean }> {
  const res = await fetch('/api/verify-document', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ documentHash, recipientAddress }),
  });
  let parsed: { ok?: boolean; reason?: string; issuer?: string; unavailable?: boolean } = {};
  try {
    parsed = (await res.json()) as typeof parsed;
  } catch {
    /* ignore */
  }
  if (!res.ok) {
    return {
      ok: false,
      reason: parsed.reason ?? `http_${res.status}`,
      unavailable: true,
    };
  }
  return {
    ok: Boolean(parsed.ok),
    reason: parsed.reason,
    issuer: parsed.issuer,
    unavailable: parsed.unavailable,
  };
}

export default function DemoVerify() {
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [documentHash, setDocumentHash] = useState('');
  const [fileLabel, setFileLabel] = useState<string | null>(null);
  const [manifestOk, setManifestOk] = useState<boolean | null>(null);
  const [manifestMessage, setManifestMessage] = useState<string | null>(null);
  const [chainBadge, setChainBadge] = useState<ChainBadge>({ state: 'skipped' });
  const [busy, setBusy] = useState(false);

  const hashBytes = useCallback(async (blob: Blob) => {
    const buf = await blob.arrayBuffer();
    const hex = sha256(new Uint8Array(buf));
    return '0x' + hex;
  }, []);

  const runVerification = useCallback(
    async (hash: string, recipientForChain: string, matchedManifest: boolean) => {
      const manifest = verifyAgainstManifest(hash);
      if (manifest.match) {
        setManifestOk(true);
        setManifestMessage(`Matches bundled sample: ${manifest.sample.displayName}`);
      } else {
        setManifestOk(false);
        setManifestMessage(manifest.reason);
      }

      if (!ENABLE_ONCHAIN || !matchedManifest) {
        setChainBadge({ state: 'skipped' });
        return;
      }

      setChainBadge({ state: 'loading' });
      try {
        const result = await fetchOnChainVerify(hash, recipientForChain);
        if (result.unavailable) {
          setChainBadge({
            state: 'error',
            reason:
              result.reason === 'server_not_configured'
                ? 'Server has no Sepolia RPC / contract env (optional).'
                : 'Could not reach chain.',
          });
          return;
        }
        if (result.ok) {
          setChainBadge({ state: 'ok', issuer: result.issuer });
        } else {
          setChainBadge({
            state: 'error',
            reason:
              result.reason === 'document_not_found'
                ? 'No matching document on Sepolia for this hash + recipient (seed demo docs or ignore).'
                : result.reason ?? 'On-chain check failed',
          });
        }
      } catch {
        setChainBadge({ state: 'error', reason: 'Network error calling verification API.' });
      }
    },
    []
  );

  const loadSample = async (slug: string) => {
    const sample = DEMO_SAMPLES.find(s => s.slug === slug);
    if (!sample) return;
    setBusy(true);
    setSelectedSlug(slug);
    setFileLabel(sample.displayName);
    try {
      const res = await fetch(sample.publicPath);
      if (!res.ok) throw new Error('Failed to fetch sample');
      const blob = await res.blob();
      const hash = await hashBytes(blob);
      setDocumentHash(hash);
      await runVerification(hash, sample.recipientAddress, true);
    } catch (e) {
      setManifestOk(false);
      setManifestMessage(e instanceof Error ? e.message : 'Failed to load sample');
      setDocumentHash('');
      setChainBadge({ state: 'skipped' });
    } finally {
      setBusy(false);
    }
  };

  const onPickFile = async (file: File | null) => {
    if (!file) {
      setDocumentHash('');
      setFileLabel(null);
      setManifestOk(null);
      setManifestMessage(null);
      setChainBadge({ state: 'skipped' });
      setSelectedSlug(null);
      return;
    }
    setBusy(true);
    setSelectedSlug(null);
    setFileLabel(file.name);
    try {
      const hash = await hashBytes(file);
      setDocumentHash(hash);
      const manifest = verifyAgainstManifest(hash);
      const matched = manifest.match;
      const recipient = matched ? manifest.sample.recipientAddress : DEMO_SAMPLES[0].recipientAddress;
      await runVerification(hash, recipient, matched);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="mb-6">
          <Link to="/" className="text-[#6366F1] text-sm hover:underline">
            ← Back to home
          </Link>
        </div>

        <h1 className="text-3xl font-bold text-[#f9fafb] mb-2">Try CertiFi (demo)</h1>
        <p className="text-[#94a3b8] mb-6">
          No wallet required. We hash your file in the browser and compare it to bundled samples.
          {ENABLE_ONCHAIN
            ? ' Optional Sepolia read-only check runs after a manifest match when API secrets are set.'
            : ' Enable optional on-chain check with VITE_ENABLE_ONCHAIN_DEMO=1 plus server env (see .env.example).'}
        </p>

        <div className="bg-[#1b263b] border border-[#415a77] rounded-lg p-6 space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-[#f9fafb] mb-3">Bundled samples</h2>
            <ul className="space-y-3">
              {DEMO_SAMPLES.map(s => (
                <li
                  key={s.slug}
                  className="flex flex-wrap items-center justify-between gap-3 bg-[#0d1b2a] rounded-md px-4 py-3 border border-[#415a77]"
                >
                  <div>
                    <p className="text-[#f9fafb] font-medium">{s.displayName}</p>
                    <p className="text-xs text-[#94a3b8] mt-1">{s.notes}</p>
                  </div>
                  <div className="flex gap-2">
                    <a
                      href={s.publicPath}
                      download
                      className="text-sm px-3 py-1.5 rounded-md bg-[#415a77] text-[#f9fafb] hover:bg-[#778da9]"
                    >
                      Download
                    </a>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => loadSample(s.slug)}
                      className="text-sm px-3 py-1.5 rounded-md bg-[#6366F1] text-white hover:bg-[#4f46e5] disabled:opacity-50"
                    >
                      Load & verify
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-[#f9fafb] mb-2">Or upload any file</h2>
            <input
              type="file"
              disabled={busy}
              onChange={e => void onPickFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-[#cbd5e1] file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-[#6366F1] file:text-white"
            />
          </div>

          {documentHash && (
            <div className="space-y-2">
              <p className="text-sm text-[#94a3b8]">SHA-256 (hex)</p>
              <p className="text-xs font-mono text-[#f9fafb] break-all">{documentHash}</p>
              {fileLabel && (
                <p className="text-xs text-[#94a3b8]">
                  Source: {fileLabel}
                  {selectedSlug ? ` (${selectedSlug})` : ''}
                </p>
              )}
            </div>
          )}

          {manifestOk !== null && (
            <div
              className={`rounded-md p-4 border ${
                manifestOk
                  ? 'bg-green-900/20 border-green-600 text-green-100'
                  : 'bg-red-900/20 border-red-600 text-red-100'
              }`}
            >
              <p className="font-medium">{manifestOk ? 'Manifest: match' : 'Manifest: no match'}</p>
              {manifestMessage && <p className="text-sm mt-2 opacity-90">{manifestMessage}</p>}
            </div>
          )}

          <div className="rounded-md p-4 border border-[#415a77] bg-[#0d1b2a]">
            <p className="text-sm font-medium text-[#f9fafb] mb-2">On-chain check (optional)</p>
            {chainBadge.state === 'skipped' && (
              <p className="text-sm text-[#94a3b8]">
                {!ENABLE_ONCHAIN
                  ? 'Disabled for this build (set VITE_ENABLE_ONCHAIN_DEMO=1 to try).'
                  : 'Runs after a bundled sample matches the manifest (read-only Sepolia check).'}
              </p>
            )}
            {chainBadge.state === 'loading' && (
              <p className="text-sm text-[#cbd5e1]">Checking Sepolia (read-only)…</p>
            )}
            {chainBadge.state === 'ok' && (
              <p className="text-sm text-green-300">
                Confirmed on-chain record{chainBadge.issuer ? ` (issuer ${chainBadge.issuer})` : ''}.
              </p>
            )}
            {chainBadge.state === 'error' && (
              <p className="text-sm text-amber-200">{chainBadge.reason}</p>
            )}
          </div>
        </div>
      </div>
  );
}
