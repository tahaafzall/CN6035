/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useMemo, useState } from 'react';
import type { PropsWithChildren } from 'react';
import { useAccount, useSignMessage } from 'wagmi';

import { apiRequest, clearStoredToken, getStoredToken, setStoredToken } from '../../lib/api';

type AuthContextValue = {
  token: string | null;
  isAuthenticated: boolean;
  isAuthenticating: boolean;
  authenticate: () => Promise<string>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

type AuthVerifyResponse = {
  token: string;
};

export function AuthProvider({ children }: PropsWithChildren) {
  const { address } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const [token, setToken] = useState<string | null>(() => getStoredToken());
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      isAuthenticated: Boolean(token),
      isAuthenticating,
      authenticate: async () => {
        if (!address) {
          throw new Error('Connect a wallet before authenticating.');
        }

        setIsAuthenticating(true);

        try {
          const nonceResponse = await apiRequest<{ message: string }>('/api/auth/nonce', {
            method: 'POST',
            body: { walletAddress: address }
          });

          const signature = await signMessageAsync({
            message: nonceResponse.message
          });

          const verifyResponse = await apiRequest<AuthVerifyResponse>('/api/auth/verify', {
            method: 'POST',
            body: { walletAddress: address, signature }
          });

          setStoredToken(verifyResponse.token);
          setToken(verifyResponse.token);

          return verifyResponse.token;
        } finally {
          setIsAuthenticating(false);
        }
      },
      logout: () => {
        clearStoredToken();
        setToken(null);
      }
    }),
    [address, isAuthenticating, signMessageAsync, token]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useWalletAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useWalletAuth must be used within AuthProvider.');
  }

  return context;
}
