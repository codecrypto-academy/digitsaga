export const CONTRACT_ADDRESSES = {
  31337: {
    // Localhost/Anvil - Monolithic Ecommerce Contract
    ecommerce: process.env.NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS || '',
    euroToken: process.env.NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS || '',
  },
  // Add other networks as needed
};

export function getContractAddress(chainId: number, contract: keyof typeof CONTRACT_ADDRESSES[31337]): string {
  const addresses = CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES];
  if (!addresses) {
    throw new Error(`Network ${chainId} not supported`);
  }
  const address = addresses[contract];
  if (!address) {
    throw new Error(`Contract ${contract} not deployed on network ${chainId}`);
  }
  return address;
}
