// This file helps manage the backend canister configuration

// Get the backend canister ID from environment variables
const backendCanisterId = process.env.REACT_APP_BACKEND_CANISTER_ID;

// Determine the host based on the environment
const host = process.env.REACT_APP_DFX_NETWORK === 'ic' 
  ? 'https://ic0.app' 
  : `http://${process.env.REACT_APP_IC_HOST || 'localhost:8000'}`;

// Internet Identity configuration
const identityProvider = process.env.REACT_APP_DFX_NETWORK === 'ic'
  ? 'https://identity.ic0.app'
  : `http://localhost:4943`;

export const backendConfig = {
  canisterId: backendCanisterId,
  host,
  identityProvider,
  // Add any other backend-specific configuration here
};

export const isLocalEnv = () => !process.env.REACT_APP_DFX_NETWORK || process.env.REACT_APP_DFX_NETWORK !== 'ic';
