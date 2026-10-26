import React from 'react';

const TechnologyTab = () => {
  return (
    <div className="space-y-12 animate-fade-in max-w-6xl mx-auto">
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <h2 className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-blue-400 to-emerald-400 text-transparent bg-clip-text">
          Full-Stack Technology Architecture
        </h2>
        <p className="text-slate-300 text-sm sm:text-base">
          Engineered using modern cryptographic primitives, persistent NoSQL schemas, and responsive reactive interfaces.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Backend Stack */}
        <div className="bg-slate-800/80 backdrop-blur-md p-6 rounded-2xl border border-slate-700/80 shadow-xl space-y-4">
          <div className="flex items-center gap-3 border-b border-slate-700 pb-3">
            <span className="text-2xl">⚡</span>
            <h3 className="text-lg font-bold text-blue-400">Backend & API</h3>
          </div>
          <ul className="space-y-3 text-sm text-slate-300">
            <li className="flex items-start gap-2">
              <span className="text-blue-400 font-bold">•</span>
              <span><strong>Node.js & Express:</strong> High-throughput REST API with modular routers and rate limiting.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 font-bold">•</span>
              <span><strong>AES-256-CBC:</strong> Symmetric file encryption at rest using Node.js native crypto.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 font-bold">•</span>
              <span><strong>JWT & bcrypt:</strong> Role-based token claims, 8-hour expiry, and salted password hashes.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 font-bold">•</span>
              <span><strong>Helmet & CORS:</strong> HTTP security headers and strictly scoped client origins.</span>
            </li>
          </ul>
        </div>

        {/* Database & Blockchain */}
        <div className="bg-slate-800/80 backdrop-blur-md p-6 rounded-2xl border border-slate-700/80 shadow-xl space-y-4">
          <div className="flex items-center gap-3 border-b border-slate-700 pb-3">
            <span className="text-2xl">⛓️</span>
            <h3 className="text-lg font-bold text-emerald-400">Data & Blockchain</h3>
          </div>
          <ul className="space-y-3 text-sm text-slate-300">
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold">•</span>
              <span><strong>MongoDB Atlas:</strong> Schematized storage for Users, Files, Share Grants, and Audit Logs.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold">•</span>
              <span><strong>SHA-256 Blockchain:</strong> Custom cryptographic block sequence with hash chaining and disk persistence.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold">•</span>
              <span><strong>Tamper Verification:</strong> Automated integrity check validating each block's cryptographic hash against the previous block.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold">•</span>
              <span><strong>Audit Indexes:</strong> Compound indexes on user email and timestamp for sub-millisecond audit queries.</span>
            </li>
          </ul>
        </div>

        {/* Frontend Stack */}
        <div className="bg-slate-800/80 backdrop-blur-md p-6 rounded-2xl border border-slate-700/80 shadow-xl space-y-4">
          <div className="flex items-center gap-3 border-b border-slate-700 pb-3">
            <span className="text-2xl">💻</span>
            <h3 className="text-lg font-bold text-purple-400">Frontend & Client</h3>
          </div>
          <ul className="space-y-3 text-sm text-slate-300">
            <li className="flex items-start gap-2">
              <span className="text-purple-400 font-bold">•</span>
              <span><strong>React 19 & Vite:</strong> Ultra-fast hot module reloading and optimized bundle splitting.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-400 font-bold">•</span>
              <span><strong>Tailwind CSS:</strong> Polished dark-mode UI with glassmorphic cards and micro-animations.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-400 font-bold">•</span>
              <span><strong>CryptoJS:</strong> Client-side SHA-256 computation for end-to-end file integrity verification.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-400 font-bold">•</span>
              <span><strong>Axios Interceptors:</strong> Automatic bearer token injection and session expiration detection.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TechnologyTab;
