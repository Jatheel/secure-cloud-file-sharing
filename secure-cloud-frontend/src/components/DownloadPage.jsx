import React, { useState, useEffect } from 'react';
import { shareAPI } from '../services/api';
import LoginPage from '../LoginPage';

const DownloadPage = ({ token, setToken, setUserEmail, setUserRoles, showToast }) => {
  const [shareDetails, setShareDetails] = useState(null);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));

  const fetchDetails = async () => {
    if (!token) return;
    try {
      setError('');
      const res = await shareAPI.getShareDetails(token);
      setShareDetails(res.data);
    } catch (err) {
      console.error('Error fetching share details:', err);
      const msg = err.response?.data?.message || 'Access Denied: You may not be the authorized recipient.';
      setError(msg);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchDetails();
    }
  }, [isLoggedIn, token]);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      showToast?.('Verifying recipient credentials & decrypting...', 'info');
      const res = await shareAPI.downloadSharedFile(token);
      const url = window.URL.createObjectURL(res.data);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', shareDetails?.originalName || 'secure-shared-file');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      showToast?.('File decrypted and downloaded successfully!', 'success');
      // Update download count in UI
      setShareDetails((prev) => prev ? { ...prev, downloadCount: (prev.downloadCount || 0) + 1 } : null);
    } catch (err) {
      console.error('Download error:', err);
      const msg = err.response?.data?.message || 'Download failed. Verify that you are signed in with the authorized recipient email.';
      setError(msg);
      showToast?.(msg, 'error');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="py-20 px-4 relative z-10 max-w-2xl mx-auto text-center">
      <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-emerald-400 text-transparent bg-clip-text">
        Secure Decrypted File Download
      </h2>
      <p className="text-slate-400 text-sm mb-8">
        Protected by end-to-end access validation and blockchain-based audit verification.
      </p>

      {error && (
        <div className="mb-6 p-4 bg-red-950/60 border border-red-500/60 rounded-xl text-red-300 text-sm text-left flex items-start gap-3">
          <span className="text-xl">⚠️</span>
          <div>
            <div className="font-semibold">Access Restriction</div>
            <div>{error}</div>
          </div>
        </div>
      )}

      {!isLoggedIn ? (
        <div className="bg-slate-800/80 backdrop-blur-md p-8 rounded-2xl border border-slate-700/80 shadow-2xl">
          <p className="mb-6 text-sm text-slate-300">
            A secured document has been shared with you. Please sign in with your recipient account to authorize and decrypt.
          </p>
          <LoginPage
            onLogin={() => setIsLoggedIn(true)}
            setToken={setToken}
            setUserEmail={setUserEmail}
            setUserRoles={setUserRoles}
          />
        </div>
      ) : (
        <div className="bg-slate-800/80 backdrop-blur-md p-8 rounded-2xl border border-slate-700/80 shadow-2xl space-y-6">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-3xl">
            🔒
          </div>

          <div>
            <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-1">
              File Ready for Download
            </div>
            <div className="text-xl font-bold text-emerald-400 break-words">
              {shareDetails?.originalName || (error ? 'Access Restricted' : 'Loading file details...')}
            </div>
          </div>

          {shareDetails && (
            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 text-xs text-slate-300 grid grid-cols-2 gap-3 text-left">
              <div>
                <span className="text-slate-500 block">Shared By:</span>
                <span className="font-medium text-white">{shareDetails.sharedBy}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Download Analytics:</span>
                <span className="font-medium text-blue-400">{shareDetails.downloadCount || 0} previous downloads</span>
              </div>
              {shareDetails.expiresAt && (
                <div className="col-span-2">
                  <span className="text-slate-500 block">Expires:</span>
                  <span className="font-medium text-amber-400">
                    {new Date(shareDetails.expiresAt).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          )}

          <button
            onClick={handleDownload}
            disabled={downloading || !shareDetails}
            className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 text-white font-semibold rounded-xl transition shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2"
          >
            {downloading ? (
              <>
                <svg className="animate-spin w-5 h-5 text-white" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <span>Decrypting & Streaming...</span>
              </>
            ) : (
              <span>Download & Decrypt File</span>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default DownloadPage;
