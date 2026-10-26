import React, { useState } from 'react';

const Navbar = ({
  activeTab,
  setActiveTab,
  token,
  userEmail,
  userRoles = [],
  onLogout,
  onNavigateLogin,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isAdmin = userRoles.includes('admin');

  const navItems = [
    { id: 'overview', label: 'Overview', icon: '🌐' },
    ...(token
      ? [
          { id: 'my-files', label: 'My Vault', icon: '📁' },
          { id: 'upload', label: 'Upload', icon: '⬆️' },
          { id: 'shares', label: 'Shares', icon: '🔗' },
          { id: 'blockchain', label: 'Blockchain', icon: '⛓️' },
          { id: 'audit-logs', label: 'Audit Trail', icon: '📜' },
          { id: 'timeline', label: 'Timeline', icon: '⏱️' },
          { id: 'verifier', label: 'Verifier', icon: '🔬' },
          { id: 'roles', label: 'Roles', icon: '👥' },
          ...(isAdmin ? [{ id: 'admin', label: 'Admin', icon: '🛡️', badge: 'ADMIN' }] : []),
        ]
      : [
          { id: 'features', label: 'Features', icon: '✨' },
          { id: 'technology', label: 'Technology', icon: '💻' },
        ]),
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-slate-900/80 backdrop-blur-md border-b border-slate-800/80 shadow-lg">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <div
          onClick={() => setActiveTab('overview')}
          className="flex items-center space-x-2.5 cursor-pointer select-none group"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-emerald-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
            🛡️
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-blue-400 to-emerald-400 text-transparent bg-clip-text">
              SecureChain
            </span>
            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">
              Zero-Trust Vault
            </span>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden xl:flex items-center space-x-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 relative ${
                  isActive
                    ? 'text-white bg-slate-800/90 border border-slate-700/80 shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
                {item.badge && (
                  <span className="ml-1 px-1.5 py-0.2 rounded-md bg-purple-500/30 text-purple-300 text-[10px] font-bold">
                    {item.badge}
                  </span>
                )}
                {isActive && (
                  <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-gradient-to-r from-blue-400 to-emerald-400 rounded-full" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Auth / Profile Area */}
        <div className="flex items-center space-x-3">
          {token ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-xs font-medium text-slate-200">{userEmail}</span>
                <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {isAdmin ? 'Administrator' : 'Standard User'}
                </span>
              </div>
              <button
                onClick={onLogout}
                className="px-3.5 py-1.5 bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white rounded-xl text-xs font-semibold transition border border-red-500/30"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigateLogin('login')}
                className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition shadow-md shadow-blue-600/20"
              >
                Sign In
              </button>
              <button
                onClick={() => onNavigateLogin('register')}
                className="px-4 py-1.5 rounded-xl border border-emerald-500/50 hover:bg-emerald-500/10 text-emerald-300 text-xs font-semibold transition"
              >
                Register
              </button>
            </div>
          )}

          {/* Mobile hamburger toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="xl:hidden p-2 text-slate-400 hover:text-white rounded-lg focus:outline-none"
            aria-label="Toggle Navigation"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="xl:hidden bg-slate-900 border-b border-slate-800 p-4 space-y-2 animate-fade-in max-h-[80vh] overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setIsMobileMenuOpen(false);
              }}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-between transition ${
                activeTab === item.id
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="px-2 py-0.5 rounded bg-purple-500/30 text-purple-300 text-xs font-bold">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </header>
  );
};

export default Navbar;
