import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import OverviewTab from './components/OverviewTab';
import MyFiles from './components/MyFiles';
import FileUpload from './components/FileUpload';
import ShareManager from './components/ShareManager';
import BlockchainViewer from './components/BlockchainViewer';
import AuditLogViewer from './components/AuditLogViewer';
import ActivityTimeline from './components/ActivityTimeline';
import IntegrityVerifier from './components/IntegrityVerifier';
import RolesSimulator from './components/RolesSimulator';
import AdminDashboard from './components/AdminDashboard';
import FeaturesTab from './components/FeaturesTab';
import TechnologyTab from './components/TechnologyTab';
import DownloadPage from './components/DownloadPage';
import LoginPage from './LoginPage';
import Toast from './components/Toast';
import { isTokenExpired } from './services/api';

const App = () => {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [userEmail, setUserEmail] = useState(localStorage.getItem('email') || '');
  const [userRoles, setUserRoles] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('roles')) || [];
    } catch {
      return [];
    }
  });

  const [activeTab, setActiveTab] = useState(() => {
    const saved = localStorage.getItem('activeTab');
    return saved || 'overview';
  });

  const [authMode, setAuthMode] = useState('login');
  const [toast, setToast] = useState({ message: '', type: 'info' });

  // Check URL pathname for /download/:token route
  const [isDownloadRoute, setIsDownloadRoute] = useState(
    () => window.location.pathname.startsWith('/download/')
  );
  const downloadToken = isDownloadRoute
    ? window.location.pathname.replace('/download/', '').split('/')[0]
    : '';

  // Navigating from the download page returns to the main app
  const navigateToTab = (tab) => {
    if (isDownloadRoute) {
      window.history.pushState({}, '', '/');
      setIsDownloadRoute(false);
    }
    setActiveTab(tab);
  };

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
  };

  const clearAuthSession = (message = 'Your session has expired. Please sign in again.') => {
    localStorage.removeItem('token');
    localStorage.removeItem('email');
    localStorage.removeItem('roles');
    setToken('');
    setUserEmail('');
    setUserRoles([]);
    setActiveTab('login');
    showToast(message, 'warning');
  };

  // Verify token expiry on initial mount
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken && isTokenExpired(storedToken)) {
      clearAuthSession();
    }
  }, []);

  // Sync tab with localStorage
  useEffect(() => {
    if (!isDownloadRoute) {
      localStorage.setItem('activeTab', activeTab);
    }
  }, [activeTab, isDownloadRoute]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('email');
    localStorage.removeItem('roles');
    setToken('');
    setUserEmail('');
    setUserRoles([]);
    setActiveTab('overview');
    showToast('Signed out successfully.', 'info');
  };

  const handleNavigateLogin = (mode = 'login') => {
    setAuthMode(mode);
    navigateToTab('login');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans relative selection:bg-blue-500 selection:text-white">
      {/* Background Animated Gradient */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-950 to-slate-950" />
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl" />
      </div>

      {/* Main Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={navigateToTab}
        token={token}
        userEmail={userEmail}
        userRoles={userRoles}
        onLogout={handleLogout}
        onNavigateLogin={handleNavigateLogin}
      />

      {/* Main Content Area */}
      <main className="flex-1 relative z-10 pt-20 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        {isDownloadRoute ? (
          <DownloadPage
            token={downloadToken}
            setToken={setToken}
            setUserEmail={setUserEmail}
            setUserRoles={setUserRoles}
            showToast={showToast}
          />
        ) : (
          <>
            {activeTab === 'overview' && (
              <OverviewTab
                token={token}
                onGetStarted={() => {
                  if (token) {
                    setActiveTab('my-files');
                  } else {
                    handleNavigateLogin('register');
                  }
                }}
                onExploreFeatures={() => setActiveTab('features')}
              />
            )}

            {activeTab === 'my-files' && (
              <MyFiles
                showToast={showToast}
                onNavigateUpload={() => setActiveTab('upload')}
              />
            )}

            {activeTab === 'upload' && (
              <FileUpload
                showToast={showToast}
                onUploadSuccess={() => {
                  // Option to view in vault
                  setTimeout(() => setActiveTab('my-files'), 1500);
                }}
              />
            )}

            {activeTab === 'shares' && (
              <ShareManager showToast={showToast} />
            )}

            {activeTab === 'blockchain' && (
              <BlockchainViewer showToast={showToast} />
            )}

            {activeTab === 'audit-logs' && (
              <AuditLogViewer showToast={showToast} />
            )}

            {activeTab === 'timeline' && (
              <ActivityTimeline showToast={showToast} />
            )}

            {activeTab === 'verifier' && (
              <IntegrityVerifier showToast={showToast} />
            )}

            {activeTab === 'roles' && (
              <RolesSimulator showToast={showToast} />
            )}

            {activeTab === 'admin' && userRoles.includes('admin') && (
              <AdminDashboard showToast={showToast} />
            )}

            {activeTab === 'features' && (
              <FeaturesTab
                onStartUsing={() => {
                  if (token) {
                    setActiveTab('my-files');
                  } else {
                    handleNavigateLogin('register');
                  }
                }}
              />
            )}

            {activeTab === 'technology' && (
              <TechnologyTab />
            )}

            {activeTab === 'login' && (
              <div className="py-12">
                <LoginPage
                  mode={authMode}
                  onModeChange={setAuthMode}
                  setToken={setToken}
                  setUserEmail={setUserEmail}
                  setUserRoles={setUserRoles}
                  onLogin={() => {
                    setActiveTab('my-files');
                    showToast('Welcome to your cryptographic vault!', 'success');
                  }}
                />
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-800/80 bg-slate-950/80 backdrop-blur-md py-6 text-center text-xs text-slate-500">
        <div className="container mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-300">SecureChain Cloud</span>
            <span>•</span>
            <span>AES-256 & Blockchain Audit Engine</span>
          </div>
          <div>
            Zero-Knowledge Cryptographic Access Architecture © 2026
          </div>
        </div>
      </footer>

      {/* Global In-App Toast Notification */}
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: '', type: 'info' })}
      />
    </div>
  );
};

export default App;