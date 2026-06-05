'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface WalletContextType {
  account: string | null;
  connectWallet: () => Promise<void>;
  isConnecting: boolean;
}

const WalletContext = createContext<WalletContextType>({
  account: null,
  connectWallet: async () => {},
  isConnecting: false,
});

export function WalletProvider({ children }: { children: ReactNode }) {
  // Keep states static and safe while feature is paused
  const [account] = useState<string | null>(null);
  const [isConnecting] = useState(false);

  // FEATURE_FLAG: Web3 Background initialization entirely paused to clean logs
  /*
  useEffect(() => {
    const checkConnection = async () => {
      const provider = (await detectEthereumProvider()) as MetaMaskProvider | null;
      if (provider && provider.selectedAddress) {
        setAccount(provider.selectedAddress);
      }
    };
    checkConnection();
  }, []);
  */

  const connectWallet = async () => {
    // No-op placeholder until ready to implement
    console.log("Web3 wallet connection is currently deactivated.");
  };

  return (
    <WalletContext.Provider value={{ account, connectWallet, isConnecting }}>
      {children}
    </WalletContext.Provider>
  );
}

export const useWallet = () => useContext(WalletContext);