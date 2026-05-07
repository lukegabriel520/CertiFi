export type DemoSampleEntry = {
  slug: string;
  publicPath: string;
  displayName: string;
  /** Canonical recipient used with optional on-chain demo seeding (Hardhat account #1 style). */
  recipientAddress: string;
  expectedHash: string;
  notes?: string;
};

export type ManifestVerifyResult =
  | { match: true; sample: DemoSampleEntry }
  | { match: false; reason: string };

/**
 * Pinned SHA-256 values for files under `public/samples/`.
 * Recompute with: node -e "const fs=require('fs');const c=require('crypto'); ..."
 */
export const DEMO_SAMPLES: DemoSampleEntry[] = [
  {
    slug: 'sample-a',
    publicPath: '/samples/certifi-sample-a.txt',
    displayName: 'Demo sample A',
    recipientAddress: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    expectedHash: '0xb98507c7f1e14a8359188fb2fb50ac1c113cdf46ce7c78ac62636e5a8be19e7c',
    notes:
      'Use “Load sample A” or upload this file unchanged. Optional Sepolia check expects this hash issued to the recipient above.',
  },
  {
    slug: 'sample-b',
    publicPath: '/samples/certifi-sample-b.txt',
    displayName: 'Demo sample B',
    recipientAddress: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    expectedHash: '0x382140f7041d8f4e690d518ca380785ea2b41087574c5b364e25b580fcca791f',
    notes: 'Second demo file to try hash mismatch scenarios against sample A.',
  },
];
