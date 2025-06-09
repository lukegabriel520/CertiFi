import React, { createContext, useContext } from 'react';
import * as api from '../services/api';

const BackendContext = createContext();

export const useBackend = () => {
  const context = useContext(BackendContext);
  if (!context) {
    throw new Error('useBackend must be used within a BackendProvider');
  }
  return context;
};

export const BackendProvider = ({ children }) => {
  // Use the API service directly
  return (
    <BackendContext.Provider value={api}>
      {children}
    </BackendContext.Provider>
  );
};

export default BackendContext;
