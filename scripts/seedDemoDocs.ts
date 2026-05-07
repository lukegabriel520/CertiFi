import { ethers } from 'hardhat';
import { DEMO_SAMPLES } from '../src/demo/sampleManifest';
import { computeDocumentId } from '../src/utils/documentId';

const ABI = [
  'function documents(bytes32 documentId) view returns (address issuer, address recipient, string documentHash, string metadataURI, uint256 timestamp, uint256 expirationDate, bool isValid, bool isRevoked)',
  'function issueDocument(bytes32 documentId, address recipient, string documentHash, string metadataURI, uint256 expirationDays) returns (bytes32)',
];

/**
 * Issues demo samples from `src/demo/sampleManifest.ts` on-chain.
 * Requires deployer (PRIVATE_KEY) to have INSTITUTION role on the contract.
 *
 * Usage:
 *   CERTIFI_CONTRACT_ADDRESS=0x... npx hardhat run scripts/seedDemoDocs.ts --network sepolia
 */
async function main() {
  const addr = process.env.CERTIFI_CONTRACT_ADDRESS?.trim();
  if (!addr) {
    throw new Error('Set CERTIFI_CONTRACT_ADDRESS to your deployed Certification contract.');
  }

  const [signer] = await ethers.getSigners();
  const c = new ethers.Contract(addr, ABI, signer);

  console.log('Network signer:', signer.address);
  console.log('Contract:', addr);

  for (const sample of DEMO_SAMPLES) {
    const docId = computeDocumentId(sample.expectedHash, sample.recipientAddress);
    const row = await c.documents(docId);
    const issuer = row.issuer as string;
    if (issuer && issuer !== ethers.ZeroAddress) {
      console.log(`Skip ${sample.slug}: already issued (issuer ${issuer})`);
      continue;
    }

    const meta = JSON.stringify({
      demo: true,
      slug: sample.slug,
      displayName: sample.displayName,
      seededAt: new Date().toISOString(),
    });

    const tx = await c.issueDocument(docId, sample.recipientAddress, sample.expectedHash, meta, 0);
    await tx.wait();
    console.log(`Issued ${sample.slug} → docId ${docId}`);
  }

  console.log('Done.');
}

main().catch(e => {
  console.error(e);
  process.exitCode = 1;
});
