import { Actor, HttpAgent } from '@dfinity/agent';
import { idlFactory } from '../../declarations/certifi_backend';

const canisterId = process.env.REACT_APP_CANISTER_ID;
const host = process.env.REACT_APP_IC_HOST;

let actor;

export const initializeActor = async (identity) => {
    const agent = new HttpAgent({ 
        host,
        identity
    });
    
    if (process.env.NODE_ENV !== "production") {
        await agent.fetchRootKey();
    }
    
    actor = Actor.createActor(idlFactory, {
        agent,
        canisterId,
    });
    return actor;
};

export default actor;