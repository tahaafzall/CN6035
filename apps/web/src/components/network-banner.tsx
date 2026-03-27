import { chainDisplayNames } from '@tracechain/shared';
import { useAccount, useChainId, useSwitchChain } from 'wagmi';

export function NetworkBanner() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const supported = chainId in chainDisplayNames;

  if (!isConnected) {
    return (
      <div className="surface-card-soft border-dashed px-4 py-3 text-sm text-ink/62">
        Connect MetaMask to submit transactions and read live contract state.
      </div>
    );
  }

  return (
    <div className="surface-card-soft flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm text-ink/72">
      <div>
        <span className="eyebrow">Network</span>
        <p className="mt-1 font-medium text-ink">
          {supported ? chainDisplayNames[chainId] : `Unsupported chain (${chainId})`}
        </p>
      </div>
      {!supported ? (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => switchChain({ chainId: 31337 })}
            className="btn-secondary px-4 py-2 text-xs uppercase tracking-[0.2em]"
          >
            Switch Local
          </button>
          <button
            type="button"
            onClick={() => switchChain({ chainId: 11155111 })}
            className="btn-secondary px-4 py-2 text-xs uppercase tracking-[0.2em]"
          >
            Switch Sepolia
          </button>
        </div>
      ) : null}
    </div>
  );
}
