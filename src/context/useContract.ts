import { useContext } from 'react';
import { ContractContext, type ContractContextValue } from './contract-context';

export function useContract(): ContractContextValue {
  const context = useContext(ContractContext);
  if (context === undefined) {
    throw new Error('useContract must be used within a ContractProvider');
  }
  return context;
}
