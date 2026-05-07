import { ethers } from 'ethers';

const MINIMAL_ABI = ['function userRoles(address) view returns (uint8)', 'function owner() view returns (address)'];

export async function verifyContractConnection(
  provider: ethers.BrowserProvider,
  contractAddress: string
): Promise<{
  isContract: boolean;
  code: string;
  functions: string[];
  error?: string;
}> {
  try {
    const code = await provider.getCode(contractAddress);
    const isContract = code !== '0x';

    if (!isContract) {
      return {
        isContract: false,
        code,
        functions: [],
        error: 'No contract code at the specified address',
      };
    }

    const contract = new ethers.Contract(contractAddress, MINIMAL_ABI, provider);

    const testAddress = '0x0000000000000000000000000000000000000000';
    const functions: string[] = [];

    try {
      await contract.userRoles(testAddress);
      functions.push('userRoles');
    } catch (e) {
      console.warn('userRoles call failed:', e);
    }

    try {
      await contract.owner();
      functions.push('owner');
    } catch (e) {
      console.warn('owner call failed:', e);
    }

    return {
      isContract: true,
      code: code.slice(0, 20) + '...',
      functions,
    };
  } catch (error) {
    console.error('Error verifying contract:', error);
    return {
      isContract: false,
      code: '',
      functions: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function checkNetwork(provider: ethers.BrowserProvider): Promise<{
  chainId: number;
  name: string;
  isSepolia: boolean;
}> {
  try {
    const network = await provider.getNetwork();
    return {
      chainId: Number(network.chainId),
      name: network.name,
      isSepolia: network.chainId === BigInt(11155111),
    };
  } catch (error) {
    console.error('Error checking network:', error);
    throw error;
  }
}
