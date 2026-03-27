import type { PropsWithChildren } from 'react';
import { NavLink } from 'react-router-dom';

import { cn } from '../lib/formatters';
import { NetworkBanner } from './network-banner';
import { WalletPanel } from './wallet-panel';

const navigation = [
  { to: '/', label: 'Overview' },
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/batches/new', label: 'Create Batch' },
  { to: '/verify', label: 'Verify' }
];

export function LayoutShell({ children }: PropsWithChildren) {
  return (
    <div className="relative min-h-screen overflow-hidden text-ink">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 -top-24 h-80 w-80 rounded-full bg-signal/10 blur-3xl" />
        <div className="absolute -right-20 top-8 h-72 w-72 rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(28,36,48,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(28,36,48,0.04)_1px,transparent_1px)] bg-[size:120px_120px] opacity-30" />
      </div>
      <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-6 sm:px-6 lg:px-8">
        <header className="surface-card px-6 py-6 sm:px-8 sm:py-8">
          <div className="flex flex-col gap-8 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-3xl">
              <p className="eyebrow">Distributed Systems DApp</p>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-accent/8 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-accent">
                  Supply Chain Provenance
                </span>
                <span className="rounded-full border border-line/80 bg-white/55 px-3 py-1 text-xs text-ink/60">
                  Ethereum, IPFS, and indexed verification
                </span>
              </div>
              <h1 className="mt-6 font-display text-4xl font-bold tracking-tight text-ink sm:text-5xl">
                TraceChain Pharma
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-ink/68">
                Hybrid Ethereum DApp for pharmaceutical batch provenance, custody transfers,
                telemetry anomaly capture, and public verification.
              </p>
            </div>
            <WalletPanel />
          </div>

          <div className="mt-8 flex flex-col gap-4 border-t border-line/70 pt-6">
            <nav className="flex flex-wrap gap-2">
              {navigation.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      'rounded-full px-4 py-2 text-sm font-semibold transition',
                      isActive
                        ? 'bg-accent text-white shadow-soft'
                        : 'border border-line/80 bg-white/55 text-ink/70 hover:border-accent/25 hover:text-accent'
                    )
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
            <NetworkBanner />
          </div>
        </header>

        <main className="mt-8">{children}</main>
      </div>
    </div>
  );
}
