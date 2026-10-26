import React from 'react';

const OverviewTab = ({ onGetStarted, onExploreFeatures, token }) => {
  return (
    <div className="space-y-16 animate-fade-in">
      {/* Hero Section */}
      <section className="pt-8 pb-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Next-Generation Cryptographic Cloud Vault</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight text-white">
              Secure Cloud File Sharing with{' '}
              <span className="bg-gradient-to-r from-blue-400 via-teal-300 to-emerald-400 text-transparent bg-clip-text">
                Blockchain Audit Logs
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-xl">
              Eliminate centralized trust vulnerabilities. Store and share sensitive business documents with AES-256 zero-knowledge encryption, time-locked recipient permissions, and immutable SHA-256 blockchain audit trails.
            </p>

            <div className="flex flex-wrap gap-4 pt-2">
              <button
                onClick={onGetStarted}
                className="px-6 py-3.5 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-white font-semibold rounded-2xl shadow-xl shadow-blue-600/25 transition transform hover:-translate-y-0.5"
              >
                {token ? 'Open My Vault →' : 'Get Started Free →'}
              </button>
              <button
                onClick={onExploreFeatures}
                className="px-6 py-3.5 bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 font-semibold rounded-2xl border border-slate-700 shadow-md transition"
              >
                Explore Architecture
              </button>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-800">
              <div>
                <div className="text-2xl font-bold text-white">AES-256</div>
                <div className="text-xs text-slate-400">At-Rest & Flight</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-emerald-400">SHA-256</div>
                <div className="text-xs text-slate-400">Blockchain Ledger</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-400">100%</div>
                <div className="text-xs text-slate-400">Tamper-Evident</div>
              </div>
            </div>
          </div>

          {/* Visual Showcase Box */}
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-emerald-600 rounded-3xl blur-2xl opacity-25" />
            <div className="relative bg-slate-800/90 backdrop-blur-xl border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
              <div className="flex items-center justify-between border-b border-slate-700/70 pb-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                  <span className="ml-2 text-xs font-mono text-slate-400">securechain-engine.sh</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-semibold">
                  LIVE SECURE
                </span>
              </div>

              <div className="space-y-3 font-mono text-xs">
                <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 text-slate-300">
                  <span className="text-blue-400">✓ CIPHER:</span> AES-256-CBC initialized with randomized 128-bit IV
                </div>
                <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 text-slate-300">
                  <span className="text-emerald-400">✓ BLOCKCHAIN:</span> Block mined with SHA-256 hash chaining
                </div>
                <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 text-slate-300">
                  <span className="text-purple-400">✓ AUDIT PERSISTENCE:</span> Stored to disk ledger with dual MongoDB indexing
                </div>
                <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 text-slate-300">
                  <span className="text-amber-400">✓ ACCESS VALIDATION:</span> Dynamic UUID tokens with recipient-identity enforcement
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="space-y-8">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 text-transparent bg-clip-text">
            Architected for Zero-Trust Compliance
          </h2>
          <p className="text-slate-400 text-sm mt-2">
            Every file operation creates an immutable proof on our cryptographic chain.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: '🛡️',
              title: 'AES-256 File Encryption',
              desc: 'Files are automatically encrypted before being committed to persistent storage. Raw contents can never be leaked directly from the server disks.',
            },
            {
              icon: '⛓️',
              title: 'Immutable Blockchain Audit',
              desc: 'Uploads, shares, and downloads append new cryptographic blocks with SHA-256 digests. Any tampering breaks the chain hash link immediately.',
            },
            {
              icon: '⏱️',
              title: 'Time-Locked Access Grants',
              desc: 'Generate revocable share tokens with exact expiration dates. Once expired, access is blocked and logged as an authorization violation.',
            },
          ].map((card, i) => (
            <div
              key={i}
              className="bg-slate-800/80 backdrop-blur-md p-6 rounded-2xl border border-slate-700/80 shadow-xl space-y-3 hover:border-slate-600 transition"
            >
              <div className="w-12 h-12 rounded-xl bg-slate-700/60 flex items-center justify-center text-2xl">
                {card.icon}
              </div>
              <h3 className="text-lg font-bold text-white">{card.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{card.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default OverviewTab;
