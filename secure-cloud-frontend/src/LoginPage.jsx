import React, { useState } from 'react';
import axios from 'axios';

const LoginPage = ({ onLogin, setToken, setUserEmail, setUserRoles, mode = 'login', onModeChange }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;

    try {
      const endpoint = mode === 'register' ? '/register' : '/login';
      const response = await axios.post(`http://localhost:5001/api/auth${endpoint}`, {
        email,
        password,
        role,
      });

      const { token, email: returnedEmail, roles, approvalStatus, message } = response.data;

      if (mode === 'register' && approvalStatus === 'pending') {
        alert(message || 'Your account is pending approval.');
        return;
      }

      if (!token) {
        alert('❌ Login failed: No token received');
        return;
      }

      // 🧠 Store token, email, roles
      localStorage.setItem('token', token);
      localStorage.setItem('email', returnedEmail);
      localStorage.setItem('roles', JSON.stringify(roles));

      // 🧠 Update state
      setToken(token);
      setUserEmail(returnedEmail);
      setUserRoles(roles);

      alert(mode === 'register' ? '✅ Account created and signed in' : '✅ Login Successful');
      onLogin(); // Navigate or switch tab
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        'An unknown error occurred';
      console.error('Login error:', message);
      alert(`❌ Login Failed: ${message}`);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-slate-800 p-8 rounded-xl shadow-lg border border-slate-700">
      <div className="flex items-center justify-center gap-3 mb-6">
        <button
          type="button"
          onClick={() => onModeChange?.('login')}
          className={`px-4 py-2 rounded-md transition ${mode === 'login' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300'}`}
        >
          Login
        </button>
        <button
          type="button"
          onClick={() => onModeChange?.('register')}
          className={`px-4 py-2 rounded-md transition ${mode === 'register' ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-300'}`}
        >
          Sign Up
        </button>
      </div>
      <h2 className="text-2xl font-bold text-center mb-6 text-blue-400">{mode === 'register' ? 'Create Your Account' : 'Welcome Back'}</h2>
      <form onSubmit={handleSubmit}>
        <label className="block mb-2">Email</label>
        <input
          type="email"
          className="w-full mb-4 p-2 rounded-md bg-slate-700 text-white border border-slate-600"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <label className="block mb-2">Password</label>
        <input
          type="password"
          className="w-full mb-6 p-2 rounded-md bg-slate-700 text-white border border-slate-600"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {mode === 'register' && (
          <>
            <label className="block mb-2">Role</label>
            <select
              className="w-full mb-6 p-2 rounded-md bg-slate-700 text-white border border-slate-600"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="user">User</option>
              <option value="admin">Admin (requires approval)</option>
            </select>
          </>
        )}

        <button
          type="submit"
          className="w-full py-2 bg-gradient-to-r from-blue-600 to-emerald-600 text-white rounded-md hover:from-blue-500 hover:to-emerald-500 transition"
        >
          {mode === 'register' ? 'Sign Up' : 'Login'}
        </button>
      </form>
    </div>
  );
};

export default LoginPage;