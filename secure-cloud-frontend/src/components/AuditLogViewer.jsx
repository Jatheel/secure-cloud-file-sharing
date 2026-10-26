import React, { useState, useEffect } from 'react';
import { auditAPI } from '../services/api';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const AuditLogViewer = ({ showToast }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [filterEmail, setFilterEmail] = useState('');
  const [filterAction, setFilterAction] = useState('');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [selectedLog, setSelectedLog] = useState(null);

  const fetchLogs = async (currentPage = page) => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: 20,
      };
      if (filterEmail) params.userEmail = filterEmail;
      if (filterAction) params.action = filterAction;
      if (startDate) params.startDate = startDate.toISOString();
      if (endDate) params.endDate = endDate.toISOString();

      const res = await auditAPI.getAuditLogs(params);
      setLogs(res.data?.logs || []);
      setTotalPages(res.data?.totalPages || 1);
      setPage(res.data?.currentPage || 1);
    } catch (err) {
      console.error('Error fetching audit logs:', err);
      showToast?.('Could not retrieve audit logs.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(1);
  }, []);

  const handleApplyFilter = (e) => {
    e.preventDefault();
    fetchLogs(1);
  };

  const handleResetFilter = () => {
    setFilterEmail('');
    setFilterAction('');
    setStartDate(null);
    setEndDate(null);
    setTimeout(() => {
      fetchLogs(1);
    }, 50);
  };

  const getActionBadge = (action, success) => {
    if (success === false || action.includes('FAILED') || action.includes('DENIED')) {
      return (
        <span className="px-2.5 py-1 bg-red-500/20 text-red-300 border border-red-500/30 rounded-md text-xs font-semibold uppercase flex items-center gap-1 w-fit">
          <span>❌</span> {action}
        </span>
      );
    }
    if (action.includes('UPLOAD')) {
      return (
        <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-md text-xs font-semibold uppercase flex items-center gap-1 w-fit">
          <span>⬆️</span> {action}
        </span>
      );
    }
    if (action.includes('SHARE')) {
      return (
        <span className="px-2.5 py-1 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-md text-xs font-semibold uppercase flex items-center gap-1 w-fit">
          <span>🔗</span> {action}
        </span>
      );
    }
    if (action.includes('DOWNLOAD')) {
      return (
        <span className="px-2.5 py-1 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-md text-xs font-semibold uppercase flex items-center gap-1 w-fit">
          <span>⬇️</span> {action}
        </span>
      );
    }
    if (action.includes('REVOKE') || action.includes('DELETE')) {
      return (
        <span className="px-2.5 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-md text-xs font-semibold uppercase flex items-center gap-1 w-fit">
          <span>🗑️</span> {action}
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 bg-slate-700 text-slate-300 rounded-md text-xs font-semibold uppercase">
        {action}
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-slate-800/80 backdrop-blur-md p-6 rounded-2xl border border-slate-700/80 shadow-xl">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 text-transparent bg-clip-text flex items-center gap-2">
          <span>📜</span> Security Audit Trail
        </h2>
        <p className="text-slate-400 text-sm mt-1">
          Cryptographically recorded actions with IP addresses, timestamps, and metadata payloads.
        </p>

        {/* Filters Form */}
        <form onSubmit={handleApplyFilter} className="mt-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block text-slate-400 font-semibold mb-1">USER EMAIL</label>
            <input
              type="text"
              placeholder="e.g. user@domain.com"
              value={filterEmail}
              onChange={(e) => setFilterEmail(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 text-white border border-slate-700 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">EVENT TYPE</label>
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 text-white border border-slate-700 focus:outline-none focus:border-blue-500"
            >
              <option value="">All Security Events</option>
              <option value="UPLOAD">UPLOAD</option>
              <option value="SHARE_FILE">SHARE_FILE</option>
              <option value="DOWNLOAD_VIA_LINK">DOWNLOAD_VIA_LINK</option>
              <option value="DOWNLOAD_DIRECT">DOWNLOAD_DIRECT</option>
              <option value="REVOKE_ACCESS">REVOKE_ACCESS</option>
              <option value="DELETE_FILE">DELETE_FILE</option>
              <option value="DOWNLOAD_ACCESS_DENIED">DOWNLOAD_ACCESS_DENIED</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">FROM DATE</label>
            <DatePicker
              selected={startDate}
              onChange={(d) => setStartDate(d)}
              placeholderText="Start date"
              className="w-full px-3 py-2 rounded-xl bg-slate-900 text-white border border-slate-700 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">TO DATE</label>
            <DatePicker
              selected={endDate}
              onChange={(d) => setEndDate(d)}
              placeholderText="End date"
              className="w-full px-3 py-2 rounded-xl bg-slate-900 text-white border border-slate-700 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="sm:col-span-2 md:col-span-4 flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={handleResetFilter}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl text-xs font-semibold transition"
            >
              Reset
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition shadow"
            >
              Apply Filters
            </button>
          </div>
        </form>
      </div>

      {/* Logs Table */}
      {loading ? (
        <div className="bg-slate-800/80 backdrop-blur-md p-12 rounded-2xl border border-slate-700/80 text-center text-slate-400">
          <svg className="animate-spin w-8 h-8 mx-auto mb-3 text-blue-500" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          Loading audit trail records...
        </div>
      ) : logs.length === 0 ? (
        <div className="bg-slate-800/80 backdrop-blur-md p-12 rounded-2xl border border-slate-700/80 text-center text-slate-400">
          No audit log events match your filter criteria.
        </div>
      ) : (
        <div className="bg-slate-800/80 backdrop-blur-md rounded-2xl border border-slate-700/80 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/60 text-xs uppercase text-slate-400 tracking-wider">
                <tr>
                  <th className="px-6 py-3">Event Action</th>
                  <th className="px-6 py-3">User</th>
                  <th className="px-6 py-3">Client IP</th>
                  <th className="px-6 py-3">Timestamp</th>
                  <th className="px-6 py-3 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {logs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-700/30 transition">
                    <td className="px-6 py-4">{getActionBadge(log.action, log.success)}</td>
                    <td className="px-6 py-4 font-medium text-white">{log.userEmail || 'System'}</td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-400">{log.ip || '127.0.0.1'}</td>
                    <td className="px-6 py-4 text-xs text-slate-400">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {log.meta ? (
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-xs font-medium transition"
                        >
                          Inspect Meta
                        </button>
                      ) : (
                        <span className="text-slate-500 text-xs">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-4 border-t border-slate-700/70 bg-slate-900/40 flex justify-between items-center text-xs text-slate-400">
            <div>
              Page <span className="font-semibold text-white">{page}</span> of{' '}
              <span className="font-semibold text-white">{totalPages}</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => fetchLogs(page - 1)}
                disabled={page <= 1}
                className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition disabled:opacity-40"
              >
                Previous
              </button>
              <button
                onClick={() => fetchLogs(page + 1)}
                disabled={page >= totalPages}
                className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Meta Inspection Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-700 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>🔍</span> Audit Event Metadata
              </h3>
              <button onClick={() => setSelectedLog(null)} className="text-slate-400 hover:text-white transition">
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Action:</span>
                <span className="font-bold text-white">{selectedLog.action}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Initiator:</span>
                <span className="font-mono text-white">{selectedLog.userEmail}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Timestamp:</span>
                <span className="text-white">{new Date(selectedLog.timestamp).toLocaleString()}</span>
              </div>
            </div>

            <pre className="p-3 bg-slate-950 rounded-xl text-emerald-400 overflow-x-auto text-xs font-mono border border-slate-800">
              {JSON.stringify(selectedLog.meta, null, 2)}
            </pre>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs font-semibold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLogViewer;
