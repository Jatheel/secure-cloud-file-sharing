import React, { useState } from 'react';
import CryptoJS from 'crypto-js';

const IntegrityVerifier = ({ showToast }) => {
  const [fileA, setFileA] = useState(null);
  const [hashA, setHashA] = useState('');
  const [calculatingA, setCalculatingA] = useState(false);

  const [fileB, setFileB] = useState(null);
  const [hashB, setHashB] = useState('');
  const [calculatingB, setCalculatingB] = useState(false);

  const calculateHash = (file, setHash, setCalculating) => {
    if (!file) return;
    setCalculating(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wordArray = CryptoJS.lib.WordArray.create(e.target.result);
        const hash = CryptoJS.SHA256(wordArray).toString();
        setHash(hash);
      } catch (err) {
        console.error(err);
        showToast?.('Failed to calculate SHA-256 hash.', 'error');
      } finally {
        setCalculating(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleFileA = (e) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      setFileA(f);
      calculateHash(f, setHashA, setCalculatingA);
    }
  };

  const handleFileB = (e) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      setFileB(f);
      calculateHash(f, setHashB, setCalculatingB);
    }
  };

  const isMatched = hashA && hashB && hashA === hashB;

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      <div className="bg-slate-800/80 backdrop-blur-md p-8 rounded-2xl border border-slate-700/80 shadow-xl space-y-6">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 text-transparent bg-clip-text flex items-center gap-2">
            <span>🔬</span> Client-Side File Integrity Verifier
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Compute independent SHA-256 cryptographic digests in your browser to verify that downloaded files are 100% byte-for-byte identical to the original.
          </p>
        </div>

        {/* Verification Result Banner */}
        {hashA && hashB && (
          <div
            className={`p-5 rounded-2xl border text-sm flex items-center gap-3 animate-bounce-in ${
              isMatched
                ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-300'
                : 'bg-red-950/60 border-red-500/60 text-red-300'
            }`}
          >
            <span className="text-3xl">{isMatched ? '✅' : '⚠️'}</span>
            <div>
              <div className="font-bold text-base">
                {isMatched
                  ? 'Cryptographic Hash Match: File is 100% Authentic & Untampered!'
                  : 'Tampering Detected: File Hashes Do NOT Match!'}
              </div>
              <p className="text-xs mt-0.5 opacity-90">
                {isMatched
                  ? 'Both cryptographic SHA-256 digests are completely identical.'
                  : 'The file contents have been modified or corrupted in transit.'}
              </p>
            </div>
          </div>
        )}

        {/* Two Columns: File A vs File B */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* File 1: Original */}
          <div className="p-5 bg-slate-900/60 rounded-xl border border-slate-700/70 space-y-4">
            <h3 className="font-semibold text-white text-sm flex items-center gap-2">
              <span>📄</span> Original Document (Pre-Upload)
            </h3>

            <input
              type="file"
              onChange={handleFileA}
              className="block w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500 cursor-pointer"
            />

            {fileA && (
              <div className="text-xs space-y-1.5 pt-2">
                <div className="text-slate-300 font-medium">{fileA.name}</div>
                <div className="text-slate-500 font-mono text-[11px] break-all bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  {calculatingA ? 'Computing SHA-256 digest...' : hashA || 'No hash calculated'}
                </div>
              </div>
            )}
          </div>

          {/* File 2: Downloaded */}
          <div className="p-5 bg-slate-900/60 rounded-xl border border-slate-700/70 space-y-4">
            <h3 className="font-semibold text-white text-sm flex items-center gap-2">
              <span>📥</span> Downloaded Document (Post-Decryption)
            </h3>

            <input
              type="file"
              onChange={handleFileB}
              className="block w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-600 file:text-white hover:file:bg-emerald-500 cursor-pointer"
            />

            {fileB && (
              <div className="text-xs space-y-1.5 pt-2">
                <div className="text-slate-300 font-medium">{fileB.name}</div>
                <div className="text-slate-500 font-mono text-[11px] break-all bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  {calculatingB ? 'Computing SHA-256 digest...' : hashB || 'No hash calculated'}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntegrityVerifier;
