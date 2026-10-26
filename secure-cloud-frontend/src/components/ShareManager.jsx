import React, { useState, useEffect } from 'react';
import { shareAPI } from '../services/api';

const ShareManager = ({ showToast }) => {
  const [activeSubTab, setActiveSubTab] = useState('sent');
  const [myShares, setMyShares] = useState([]);
  const [receivedShares, setReceivedShares] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [downloadingToken, setDownloadingToken] = useState(null);

  const fetchShares = async () => {
    setLoading(true);
    try {
      const [sentRes, receivedRes] = await Promise.allSettled([
        shareAPI.getMyShares(),
        shareAPI.getReceivedShares(),
      ]);

      if (sentRes.status === 'fulfilled') setMyShares(sentRes.value.data || []);
      if (receivedRes.status === 'fulfilled') setReceivedShares(receivedRes.value.data || []);
    } catch (err) {
      console.error('Error fetching shares:', err);
      showToast?.('Failed to load shared files.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShares();
  }, []);

  const handleRevoke = async (shareId) => {
    if (!window.confirm('Are you sure you want to revoke access to this file? The recipient will immediately lose download permissions.')) {
      return;
    }
    try {
      const res = await shareAPI.revokeShare(shareId);
      showToast?.(res.data.message || 'Access revoked successfully.', 'success');
      fetchShares();
    } catch (err) {
      showToast?.(err.response?.data?.message || 'Failed to revoke access.', 'error');
    }
  };

  const handleDownloadReceived = async (share) => {
    setDownloadingToken(share.token);
    try {
      showToast?.(`Downloading ${share.fileId?.originalName || 'file'}...`, 'info');
      const res = await shareAPI.downloadSharedFile(share.token);
      const url = window.URL.createObjectURL(res.data);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', share.fileId?.originalName || 'shared-file');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      showToast?.('File downloaded successfully!', 'success');
      fetchShares(); // Update analytics count
    } catch (err) {
      console.error('Download error:', err);
      showToast?.(err.response?.data?.message || 'Failed to download shared file.', 'error');
    } finally {
      setDownloadingToken(null);
    }
  };

  const copyShareLink = (token) => {
    const link = `${window.location.origin}/download/${token}`;
    navigator.clipboard.writeText(link);
    showToast?.('Share link copied to clipboard!', 'success');
  };

  const isExpired = (expiresAt) => {
    if (!expiresAt) return false;
    return new Date() > new Date(expiresAt);
  };

  const filteredSent = myShares.filter((s) => {
    const nameMatch = s.fileId?.originalName?.toLowerCase().includes(searchQuery.toLowerCase());
    const recipientMatch = s.sharedWith?.toLowerCase().includes(searchQuery.toLowerCase());
    return nameMatch || recipientMatch;
  });

  const filteredReceived = receivedShares.filter((s) => {
    const nameMatch = s.fileId?.originalName?.toLowerCase().includes(searchQuery.toLowerCase());
    const senderMatch = s.sharedBy?.toLowerCase().includes(searchQuery.toLowerCase());
    return nameMatch || senderMatch;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-800/80 backdrop-blur-md p-6 rounded-2xl border border-slate-700/80 shadow-xl">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 text-transparent bg-clip-text flex items-center gap-2">
            <span>🔗</span> Secure File Share Management
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Track download analytics, inspect active grants, and revoke unauthorized links in real time.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <input
              type="text"
              placeholder="Filter by email or file..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 pl-9 rounded-xl bg-slate-900/80 text-white text-sm border border-slate-700 focus:outline-none focus:border-blue-500 transition"
            />
            <span className="absolute left-3 top-2.5 text-slate-400 text-xs">🔍</span>
          </div>
          <button
            onClick={fetchShares}
            className="px-3.5 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl text-sm transition border border-slate-600"
            title="Refresh shared files"
          >
            ↻
          </button>
        </div>
      </div>

      {/* Sub-Tabs: Sent vs Received */}
      <div className="flex border-b border-slate-700/80 space-x-4">
        <button
          onClick={() => setActiveSubTab('sent')}
          className={`pb-3 text-sm font-semibold transition-all relative ${
            activeSubTab === 'sent'
              ? 'text-blue-400 border-b-2 border-blue-400'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Sent by Me ({myShares.length})
        </button>
        <button
          onClick={() => setActiveSubTab('received')}
          className={`pb-3 text-sm font-semibold transition-all relative ${
            activeSubTab === 'received'
              ? 'text-emerald-400 border-b-2 border-emerald-400'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Received by Me ({receivedShares.length})
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="bg-slate-800/80 backdrop-blur-md p-12 rounded-2xl border border-slate-700/80 text-center text-slate-400">
          <svg className="animate-spin w-8 h-8 mx-auto mb-3 text-blue-500" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          Loading share links & permissions...
        </div>
      ) : activeSubTab === 'sent' ? (
        /* Sent Shares Table */
        filteredSent.length === 0 ? (
          <div className="bg-slate-800/80 backdrop-blur-md p-12 rounded-2xl border border-slate-700/80 text-center text-slate-400">
            <span className="text-4xl block mb-3">📤</span>
            <h3 className="text-lg font-bold text-white mb-1">No shared files found</h3>
            <p className="text-sm text-slate-400">
              {searchQuery ? 'Try matching another recipient or file.' : 'Files you share with other users will appear here.'}
            </p>
          </div>
        ) : (
          <div className="bg-slate-800/80 backdrop-blur-md rounded-2xl border border-slate-700/80 shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-900/60 text-xs uppercase text-slate-400 tracking-wider">
                  <tr>
                    <th className="px-6 py-3">File</th>
                    <th className="px-6 py-3">Recipient</th>
                    <th className="px-6 py-3">Analytics</th>
                    <th className="px-6 py-3">Expiration</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {filteredSent.map((s) => {
                    const expired = isExpired(s.expiresAt);
                    return (
                      <tr key={s._id} className="hover:bg-slate-700/30 transition">
                        <td className="px-6 py-4 font-medium text-white flex items-center gap-2">
                          <span>📄</span>
                          <span>{s.fileId?.originalName || 'Deleted File'}</span>
                        </td>
                        <td className="px-6 py-4 text-slate-300 font-mono text-xs">{s.sharedWith}</td>
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-1 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-md text-xs font-semibold">
                            📥 {s.downloadCount || 0} downloads
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {s.expiresAt ? (
                            <span
                              className={`px-2 py-0.5 rounded text-xs font-medium ${
                                expired
                                  ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                                  : 'bg-slate-700 text-slate-300'
                              }`}
                            >
                              {expired ? 'Expired ⏰' : new Date(s.expiresAt).toLocaleString()}
                            </span>
                          ) : (
                            <span className="text-slate-500 text-xs">No expiration</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          <button
                            onClick={() => copyShareLink(s.token)}
                            className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-xs font-semibold transition"
                            title="Copy link"
                          >
                            Copy Link
                          </button>
                          <button
                            onClick={() => handleRevoke(s._id)}
                            className="px-3 py-1.5 bg-red-600/80 hover:bg-red-600 text-white rounded-lg text-xs font-semibold transition shadow"
                            title="Revoke access"
                          >
                            Revoke
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : (
        /* Received Shares Table */
        filteredReceived.length === 0 ? (
          <div className="bg-slate-800/80 backdrop-blur-md p-12 rounded-2xl border border-slate-700/80 text-center text-slate-400">
            <span className="text-4xl block mb-3">📥</span>
            <h3 className="text-lg font-bold text-white mb-1">No received files</h3>
            <p className="text-sm text-slate-400">
              When other users grant you access to files, they will appear here ready to decrypt and download.
            </p>
          </div>
        ) : (
          <div className="bg-slate-800/80 backdrop-blur-md rounded-2xl border border-slate-700/80 shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-900/60 text-xs uppercase text-slate-400 tracking-wider">
                  <tr>
                    <th className="px-6 py-3">File</th>
                    <th className="px-6 py-3">Shared By</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {filteredReceived.map((s) => {
                    const expired = isExpired(s.expiresAt);
                    return (
                      <tr key={s._id} className="hover:bg-slate-700/30 transition">
                        <td className="px-6 py-4 font-medium text-white flex items-center gap-2">
                          <span>📄</span>
                          <span>{s.fileId?.originalName || 'Shared Document'}</span>
                        </td>
                        <td className="px-6 py-4 text-slate-300 font-mono text-xs">{s.sharedBy}</td>
                        <td className="px-6 py-4">
                          {expired ? (
                            <span className="px-2.5 py-0.5 bg-red-500/20 text-red-300 border border-red-500/30 rounded text-xs font-semibold">
                              Expired
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded text-xs font-semibold">
                              Active
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleDownloadReceived(s)}
                            disabled={expired || downloadingToken === s.token}
                            className="px-4 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 text-white rounded-lg text-xs font-semibold transition shadow-md"
                          >
                            {downloadingToken === s.token ? 'Decrypting...' : 'Download & Decrypt'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}
    </div>
  );
};

export default ShareManager;
