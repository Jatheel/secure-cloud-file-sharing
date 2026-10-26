import React, { useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AdminDashboard = ({ showToast }) => {
  const [stats, setStats] = useState(null);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [statsRes, pendingRes, usersRes] = await Promise.allSettled([
        authAPI.getAdminStats(),
        authAPI.getPendingUsers(),
        authAPI.getAllUsers(),
      ]);

      if (statsRes.status === 'fulfilled') setStats(statsRes.value.data);
      if (pendingRes.status === 'fulfilled') setPendingUsers(pendingRes.value.data || []);
      if (usersRes.status === 'fulfilled') setAllUsers(usersRes.value.data || []);
    } catch (err) {
      console.error('Failed to load admin data:', err);
      showToast?.('Could not load all admin dashboard metrics.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleApprove = async (userId) => {
    setActionLoading(`approve-${userId}`);
    try {
      await authAPI.approveUser(userId);
      showToast?.('User successfully approved!', 'success');
      loadAdminData();
    } catch (err) {
      showToast?.(err.response?.data?.message || 'Failed to approve user', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (userId) => {
    setActionLoading(`reject-${userId}`);
    try {
      await authAPI.rejectUser(userId);
      showToast?.('User request rejected.', 'info');
      loadAdminData();
    } catch (err) {
      showToast?.(err.response?.data?.message || 'Failed to reject user', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteUser = async (userId, email) => {
    if (!window.confirm(`Are you sure you want to delete user ${email}?`)) return;
    setActionLoading(`delete-${userId}`);
    try {
      await authAPI.deleteUser(userId);
      showToast?.(`User ${email} deleted.`, 'success');
      loadAdminData();
    } catch (err) {
      showToast?.(err.response?.data?.message || 'Failed to delete user', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleRole = async (userId, currentRoles) => {
    const isCurrentlyAdmin = currentRoles.includes('admin');
    const newRole = isCurrentlyAdmin ? 'user' : 'admin';
    setActionLoading(`role-${userId}`);
    try {
      await authAPI.updateUserRole(userId, newRole);
      showToast?.(`Updated user role to ${newRole}`, 'success');
      loadAdminData();
    } catch (err) {
      showToast?.(err.response?.data?.message || 'Failed to update user role', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header and Refresh */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-800/80 backdrop-blur-md p-6 rounded-2xl border border-slate-700/80 shadow-xl">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 text-transparent bg-clip-text flex items-center gap-3">
            <span>🛡️</span> Security & System Administration
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Manage user authorization, review pending accounts, and monitor system-wide cryptographic ledger integrity.
          </p>
        </div>
        <button
          onClick={loadAdminData}
          disabled={loading}
          className="px-4 py-2 bg-slate-700/80 hover:bg-slate-700 text-slate-200 rounded-xl transition flex items-center gap-2 border border-slate-600/50 shadow-sm"
        >
          <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Refresh</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Total Users', value: stats?.totalUsers ?? '-', icon: '👥', color: 'from-blue-600 to-indigo-600' },
          { label: 'Pending Approvals', value: stats?.pendingUsers ?? '-', icon: '⏳', color: 'from-amber-600 to-orange-600' },
          { label: 'Uploaded Files', value: stats?.totalFiles ?? '-', icon: '📁', color: 'from-emerald-600 to-teal-600' },
          { label: 'Active Shares', value: stats?.totalShares ?? '-', icon: '🔗', color: 'from-purple-600 to-pink-600' },
          { label: 'Audit Events', value: stats?.totalAuditEvents ?? '-', icon: '📜', color: 'from-cyan-600 to-blue-600' },
          {
            label: 'Blockchain Health',
            value: stats ? (stats.isBlockchainValid ? 'Valid ✅' : 'Tampered ❌') : '-',
            sub: `${stats?.blockchainBlocks || 0} blocks`,
            icon: '⛓️',
            color: 'from-emerald-700 to-green-600',
          },
        ].map((item, idx) => (
          <div
            key={idx}
            className="bg-slate-800/80 backdrop-blur-md p-4 rounded-xl border border-slate-700/70 shadow-lg flex flex-col justify-between"
          >
            <div className="flex justify-between items-start mb-2">
              <span className="text-xl">{item.icon}</span>
              <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">{item.label}</span>
            </div>
            <div>
              <div className="text-2xl font-bold text-white tracking-tight">{item.value}</div>
              {item.sub && <div className="text-xs text-slate-400 mt-0.5">{item.sub}</div>}
            </div>
          </div>
        ))}
      </div>

      {/* Pending Approvals Table */}
      <div className="bg-slate-800/80 backdrop-blur-md rounded-2xl border border-slate-700/80 shadow-xl overflow-hidden">
        <div className="p-6 border-b border-slate-700/70 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span>⏳</span> Pending Role Approval Requests
            </h3>
            <p className="text-xs text-slate-400 mt-1">Users requesting elevated administrator privileges</p>
          </div>
          <span className="px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full text-xs font-semibold">
            {pendingUsers.length} Pending
          </span>
        </div>

        {pendingUsers.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <span className="text-3xl block mb-2">✨</span>
            No pending user approval requests at this time. All users are reviewed!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/60 text-xs uppercase text-slate-400 tracking-wider">
                <tr>
                  <th className="px-6 py-3">Email</th>
                  <th className="px-6 py-3">Requested Role</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {pendingUsers.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-700/30 transition">
                    <td className="px-6 py-4 font-medium text-white">{u.email}</td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-md text-xs font-semibold uppercase">
                        {u.requestedRole || 'admin'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded text-xs font-medium">
                        pending
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => handleApprove(u._id)}
                        disabled={actionLoading === `approve-${u._id}`}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition shadow disabled:opacity-50"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleReject(u._id)}
                        disabled={actionLoading === `reject-${u._id}`}
                        className="px-3 py-1.5 bg-red-600/80 hover:bg-red-600 text-white rounded-lg text-xs font-semibold transition shadow disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* All Users Directory */}
      <div className="bg-slate-800/80 backdrop-blur-md rounded-2xl border border-slate-700/80 shadow-xl overflow-hidden">
        <div className="p-6 border-b border-slate-700/70 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span>👥</span> User Accounts Directory
            </h3>
            <p className="text-xs text-slate-400 mt-1">Manage system accounts, access roles, and authorization status</p>
          </div>
          <span className="text-xs text-slate-400 font-mono">Total: {allUsers.length} accounts</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-900/60 text-xs uppercase text-slate-400 tracking-wider">
              <tr>
                <th className="px-6 py-3">Email</th>
                <th className="px-6 py-3">Role</th>
                <th className="px-6 py-3">Approval Status</th>
                <th className="px-6 py-3 text-right">Permissions & Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {allUsers.map((u) => {
                const isAdmin = u.roles?.includes('admin');
                return (
                  <tr key={u._id} className="hover:bg-slate-700/30 transition">
                    <td className="px-6 py-4 font-medium text-white flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-blue-400">
                        {u.email.substring(0, 2).toUpperCase()}
                      </div>
                      <span>{u.email}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-md text-xs font-semibold uppercase ${
                          isAdmin
                            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                            : 'bg-slate-700 text-slate-300'
                        }`}
                      >
                        {u.roles?.join(', ') || 'user'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          u.approvalStatus === 'approved'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : u.approvalStatus === 'rejected'
                            ? 'bg-red-500/20 text-red-300'
                            : 'bg-amber-500/20 text-amber-300'
                        }`}
                      >
                        {u.approvalStatus || 'approved'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => handleToggleRole(u._id, u.roles || [])}
                        disabled={actionLoading === `role-${u._id}`}
                        className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-xs font-medium transition border border-slate-600 disabled:opacity-50"
                      >
                        {isAdmin ? 'Demote to User' : 'Promote to Admin'}
                      </button>
                      <button
                        onClick={() => handleDeleteUser(u._id, u.email)}
                        disabled={actionLoading === `delete-${u._id}`}
                        className="px-3 py-1 bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white rounded-lg text-xs font-medium transition border border-red-500/30 disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
