import React, { useState } from 'react';
import { authAPI } from './services/api';

const LoginPage = ({ onLogin, setToken, setUserEmail, setUserRoles, mode = 'login', onModeChange }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ text: '', type: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setStatusMsg({ text: '', type: '' });

    try {
      let response;
      if (mode === 'register') {
        response = await authAPI.register(email, password, role);
      } else {
        response = await authAPI.login(email, password);
      }

      const { token, email: returnedEmail, roles, approvalStatus, message } = response.data;

      if (mode === 'register' && approvalStatus === 'pending') {
        setStatusMsg({
          text: message || 'Your account has been requested and is pending administrator approval.',
          type: 'warning'
        });
        setLoading(false);
        return;
      }

      if (!token) {
        setStatusMsg({ text: 'Authentication failed: No access token received from server.', type: 'error' });
        setLoading(false);
        return;
      }

      // Store in localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('email', returnedEmail);
      localStorage.setItem('roles', JSON.stringify(roles || []));

      // Update parent states
      setToken(token);
      setUserEmail(returnedEmail);
      setUserRoles(roles || []);

      setStatusMsg({
        text: mode === 'register' ? 'Account created and authenticated!' : 'Login successful!',
        type: 'success'
      });

      setTimeout(() => {
        onLogin?.();
      }, 500);
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        'Authentication request failed. Please check credentials or network connection.';
      setStatusMsg({ text: message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-slate-800/90 backdrop-blur-md p-8 rounded-2xl shadow-2xl border border-slate-700/80 transition-all">
      <div className="flex items-center justify-center p-1 bg-slate-900/60 rounded-xl mb-6 border border-slate-700/50">
        <button
          type="button"
          onClick={() => { onModeChange?.('login'); setStatusMsg({ text: '', type: '' }); }}
          className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
            mode === 'login'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={() => { onModeChange?.('register'); setStatusMsg({ text: '', type: '' }); }}
          className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
            mode === 'register'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Create Account
        </button>
      </div>

      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 text-transparent bg-clip-text">
          {mode === 'register' ? 'Create Your Account' : 'Welcome Back'}
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          {mode === 'register'
            ? 'Access end-to-end encrypted file sharing and tamper-evident audit logs.'
            : 'Enter your credentials to securely access your vault.'}
        </p>
      </div>

      {statusMsg.text && (
        <div
          className={`mb-5 p-3.5 rounded-xl text-sm border flex items-start gap-2.5 ${
            statusMsg.type === 'error'
              ? 'bg-red-950/50 border-red-500/50 text-red-300'
              : statusMsg.type === 'warning'
              ? 'bg-amber-950/50 border-amber-500/50 text-amber-300'
              : 'bg-emerald-950/50 border-emerald-500/50 text-emerald-300'
          }`}
        >
          <span className="shrink-0 font-bold">
            {statusMsg.type === 'error' ? '❌' : statusMsg.type === 'warning' ? '⚠️' : '✅'}
          </span>
          <div>{statusMsg.text}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
            Email Address
          </label>
          <input
            type="email"
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/70 text-white border border-slate-700 focus:outline-none focus:border-blue-500 transition"
            placeholder="you@domain.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
            Password
          </label>
          <input
            type="password"
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/70 text-white border border-slate-700 focus:outline-none focus:border-blue-500 transition"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {mode === 'register' && (
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Account Role
            </label>
            <select
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/70 text-white border border-slate-700 focus:outline-none focus:border-blue-500 transition"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="user">Standard User (Instant access)</option>
              <option value="admin">Administrator (Requires approval)</option>
            </select>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 py-3 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 disabled:opacity-50 text-white font-medium rounded-xl transition shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <span>Authenticating...</span>
            </>
          ) : (
            <span>{mode === 'register' ? 'Create Account' : 'Sign In'}</span>
          )}
        </button>
      </form>
    </div>
  );
};

export default LoginPage;