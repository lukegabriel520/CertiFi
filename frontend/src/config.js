// In development, will be replaced by .env during build
export const BACKEND_CANISTER_ID = process.env.REACT_APP_BACKEND_CANISTER_ID || "rrkah-fqaaa-aaaaa-aaaaq-cai";

export const HOST = process.env.REACT_APP_DFX_NETWORK === "ic" 
  ? "https://ic0.app" 
  : `http://${process.env.REACT_APP_DFX_NETWORK || "localhost:8000"}`;
