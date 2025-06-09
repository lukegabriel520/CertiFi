// Mock backend service for development
const MOCK_MODE = true;

export const login = async (identity) => {
  if (MOCK_MODE) {
    return new Promise((resolve) => {
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
  // Actual implementation will go here
};

export const getProfile = async () => {
  if (MOCK_MODE) {
    return {
      principal: '2vxsx-fae',
      role: 'user',
      documents: []
    };
  }
  // Actual implementation will go here
};

// Add other mock service functions as needed
