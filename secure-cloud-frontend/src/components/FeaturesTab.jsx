import React from 'react';

const FeaturesTab = ({ onStartUsing }) => {
  const features = [
    {
      title: "End-to-End Encryption (AES-256)",
      description: "Data is secured in transit and at rest using AES-256 cipher blocks with cryptographic salt derivation.",
      icon: "🔒",
      badge: "Cryptographic",
    },
    {
      title: "Time-Limited File Sharing",
      description: "Set granular expiration timestamps on sharing tokens. Links automatically self-destruct once the deadline passes.",
      icon: "⏰",
      badge: "Access Control",
    },
    {
      title: "Role-Based Access Control (RBAC)",
      description: "Hierarchical permissions distinguish between standard users, auditors, and administrators with approve/reject workflows.",
      icon: "👥",
      badge: "Authorization",
    },
    {
      title: "Cryptographic File Integrity (SHA-256)",
      description: "Compare byte-for-byte client digests before and after download to verify files were not tampered with.",
      icon: "🔬",
      badge: "Verification",
    },
    {
      title: "Tamper-Evident Blockchain Ledger",
      description: "A linked SHA-256 block sequence where each block stores the previous block's hash. Persisted to disk storage across restarts.",
      icon: "⛓️",
      badge: "Immutability",
    },
    {
      title: "Comprehensive Audit Log Database",
      description: "MongoDB-indexed audit trail capturing client IP addresses, actor identities, event types, and metadata payloads.",
      icon: "📜",
      badge: "Compliance",
    },
  ];

  return (
    <div className="space-y-12 animate-fade-in max-w-6xl mx-auto">
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <h2 className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-blue-400 to-emerald-400 text-transparent bg-clip-text">
          Enterprise Security Features
        </h2>
        <p className="text-slate-300 text-sm sm:text-base">
          Every component in SecureChain is engineered to eliminate data exfiltration risks and provide non-repudiable audit logging.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((f, i) => (
          <div
            key={i}
            className="bg-slate-800/80 backdrop-blur-md p-6 rounded-2xl border border-slate-700/80 shadow-xl space-y-4 hover:border-slate-600 transition flex flex-col justify-between"
          >
            <div>
              <div className="flex justify-between items-start mb-3">
                <span className="text-3xl">{f.icon}</span>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[11px] font-semibold">
                  {f.badge}
                </span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{f.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{f.description}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-gradient-to-r from-blue-900/60 via-slate-800/80 to-emerald-900/60 p-8 rounded-3xl border border-slate-700 text-center space-y-4">
        <h3 className="text-2xl font-bold text-white">Ready to test secure file sharing?</h3>
        <p className="text-slate-300 text-sm max-w-xl mx-auto">
          Create an account or login to begin uploading encrypted files, managing shares, and monitoring the blockchain.
        </p>
        <button
          onClick={onStartUsing}
          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-white font-semibold rounded-xl shadow-lg transition"
        >
          Launch Vault Now →
        </button>
      </div>
    </div>
  );
};

export default FeaturesTab;
