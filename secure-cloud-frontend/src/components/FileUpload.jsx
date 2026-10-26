import React, { useState, useRef } from 'react';
import { fileAPI } from '../services/api';

const formatBytes = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const FileUpload = ({ showToast, onUploadSuccess }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [lastUploadedResult, setLastUploadedResult] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setLastUploadedResult(null);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setLastUploadedResult(null);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      showToast?.('Please select or drop a file to upload.', 'warning');
      return;
    }

    setUploading(true);
    setUploadProgress(20);

    try {
      const formData = new FormData();
      formData.append('file', file);

      setUploadProgress(60);
      const res = await fileAPI.uploadFile(formData);
      setUploadProgress(100);

      setLastUploadedResult(res.data);
      showToast?.('File encrypted and uploaded successfully!', 'success');
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      onUploadSuccess?.();
    } catch (err) {
      console.error('Upload failed:', err);
      const msg = err.response?.data?.message || err.message || 'File upload failed.';
      showToast?.(msg, 'error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl mx-auto">
      {/* Upload Card */}
      <div className="bg-slate-800/80 backdrop-blur-md p-8 rounded-2xl border border-slate-700/80 shadow-xl space-y-6">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 text-transparent bg-clip-text flex items-center gap-2">
            <span>⬆️</span> Encrypted Cloud Storage Upload
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Files are automatically encrypted with AES-256 before disk storage and linked to the cryptographic blockchain.
          </p>
        </div>

        {/* Drag & Drop Zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-emerald-400 bg-emerald-500/10'
              : 'border-slate-600 hover:border-slate-500 bg-slate-900/40 hover:bg-slate-900/60'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileChange}
            accept=".pdf,.docx,.jpg,.png"
            className="hidden"
          />

          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-500/20 to-emerald-500/20 border border-blue-500/30 flex items-center justify-center text-3xl">
            📁
          </div>

          <h3 className="text-base font-semibold text-white mb-1">
            {file ? file.name : 'Click to select or drag and drop file here'}
          </h3>
          <p className="text-xs text-slate-400">
            {file
              ? `Size: ${formatBytes(file.size)} | Ready for encryption`
              : 'Supports PDF, DOCX, JPG, and PNG files up to 25MB'}
          </p>
        </div>

        {/* Selected File Details */}
        {file && (
          <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📄</span>
              <div>
                <div className="text-sm font-semibold text-white">{file.name}</div>
                <div className="text-xs text-slate-400">{formatBytes(file.size)}</div>
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setFile(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
              className="text-slate-400 hover:text-red-400 text-sm font-bold p-1"
            >
              ✕
            </button>
          </div>
        )}

        {/* Upload Button */}
        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 disabled:opacity-40 text-white font-semibold rounded-xl transition shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
        >
          {uploading ? (
            <>
              <svg className="animate-spin w-5 h-5 text-white" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <span>Encrypting & Storing ({uploadProgress}%)...</span>
            </>
          ) : (
            <span>Encrypt & Upload to Vault</span>
          )}
        </button>

        {/* Success Block Confirmation */}
        {lastUploadedResult && (
          <div className="p-5 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-xs space-y-2 text-emerald-300 animate-fade-in">
            <div className="font-bold text-sm flex items-center gap-2 text-emerald-400">
              <span>✅</span> File Encrypted & Ledger Block Created!
            </div>
            <div>
              <strong>Original Name:</strong> {lastUploadedResult.fileInfo?.originalName}
            </div>
            {lastUploadedResult.blockchain && (
              <div className="space-y-1 font-mono text-[11px] bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                <div>
                  <strong>Block #{lastUploadedResult.blockchain.index}</strong>
                </div>
                <div className="truncate text-slate-300">
                  Hash: {lastUploadedResult.blockchain.hash}
                </div>
                <div className="truncate text-slate-400">
                  Prev: {lastUploadedResult.blockchain.previousHash}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUpload;
