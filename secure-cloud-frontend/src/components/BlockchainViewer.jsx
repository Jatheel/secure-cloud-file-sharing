import React, { useState, useEffect } from 'react';
import { auditAPI } from '../services/api';

const BlockchainViewer = ({ showToast }) => {
  const [chainData, setChainData] = useState({ chain: [], isValid: true, totalBlocks: 0 });
  const [loading, setLoading] = useState(true);
  const [expandedBlock, setExpandedBlock] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchBlockchain = async () => {
    setLoading(true);
    try {
      const res = await auditAPI.getBlockchain();
      if (Array.isArray(res.data)) {
        setChainData({ chain: res.data, isValid: true, totalBlocks: res.data.length });
      } else {
        setChainData(res.data || { chain: [], isValid: true, totalBlocks: 0 });
      }
    } catch (err) {
      console.error('Error fetching blockchain:', err);
      showToast?.('Failed to load blockchain ledger.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlockchain();
  }, []);

  const filteredChain = chainData.chain.filter((block) => {
    const dataStr = JSON.stringify(block.data).toLowerCase();
    const hashStr = (block.hash || '').toLowerCase();
    const prevStr = (block.previousHash || '').toLowerCase();
    const query = searchTerm.toLowerCase();
    return dataStr.includes(query) || hashStr.includes(query) || prevStr.includes(query);
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-800/80 backdrop-blur-md p-6 rounded-2xl border border-slate-700/80 shadow-xl">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 text-transparent bg-clip-text flex items-center gap-2">
            <span>⛓️</span> Cryptographic Audit Blockchain
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Immutable SHA-256 linked blocks persisting all critical file operations and access events.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <input
              type="text"
              placeholder="Search by hash or data..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 pl-9 rounded-xl bg-slate-900/80 text-white text-sm border border-slate-700 focus:outline-none focus:border-blue-500 transition"
            />
            <span className="absolute left-3 top-2.5 text-slate-400 text-xs">🔍</span>
          </div>

          <button
            onClick={fetchBlockchain}
            className="px-3.5 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl text-sm transition border border-slate-600"
            title="Refresh blockchain"
          >
            ↻
          </button>
        </div>
      </div>

      {/* Ledger Status Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-800/80 backdrop-blur-md p-4 rounded-xl border border-slate-700/70 shadow-lg flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-2xl">
            {chainData.isValid ? '🛡️' : '⚠️'}
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Ledger Health</div>
            <div className={`text-lg font-bold ${chainData.isValid ? 'text-emerald-400' : 'text-red-400'}`}>
              {chainData.isValid ? 'Chain Valid & Untampered' : 'Tamper Detected!'}
            </div>
          </div>
        </div>

        <div className="bg-slate-800/80 backdrop-blur-md p-4 rounded-xl border border-slate-700/70 shadow-lg flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-2xl">
            📦
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Total Blocks</div>
            <div className="text-lg font-bold text-white">{chainData.totalBlocks || chainData.chain.length}</div>
          </div>
        </div>

        <div className="bg-slate-800/80 backdrop-blur-md p-4 rounded-xl border border-slate-700/70 shadow-lg flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-2xl">
            💾
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Persistence Engine</div>
            <div className="text-lg font-bold text-white">Disk JSON + SHA-256</div>
          </div>
        </div>
      </div>

      {/* Blocks Visual Chain */}
      {loading ? (
        <div className="bg-slate-800/80 backdrop-blur-md p-12 rounded-2xl border border-slate-700/80 text-center text-slate-400">
          <svg className="animate-spin w-8 h-8 mx-auto mb-3 text-blue-500" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          Loading blockchain blocks...
        </div>
      ) : filteredChain.length === 0 ? (
        <div className="bg-slate-800/80 backdrop-blur-md p-12 rounded-2xl border border-slate-700/80 text-center text-slate-400">
          No blocks match your search keyword.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredChain.map((block, idx) => {
            const isGenesis = block.index === 0;
            const isExpanded = expandedBlock === block.index;

            return (
              <div
                key={block.index || idx}
                className="bg-slate-800/80 backdrop-blur-md rounded-2xl border border-slate-700/80 shadow-lg overflow-hidden transition-all hover:border-slate-600"
              >
                <div
                  onClick={() => setExpandedBlock(isExpanded ? null : block.index)}
                  className="p-5 cursor-pointer flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 select-none"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-3 py-1 rounded-xl text-xs font-bold uppercase ${
                        isGenesis
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                      }`}
                    >
                      Block #{block.index}
                    </span>
                    <span className="text-sm font-semibold text-white">
                      {isGenesis
                        ? 'Genesis Block'
                        : block.data?.event || (typeof block.data === 'string' ? block.data : 'Audit Event')}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span className="font-mono bg-slate-900/60 px-2.5 py-1 rounded-lg border border-slate-700/50">
                      Hash: {block.hash ? `${block.hash.substring(0, 10)}...${block.hash.substring(block.hash.length - 8)}` : 'N/A'}
                    </span>
                    <span className="text-slate-500">
                      {new Date(block.timestamp).toLocaleString()}
                    </span>
                    <span className="text-slate-400 text-sm">{isExpanded ? '▲' : '▼'}</span>
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-5 pb-5 pt-2 border-t border-slate-700/60 bg-slate-900/40 space-y-3 animate-fade-in text-xs font-mono">
                    <div>
                      <span className="text-slate-400 block font-semibold mb-1">CURRENT BLOCK HASH (SHA-256):</span>
                      <div className="p-2 bg-slate-950/80 text-emerald-400 rounded-lg break-all border border-slate-800">
                        {block.hash}
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-400 block font-semibold mb-1">PREVIOUS BLOCK HASH:</span>
                      <div className="p-2 bg-slate-950/80 text-blue-400 rounded-lg break-all border border-slate-800">
                        {block.previousHash || '0'}
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-400 block font-semibold mb-1">PAYLOAD DATA:</span>
                      <pre className="p-3 bg-slate-950/80 text-slate-300 rounded-lg overflow-x-auto border border-slate-800 font-sans text-xs">
                        {JSON.stringify(block.data, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default BlockchainViewer;
