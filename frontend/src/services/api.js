import { Actor, HttpAgent } from "@dfinity/agent";
import { backendConfig } from "../utils/backendConfig";

// Set to true to use mock data
const MOCK_MODE = process.env.NODE_ENV === 'development'; // Only mock in development

let agent = null;
let backendActor = null;

// Mock data
const mockProfile = {
  principal: '2vxsx-fae',
  role: 'user',
  documents: []
};

const mockDocuments = [];

// Initialize the agent and backend actor
export const initBackend = async () => {
  if (MOCK_MODE) {
    console.log('Running in mock mode');
    return {};
  }
  
  // In production, use the canister ID from the environment
  const canisterId = process.env.REACT_APP_CANISTER_ID || process.env.CANISTER_ID;

  try {
    const { idlFactory } = await import('../../../declarations/certifi_backend');
    agent = new HttpAgent({
      host: backendConfig.host,
    });

    // In development, fetch the root key to validate signatures
    if (backendConfig.isLocalEnv()) {
      try {
        await agent.fetchRootKey();
      } catch (err) {
        console.warn("Unable to fetch root key. Make sure dfx is running");
        throw err;
      }
    }

    // Dynamically import the canister ID based on the environment
    const canisterId = process.env.REACT_APP_CANISTER_ID || process.env.CANISTER_ID;
    
    backendActor = Actor.createActor(idlFactory, {
      agent,
      canisterId: canisterId || backendConfig.canisterId,
    });

    return backendActor;
  } catch (error) {
    console.error("Failed to initialize backend:", error);
    throw error;
  }
};

// Get the backend actor instance
export const getBackend = async () => {
  if (!backendActor) {
    return await initBackend();
  }
  return backendActor;
};

// Authentication methods
export const auth = {
  login: async () => {
    if (MOCK_MODE) {
      return new Promise(resolve => {
        setTimeout(() => {
          resolve({
            status: 'success',
            user: {
              id: 'mock-user-123',
              name: 'Test User',
              role: 'user',
              principal: '2vxsx-fae'
            }
          });
        }, 500);
      });
    }
    const actor = await getBackend();
    return await actor.login();
  },
  logout: async () => {
    if (MOCK_MODE) {
      return Promise.resolve({ status: 'success' });
    }
    const actor = await getBackend();
    return await actor.logout();
  },
  isAuthenticated: async () => {
    if (MOCK_MODE) {
      return Promise.resolve(true);
    }
    const actor = await getBackend();
    return await actor.isAuthenticated();
  },
};

// Document methods
export const documents = {
  getMyDocuments: async () => {
    if (MOCK_MODE) {
      return Promise.resolve(mockDocuments);
    }
    const actor = await getBackend();
    return await actor.getMyDocuments();
  },
  uploadDocument: async (document) => {
    if (MOCK_MODE) {
      const newDoc = {
        ...document,
        id: `doc-${Date.now()}`,
        status: 'pending',
        uploadTime: new Date().toISOString()
      };
      mockDocuments.push(newDoc);
      return Promise.resolve(newDoc);
    }
    const actor = await getBackend();
    return await actor.uploadDocument(document);
  },
  verifyDocument: async (documentId) => {
    if (MOCK_MODE) {
      return Promise.resolve({ status: 'success' });
    }
    const actor = await getBackend();
    return await actor.verifyDocument(documentId);
  },
};

// User methods
export const users = {
  getMyProfile: async () => {
    if (MOCK_MODE) {
      return Promise.resolve(mockProfile);
    }
    const actor = await getBackend();
    return await actor.getMyProfile();
  },
  updateProfile: async (profile) => {
    if (MOCK_MODE) {
      Object.assign(mockProfile, profile);
      return Promise.resolve(mockProfile);
    }
    const actor = await getBackend();
    return await actor.updateProfile(profile);
  },
};

// Initialize the backend when this module is imported
initBackend().catch(console.error);
