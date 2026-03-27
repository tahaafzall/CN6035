import { shortHash } from '../lib/formatters';
import { useWalletAuth } from '../features/auth/auth-context';
import { useAccount, useConnect, useDisconnect } from 'wagmi';

export function WalletPanel() {
  const { address, isConnected } = useAccount();
  const { connectors, connect, error, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const auth = useWalletAuth();

  const preferredConnector =
    connectors.find((connector) => connector.name.toLowerCase().includes('metamask')) ||
    connectors.find((connector) => connector.type === 'injected') ||
    connectors[0];

  return (
    <div className="flex flex-col gap-3 xl:items-end">
      <div className="flex flex-wrap items-center gap-3 xl:justify-end">
      {isConnected ? (
        <div className="rounded-full border border-line/80 bg-white/60 px-4 py-2 text-sm font-medium text-ink/80 shadow-soft">
          {shortHash(address ?? '', 8, 4)}
        </div>
      ) : null}

      {!isConnected ? (
        <button
          type="button"
          onClick={() => {
            if (!preferredConnector) return;
            connect({ connector: preferredConnector });
          }}
          className="btn-primary"
          disabled={isPending || !preferredConnector}
        >
          {!preferredConnector
            ? 'MetaMask not detected'
            : isPending
              ? 'Connecting...'
              : 'Connect Wallet'}
        </button>
      ) : (
        <>
          <button
            type="button"
            onClick={() => {
              void auth.authenticate();
            }}
            disabled={auth.isAuthenticating}
            className="btn-accent"
          >
            {auth.isAuthenticated
              ? 'API Session Active'
              : auth.isAuthenticating
                ? 'Signing...'
                : 'Authenticate API'}
          </button>
          <button
            type="button"
            onClick={() => {
              auth.logout();
              disconnect();
            }}
            className="btn-secondary px-4"
          >
            Disconnect
          </button>
        </>
      )}
      </div>

      {!isConnected && !preferredConnector ? (
        <p className="max-w-sm text-right text-xs leading-6 text-ink/55">
          Open this app in the same browser profile where MetaMask is installed and enabled.
        </p>
      ) : null}

      {error ? (
        <p className="max-w-sm text-right text-xs leading-6 text-danger">
          {error.message}
        </p>
      ) : null}
    </div>
  );
}
