'use client';
import { useEffect } from 'react';
import type { OrbitTracker } from './index';
/** Pass the result of wagmi's useAccount(). Reconnect states do not reset identity. */
export function useOrbitWallet(tracker: OrbitTracker, account: { address?: string; chainId?: number; connector?: { name: string }; status: string }) {
  const { address, chainId, connector, status } = account;
  useEffect(() => {
    if (status === 'connected' && address) tracker.identifyWallet(address, connector?.name, chainId);
    if (status === 'disconnected') tracker.disconnectWallet();
  }, [tracker, address, chainId, connector?.name, status]);
}
