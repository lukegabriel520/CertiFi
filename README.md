**Overview** CertiFi is a decentralized document verification app built for the Internet Computer. This repository has a backend canister that stores document bytes and metadata plus a React frontend that lets people sign in and manage documents. The backend keeps separate flows for institution files and user files, with simple actions to upload, list, download, and (for institutions) delete.

**Stack used** Internet Computer and DFX for canisters, Motoko for backend logic, Candid for the interface, React and React Router for the UI, and DFINITY agent libraries for canister calls, all run with Node.js and npm.

**Thought process** Keep trust high and the flow simple: store files and metadata directly in the canister, split institution documents from user documents, and give the UI clear login and dashboard paths so people can upload and check their records without needing to understand blockchain details.

**Stitching idea** DFX starts the local replica and deploys the canister defined in dfx.json. The frontend reads the canister ID from environment variables and uses @dfinity/agent to call the backend. Routing in the UI sends users to role-based dashboards while the backend handles persistence and retrieval.

**Progress** Core backend upload, list, and download behavior for both institution and user documents is implemented. The frontend has landing, login, signup, and dashboard pages with an auth context, and the API layer can run in mock mode during local development. Setup notes are captured in setup.md and setup-env.sh.

**How to run ideally** Install Node.js and DFX, start the local replica with dfx start --clean --background, deploy the canisters with dfx deploy, set frontend environment values like the canister ID, local host, and identity URL, then in the frontend folder run npm install and npm start. For a one-command local flow from the frontend folder, use npm run dev after DFX is installed.
