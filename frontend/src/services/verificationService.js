import actor from './backend';

export const verifyDocument = async (docId, expectedHash) => {
    try {
        return await actor.verifyDocumentHash(docId, expectedHash);
    } catch (error) {
        console.error("Verification failed:", error);
        throw error;
    }
};

export const getDocumentStatus = async (docId) => {
    try {
        return await actor.getDocumentStatus(docId);
    } catch (error) {
        console.error("Error getting status:", error);
        throw error;
    }
};