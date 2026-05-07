# CertiFi

CertiFi is a small web application that ties digital documents to the Ethereum blockchain so issuers can record certificates, recipients can request checks verifiers perform, and anyone looking at the app can reason about whether a file’s fingerprint lines up with what was stored on chain. Think of it as a prototype for “proof a school or company issued this PDF” without replacing a full legal records system; it is aimed at learning, demos, and test networks rather than production custody of sensitive data.

The idea in plain terms: someone uploads or points at a file, the app hashes it, and that hash can be registered in a smart contract together with who issued it and who receives it. A separate verifier role can then confirm or reject verification requests. Regular wallet holders use MetaMask to sign transactions when you point the app at a deployed contract.

## What is in this repository

The frontend is a React application built with Vite and TypeScript. Styling uses Tailwind-style utility classes. Routing sends visitors to a home page, an optional wallet-free demo path, a dashboard behind login, and role-specific screens for issuing certificates (institution) and verifying documents (verifier).

The on-chain logic lives in a Solidity contract named Certification. Hardhat compiles it, generates TypeScript bindings under typechain, and can deploy to a local network or to Sepolia when you supply RPC details and a funded private key in environment variables. A deploy script registers the deployer with appropriate roles and can write deployment metadata for the team.

There is also a Vercel-style serverless handler under api that can check a document hash and recipient against the live contract when the hosting environment provides RPC URL and contract address secrets. The sample environment file lists the variable names the project expects.

## How the pieces fit together

Institutions (or the contract owner) register users with roles. Institutions issue documents identified by hash and metadata pointers. End users can ask for verification; verifiers complete those requests on chain. The landing flow can hash a local file with SHA-256 and, when the app is configured with a contract address, tie that into wallet-driven flows. If the contract is not configured for your build, the UI still directs people to the demo path for offline or bundled sample verification.

## Getting started (developers)

Install Node.js (a recent LTS version is fine), clone the repo, and run npm install in the project root.

Copy .env.example to .env and fill in values you need. At minimum, live wallet features expect VITE_CONTRACT_ADDRESS and matching chain settings for something like Sepolia; Hardhat deployment expects SEPOLIA_RPC_URL and PRIVATE_KEY when targeting that network.

Typical commands:

- npm run dev — start the Vite development server for the UI.
- npm run compile — compile Solidity with Hardhat.
- npm run deploy — run the default deploy script against localhost (requires a local Hardhat node if you use that network).
- npx hardhat run scripts/deploy.ts --network sepolia — deploy to Sepolia after configuring .env for that network.
- npm run seed:demo — optional helper to seed demo documents on Sepolia when documented in package scripts.

Production builds for hosts such as Vercel may use npm run vercel-build, which compiles contracts then builds the frontend so generated artifacts stay in sync.

## License and expectations

Treat keys, RPC endpoints, and test ether as sensitive. This codebase is a learning and demonstration stack; audits, legal review, and operational hardening would be required before any real-world attestation service relied on it.
