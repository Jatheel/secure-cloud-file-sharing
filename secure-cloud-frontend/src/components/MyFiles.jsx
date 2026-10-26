import React, { useState, useEffect } from 'react';
import { fileAPI, shareAPI } from '../services/api';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const formatBytes = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const MyFiles = ({ showToast, onNavigateUpload }) => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Quick Share Modal state
  const [shareModalFile, setShareModalFile] = useState(null);
  const [shareEmail, setShareEmail] = useState('');
  const [shareExpiry, setShareExpiry] = useState(null);
  const [sharing, setSharing] = useState(false);
  const [generatedLink, setGeneratedLink] = useState('');

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const res = await fileAPI.getMyFiles();
      setFiles(res.data || []);
    } catch (err) {
      console.error('Error fetching my files:', err);
      showToast?.('Failed to fetch your uploaded files.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleDownload = async (file) => {
    try {
      showToast?.(`Downloading ${file.originalName}...`, 'info');
      const res = await fileAPI.downloadFileDirect(file._id);
      const url = window.URL.createObjectURL(res.data);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', file.originalName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      showToast?.(`Downloaded ${file.originalName} successfully!`, 'success');
    } catch (err) {
      console.error('Download error:', err);
      showToast?.(err.response?.data?.message || 'Direct download failed.', 'error');
    }
  };

  const handleDelete = async (file) => {
    if (!window.confirm(`Delete "${file.originalName}" permanently? This will also remove access from all share links.`)) {
      return;
    }
    try {
      await fileAPI.deleteFile(file._id);
      showToast?.('File deleted successfully.', 'success');
      fetchFiles();
    } catch (err) {
      showToast?.(err.response?.data?.message || 'Failed to delete file.', 'error');
    }
  };

  const handleOpenShare = (file) => {
    setShareModalFile(file);
    setShareEmail('');
    setShareExpiry(null);
    setGeneratedLink('');
  };

  const handleCreateShare = async (e) => {
    e.preventDefault();
    if (!shareModalFile || !shareEmail) return;

    setSharing(true);
    try {
      const expiryIso = shareExpiry ? shareExpiry.toISOString() : null;
      const res = await shareAPI.createShare(shareModalFile._id, shareEmail, expiryIso);
      const link = `${window.location.origin}/download/${res.data.token}`;
      setGeneratedLink(link);
      showToast?.(res.data.message || 'Share link generated successfully!', 'success');
    } catch (err) {
      showToast?.(err.response?.data?.message || 'Failed to share file.', 'error');
    } finally {
      setSharing(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    showToast?.('Shareable link copied to clipboard!', 'success');
  };

  const filteredFiles = files.filter((f) =>
    f.originalName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Bar with Search and Add File */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-800/80 backdrop-blur-md p-6 rounded-2xl border border-slate-700/80 shadow-xl">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 text-transparent bg-clip-text flex items-center gap-2">
            <span>📁</span> My Encrypted Vault
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Browse your AES-256 encrypted files and manage recipient access rights.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <input
              type="text"
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 pl-9 rounded-xl bg-slate-900/80 text-white text-sm border border-slate-700 focus:outline-none focus:border-blue-500 transition"
            />
            <span className="absolute left-3 top-2.5 text-slate-400 text-xs">🔍</span>
          </div>
          <button
            onClick={onNavigateUpload}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-white rounded-xl text-sm font-semibold transition shadow-md whitespace-nowrap"
          >
            + Upload
          </button>
        </div>
      </div>

      {/* Files List / Cards */}
      {loading ? (
        <div className="bg-slate-800/80 backdrop-blur-md p-12 rounded-2xl border border-slate-700/80 text-center text-slate-400">
          <svg className="animate-spin w-8 h-8 mx-auto mb-3 text-blue-500" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          Loading your files from vault...
        </div>
      ) : filteredFiles.length === 0 ? (
        <div className="bg-slate-800/80 backdrop-blur-md p-12 rounded-2xl border border-slate-700/80 text-center text-slate-400">
          <span className="text-4xl block mb-3">📭</span>
          <h3 className="text-lg font-bold text-white mb-1">
            {searchQuery ? 'No files match your search' : 'Your vault is currently empty'}
          </h3>
          <p className="text-sm text-slate-400 mb-6">
            {searchQuery
              ? 'Try adjusting your search query keyword.'
              : 'Upload a document or image to securely store and share it.'}
          </p>
          {!searchQuery && (
            <button
              onClick={onNavigateUpload}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition shadow-lg"
            >
              Upload Your First File
            </button>
          )}
        </div>
      ) : (
        <div className="bg-slate-800/80 backdrop-blur-md rounded-2xl border border-slate-700/80 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/60 text-xs uppercase text-slate-400 tracking-wider">
                <tr>
                  <th className="px-6 py-3">File Name</th>
                  <th className="px-6 py-3">Size</th>
                  <th className="px-6 py-3">Security Level</th>
                  <th className="px-6 py-3">Upload Date</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {filteredFiles.map((file) => (
                  <tr key={file._id} className="hover:bg-slate-700/30 transition">
                    <td className="px-6 py-4 font-medium text-white flex items-center gap-3">
                      <span className="text-xl">📄</span>
                      <div>
                        <div className="font-semibold text-slate-100">{file.originalName}</div>
                        <div className="text-xs text-slate-500 font-mono">{file.filename}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-300">{formatBytes(file.size)}</td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-md text-xs font-medium flex items-center gap-1.5 w-fit">
                        <span>🔒</span> AES-256 At-Rest
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-xs">
                      {new Date(file.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => handleDownload(file)}
                        className="px-3 py-1.5 bg-blue-600/80 hover:bg-blue-600 text-white rounded-lg text-xs font-semibold transition shadow-sm"
                        title="Download decrypted file"
                      >
                        Download
                      </button>
                      <button
                        onClick={() => handleOpenShare(file)}
                        className="px-3 py-1.5 bg-emerald-600/80 hover:bg-emerald-600 text-white rounded-lg text-xs font-semibold transition shadow-sm"
                        title="Generate secure share link"
                      >
                        Share
                      </button>
                      <button
                        onClick={() => handleDelete(file)}
                        className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white rounded-lg text-xs font-semibold transition border border-red-500/30"
                        title="Permanently delete file"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Quick Share Modal */}
      {shareModalFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-5">
            <div className="flex justify-between items-center border-b border-slate-700 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>🔗</span> Secure Share: {shareModalFile.originalName}
              </h3>
              <button
                onClick={() => setShareModalFile(null)}
                className="text-slate-400 hover:text-white transition"
              >
                ✕
              </button>
            </div>

            {!generatedLink ? (
              <form onSubmit={handleCreateShare} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                    Recipient Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="recipient@example.com"
                    value={shareEmail}
                    onChange={(e) => setShareEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 text-white border border-slate-700 text-sm focus:outline-none focus:border-emerald-500"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Only this specific user will be able to decrypt and download the shared file.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                    Expiration Time (Optional)
                  </label>
                  <DatePicker
                    selected={shareExpiry}
                    onChange={(date) => setShareExpiry(date)}
                    showTimeSelect
                    dateFormat="Pp"
                    minDate={new Date()}
                    placeholderText="Select expiration date & time"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 text-white border border-slate-700 text-sm focus:outline-none focus:border-emerald-500"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    After this timestamp, the link will automatically self-expire.
                  </p>
                </div>

                <div className="flex justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setShareModalFile(null)}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl text-sm transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={sharing}
                    className="px-5 py-2 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-white rounded-xl text-sm font-semibold transition disabled:opacity-50"
                  >
                    {sharing ? 'Generating...' : 'Generate Share Link'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-emerald-300 text-sm">
                  ✅ Secure link created! Only <strong>{shareEmail}</strong> can access this file.
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                    Shareable Link
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={generatedLink}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 text-white border border-slate-700 text-xs font-mono select-all"
                    />
                    <button
                      onClick={() => copyToClipboard(generatedLink)}
                      className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition shrink-0"
                    >
                      Copy
                    </button>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => setShareModalFile(null)}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-sm transition"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MyFiles;
