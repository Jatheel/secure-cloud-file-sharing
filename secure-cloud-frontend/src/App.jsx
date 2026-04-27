import React, { useState, useEffect, useRef } from 'react';
import LoginPage from './LoginPage';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import CryptoJS from 'crypto-js';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';

const decodeJwtPayload = (jwtToken) => {
  try {
    const tokenParts = jwtToken.split('.');
    if (tokenParts.length !== 3) return null;

    const payloadBase64 = tokenParts[1].replace(/-/g, '+').replace(/_/g, '/');
    const paddedPayload = payloadBase64.padEnd(Math.ceil(payloadBase64.length / 4) * 4, '=');
    return JSON.parse(atob(paddedPayload));
  } catch {
    return null;
  }
};

const isTokenExpired = (jwtToken) => {
  if (!jwtToken) return true;

  const payload = decodeJwtPayload(jwtToken);
  if (!payload) return true;
  if (!payload.exp) return false;

  return payload.exp * 1000 <= Date.now();
};

const DownloadPageComponent = ({ token, setToken, setUserEmail, setUserRoles }) => {
  const [error, setError] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
  const [filename, setFilename] = useState('');

  const clearDownloadSession = (message = 'Your session expired. Please log in again.') => {
    localStorage.removeItem('token');
    localStorage.removeItem('email');
    localStorage.removeItem('roles');
    setToken('');
    setUserEmail('');
    setUserRoles([]);
    setIsLoggedIn(false);
    setError(message);
  };

  const getValidTokenOrReset = () => {
    const authToken = localStorage.getItem('token');
    if (!authToken || isTokenExpired(authToken)) {
      clearDownloadSession();
      return null;
    }
    return authToken;
  };

  useEffect(() => {
    const fetchShareDetails = async () => {
      if (isLoggedIn) {
        try {
          const authToken = getValidTokenOrReset();
          if (!authToken) return;

          const response = await axios.get(`http://localhost:5001/api/share/details/${token}`, {
            headers: { Authorization: `Bearer ${authToken}` },
          });
          setFilename(response.data.originalName);
        } catch (err) {
          if (err.response?.status === 401) {
            clearDownloadSession(err.response?.data?.message || 'Your session expired. Please log in again.');
            return;
          }
          setError('Could not retrieve file details. You may not be the correct recipient.');
        }
      }
    };
    fetchShareDetails();
  }, [isLoggedIn, token]);

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
  };

  const handleDownload = async () => {
    try {
      const authToken = getValidTokenOrReset();
      if (!authToken) return;

      const response = await axios.get(`http://localhost:5001/api/share/download/${token}`, {
        headers: { Authorization: `Bearer ${authToken}` },
        responseType: 'blob',
      });

      // ✅ CORRECTED LINE: Removed the extra "new Blob([...])" wrapper
      const url = window.URL.createObjectURL(response.data);

      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename || 'downloaded-file');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      if (err.response?.status === 401) {
        clearDownloadSession(err.response?.data?.message || 'Your session expired. Please log in again.');
        return;
      }
      setError(err.response?.data?.message || 'Download failed.');
    }
  };

  return (
    <div className="py-20 px-4 relative z-10">
      <div className="container mx-auto max-w-2xl text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-emerald-400 text-transparent bg-clip-text">
          Secure File Download
        </h2>
        {error && <p className="text-red-400 mb-4">{error}</p>}
        {!isLoggedIn ? (
          <div className="bg-slate-800 p-8 rounded-xl shadow-lg border border-slate-700">
            <p className="mb-6 text-lg">A file has been shared with you. Please log in to download it.</p>
            <LoginPage
              onLogin={handleLoginSuccess}
              setToken={setToken}
              setUserEmail={setUserEmail}
              setUserRoles={setUserRoles}
            />
          </div>
        ) : (
          <div className="bg-slate-800 p-8 rounded-xl shadow-lg border border-slate-700">
            <p className="mb-2 text-lg">You are logged in and have access to:</p>
            <p className="mb-6 text-xl font-bold text-emerald-400">{filename || 'Loading file details...'}</p>
            <button
              onClick={handleDownload}
              className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-500 hover:to-emerald-500 transition-all shadow-lg"
              disabled={!filename}
            >
              Download File
            </button>
          </div>
        )}
      </div>
    </div>
  );
};


const App = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [authMode, setAuthMode] = useState('login');
  const [isScrolled, setIsScrolled] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const featuresRef = useRef(null);
  const demoRef = useRef(null);
  const [sharedAt, setSharedAt] = useState(null);
  const fileInputRef = useRef(null);
  const loginRef = useRef(null);
  const shareComponentRef = useRef(null); // Ref for the share component

  const [sharedFile, setSharedFile] = useState(null);
  const [expiryTime, setExpiryTime] = useState(null);
  const [isSharing, setIsSharing] = useState(false);

  const [user, setUser] = useState('');
  const [file, setFile] = useState('');
  const [until, setUntil] = useState(null);
  const [rules, setRules] = useState([]);

  const [originalFile, setOriginalFile] = useState(null);
  const [originalHash, setOriginalHash] = useState('');
  const [verificationFile, setVerificationFile] = useState(null);
  const [verificationHash, setVerificationHash] = useState('');
  const [isMatch, setIsMatch] = useState(null);
  const [simulationOutput, setSimulationOutput] = useState('');

  const [roles, setRoles] = useState([
    { name: 'admin', upload: true, download: true, revoke: true },
    { name: 'user', upload: true, download: true, revoke: false }
  ]);

  const [newRole, setNewRole] = useState('');
  const [permissions, setPermissions] = useState({
    upload: false,
    download: false,
    revoke: false,
  });

  const handleAddRole = () => {
    if (!newRole.trim()) return;
    setRoles([...roles, { name: newRole, ...permissions }]);
    setNewRole('');
    setPermissions({ upload: false, download: false, revoke: false });
  };
  const [shareWithEmail, setShareWithEmail] = useState('');
  const [shareLink, setShareLink] = useState('');

  const [selectedFile, setSelectedFile] = useState(null);
  const [password, setPassword] = useState('');
  const [encryptedData, setEncryptedData] = useState(null);
  const [decryptedBlobUrl, setDecryptedBlobUrl] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [userEmail, setUserEmail] = useState(localStorage.getItem('email') || '');
  const [userRoles, setUserRoles] = useState(
    JSON.parse(localStorage.getItem('roles')) || []
  );

  const [auditLogs, setAuditLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [auditFilters, setAuditFilters] = useState({
    userEmail: '',
    action: '',
    startDate: null,
    endDate: null,
  });

  const [myShares, setMyShares] = useState([]);
  const [loadingShares, setLoadingShares] = useState(false);
  const [receivedShares, setReceivedShares] = useState([]);

  useEffect(() => {
    const savedTab = localStorage.getItem('activeTab');
    if (savedTab) {
      setActiveTab(savedTab);
    }
  }, []);

  useEffect(() => {
    if (!window.location.pathname.startsWith('/download/')) {
      localStorage.setItem('activeTab', activeTab);
    }
  }, [activeTab]);

  useEffect(() => {
    const storedDark = localStorage.getItem('darkMode');
    if (storedDark === 'true') {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setDarkMode(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleDarkMode = () => {
    const next = !darkMode;
    setDarkMode(next);
    localStorage.setItem('darkMode', next);
    document.documentElement.classList.toggle('dark', next);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const clearAuthSession = (message = 'Your session expired. Please log in again.') => {
    localStorage.removeItem('token');
    localStorage.removeItem('email');
    localStorage.removeItem('roles');
    setToken('');
    setUserEmail('');
    setUserRoles([]);
    setActiveTab('login');
    alert(message);
  };

  const isSessionExpired = (err) => {
    return err?.response?.status === 401 || err?.response?.data?.code === 'TOKEN_EXPIRED';
  };

  const isAdminRole = (roles = []) => roles.some((role) => role === 'admin' || role?.name === 'admin');

  const getValidTokenOrLogout = () => {
    const authToken = localStorage.getItem('token');
    if (!authToken || isTokenExpired(authToken)) {
      clearAuthSession();
      return null;
    }
    return authToken;
  };

  const fetchAuditLogs = async () => {
    setLoadingLogs(true);
    try {
      const authToken = getValidTokenOrLogout();
      if (!authToken) return;

      const params = new URLSearchParams();
      if (auditFilters.userEmail) params.append('userEmail', auditFilters.userEmail);
      if (auditFilters.action) params.append('action', auditFilters.action);
      if (auditFilters.startDate) params.append('startDate', auditFilters.startDate.toISOString());
      if (auditFilters.endDate) params.append('endDate', auditFilters.endDate.toISOString());

      const res = await axios.get(`http://localhost:5001/api/audit-log?${params.toString()}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      if (res.data && res.data.logs) {
        setAuditLogs(res.data.logs);
      }
    } catch (err) {
      console.error(err);
      if (isSessionExpired(err)) {
        clearAuthSession(err.response?.data?.message || 'Your session expired. Please log in again.');
        return;
      }
      alert('Could not fetch audit logs.');
    } finally {
      setLoadingLogs(false);
    }
  };

  const fetchMyShares = async () => {
    setLoadingShares(true);
    try {
      const authToken = getValidTokenOrLogout();
      if (!authToken) return;

      console.log('Fetching shares with token:', authToken.substring(0, 20) + '...');
      console.log('API_BASE_URL:', API_BASE_URL);

      // Fetch both endpoints with independent error handling
      const [sentRes, receivedRes] = await Promise.allSettled([
        axios.get(`${API_BASE_URL}/api/share/my-shares`, {
          headers: { Authorization: `Bearer ${authToken}` }
        }),
        axios.get(`${API_BASE_URL}/api/share/received-shares`, {
          headers: { Authorization: `Bearer ${authToken}` }
        })
      ]);

      // Handle sent shares
      if (sentRes.status === 'fulfilled') {
        console.log('My shares fetched:', sentRes.value.data);
        setMyShares(sentRes.value.data);
      } else {
        console.error('Failed to fetch sent shares:', sentRes.reason);
        if (isSessionExpired({ response: sentRes.reason.response })) {
          clearAuthSession('Your session expired. Please log in again.');
          return;
        }
      }

      // Handle received shares
      if (receivedRes.status === 'fulfilled') {
        console.log('Received shares fetched:', receivedRes.value.data);
        setReceivedShares(receivedRes.value.data);
      } else {
        console.error('Failed to fetch received shares:', receivedRes.reason);
        if (isSessionExpired({ response: receivedRes.reason.response })) {
          clearAuthSession('Your session expired. Please log in again.');
          return;
        }
      }

      // Show error only if both failed
      if (sentRes.status === 'rejected' && receivedRes.status === 'rejected') {
        alert('Could not fetch shared files.');
      }
    } catch (err) {
      console.error('Unexpected error fetching shares:', err);
      alert('Could not fetch shared files.');
    } finally {
      setLoadingShares(false);
    }
  };

  const handleDownloadReceived = async (token) => {
    try {
      const authToken = getValidTokenOrLogout();
      if (!authToken) return;
      const res = await axios.get(`${API_BASE_URL}/api/share/download/${token}`, {
        headers: { Authorization: `Bearer ${authToken}` },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(res.data);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'downloaded-file');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Download failed:', err);
      if (isSessionExpired(err)) {
        clearAuthSession(err.response?.data?.message || 'Your session expired. Please log in again.');
        return;
      }
      alert(err.response?.data?.message || 'Download failed.');
    }
  };

  const handleRevoke = async (shareId) => {
    try {
      const authToken = getValidTokenOrLogout();
      if (!authToken) return;
      const res = await axios.delete(`${API_BASE_URL}/api/share/revoke/${shareId}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      alert(res.data.message);
      fetchMyShares();
    } catch (err) {
      console.error('Failed to revoke share:', err);
      if (isSessionExpired(err)) {
        clearAuthSession(err.response?.data?.message || 'Your session expired. Please log in again.');
        return;
      }
      alert(err.response?.data?.message || 'Could not revoke access.');
    }
  };


  const handleEncrypt = () => {
    if (!selectedFile || !password) {
      alert("Select a file and enter a password");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const wordArray = CryptoJS.lib.WordArray.create(e.target.result);
      const header = CryptoJS.enc.Utf8.parse("SECURECHAIN:");
      const combined = header.concat(wordArray);
      const encrypted = CryptoJS.AES.encrypt(combined, password).toString();
      setEncryptedData(encrypted);
      alert("✅ File encrypted!");
    };
    reader.readAsArrayBuffer(selectedFile);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert("Please select a file first!");
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('email', userEmail);

      const authToken = getValidTokenOrLogout();
      if (!authToken) return;
      const res = await axios.post('http://localhost:5001/api/upload', formData, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        }
      });

      alert(`✅ File uploaded: ${res.data.fileInfo.originalName}`);
      setSelectedFile(null);
    } catch (err) {
      console.error(err);
      if (isSessionExpired(err)) {
        clearAuthSession(err.response?.data?.message || 'Your session expired. Please log in again.');
        return;
      }
      alert(`❌ Upload failed: ${err.response?.data?.message || err.message}`);
    }
  };

  const shareFileWithEmail = async () => {
    const authToken = getValidTokenOrLogout();
    const fileToShare = fileInputRef.current?.files?.[0];

    if (!authToken) return;

    if (!fileToShare || !shareWithEmail || !expiryTime) {
      alert("⚠️ Please fill all fields and select a file.");
      return;
    }

    setIsSharing(true);
    const formData = new FormData();
    formData.append('file', fileToShare);
    formData.append('email', userEmail);

    try {
      const uploadRes = await axios.post(`${API_BASE_URL}/api/upload`, formData, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      const uploadData = uploadRes.data;
      if (uploadRes.status === 401 || uploadData?.code === 'TOKEN_EXPIRED') {
        clearAuthSession(uploadData?.message || 'Your session expired. Please log in again.');
        return;
      }

      if (!uploadData?.fileInfo?._id) {
        throw new Error(uploadData?.message || 'File upload failed');
      }
      const fileId = uploadData.fileInfo._id;

      const shareRes = await axios.post(`${API_BASE_URL}/api/share`, {
        fileId,
        sharedWith: shareWithEmail,
        expiresAt: expiryTime,
      }, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      const shareData = shareRes.data;
      if (shareRes.status === 401 || shareData?.code === 'TOKEN_EXPIRED') {
        clearAuthSession(shareData?.message || 'Your session expired. Please log in again.');
        return;
      }

      if (shareRes.status >= 200 && shareRes.status < 300) {
        const frontendUrl = `${window.location.origin}/download/${shareData.token}`;
        setShareLink(frontendUrl);
        setSharedAt(new Date());
        alert("✅ File shared successfully!");
      } else {
        throw new Error(shareData?.message || 'Sharing failed');
      }
    } catch (err) {
      console.error('Error sharing file:', err);
      if (isSessionExpired(err)) {
        clearAuthSession(err.response?.data?.message || 'Your session expired. Please log in again.');
        return;
      }
      alert(`❌ ${err.response?.data?.message || err.message}`);
    } finally {
      setIsSharing(false);
      if (fileInputRef.current) fileInputRef.current.value = null;
      setSharedFile(null);
      setShareWithEmail('');
      setExpiryTime(null);
    }
  };

  const handleDecrypt = () => {
    if (!encryptedData || !password) {
      alert("Missing encrypted data or password");
      return;
    }

    try {
      const decrypted = CryptoJS.AES.decrypt(encryptedData, password);
      const bytes = decrypted.toString(CryptoJS.enc.Latin1);

      if (!bytes.startsWith("SECURECHAIN:")) {
        alert("❌ Decryption failed: Invalid password or corrupted file.");
        return;
      }

      const binaryStr = bytes.slice("SECURECHAIN:".length);
      const byteNumbers = new Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        byteNumbers[i] = binaryStr.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);

      const blob = new Blob([byteArray], { type: selectedFile?.type || 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      setDecryptedBlobUrl(url);
      alert("✅ Decryption successful!");
    } catch (err) {
      alert("❌ Decryption failed. Wrong password or corrupted data.");
    }
  };

  const urlPath = window.location.pathname;
  const isDownloadPage = urlPath.startsWith('/download/');
  const downloadToken = isDownloadPage ? urlPath.split('/')[2] : null;

  if (isDownloadPage) {
    return (
      <div className={`min-h-screen transition-colors duration-500 bg-slate-900 text-white`}>
        <DownloadPageComponent
          token={downloadToken}
          setToken={setToken}
          setUserEmail={setUserEmail}
          setUserRoles={setUserRoles}
        />
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen transition-colors duration-500 ${darkMode ? 'bg-slate-900 text-white' : 'bg-gray-900 text-white'}`}
    >
      {/* Animated background */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <style>{`
          @keyframes gradient { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
          .animate-gradient-x { background: linear-gradient(90deg, #0F172A 0%, #1E293B 50%, #0F172A 100%); background-size: 200% 200%; animation: gradient 10s ease infinite; }
          .starfield { background: radial-gradient(#ffffff 1px, transparent 1px); background-size: 40px 40px; animation: twinkle 5s infinite ease-in-out; }
          @keyframes twinkle { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; } }
        `}</style>
        <div className="absolute inset-0 starfield"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-950 opacity-80 animate-gradient-x"></div>
        <img src="/assets/secure-pavan.jpg" alt="Background" className="absolute inset-0 object-cover w-full h-full opacity-20" />
      </div>

      {/* Navigation */}
      <header className={`fixed w-full z-40 transition-all duration-300 ${isScrolled ? 'bg-slate-900/80 backdrop-blur-md shadow-lg' : 'bg-transparent'}`}>
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <svg className="w-8 h-8 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 4V20M4 12H20" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="font-bold text-xl bg-gradient-to-r from-blue-400 to-emerald-400 text-transparent bg-clip-text">SecureChain</span>
          </div>
          <nav className="hidden md:flex space-x-8">
            {['overview', 'features', 'technology', 'demo', 'roles', 'manage shares'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`capitalize transition-all hover:text-blue-400 relative ${activeTab === tab ? 'text-blue-400 font-semibold' : ''}`}
              >
                {tab}
                {activeTab === tab && (
                  <span className="absolute left-0 right-0 bottom-0 h-0.5 bg-gradient-to-r from-blue-400 to-emerald-400 rounded-full"></span>
                )}
              </button>
            ))}
          </nav>
          <div className="flex items-center space-x-4">
            {token ? (
              <button
                onClick={() => {
                  localStorage.removeItem('token');
                  localStorage.removeItem('email');
                  localStorage.removeItem('roles');
                  setToken('');
                  setUserEmail('');
                  setUserRoles([]);
                  setActiveTab('login');
                }}
                className="hidden md:block px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-500 transition-all shadow-lg hover:shadow-red-500/30"
              >
                Logout
              </button>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <button
                  onClick={() => {
                    setActiveTab('login');
                    setAuthMode('login');
                    setTimeout(() => {
                      loginRef.current?.scrollIntoView({ behavior: 'smooth' });
                    }, 100);
                  }}
                  className="px-4 py-2 rounded-md bg-gradient-to-r from-blue-600 to-emerald-600 text-white hover:from-blue-500 hover:to-emerald-500 transition-all shadow-lg hover:shadow-blue-500/30"
                >
                  Login
                </button>
                <button
                  onClick={() => {
                    setActiveTab('login');
                    setAuthMode('register');
                    setTimeout(() => {
                      loginRef.current?.scrollIntoView({ behavior: 'smooth' });
                    }, 100);
                  }}
                  className="px-4 py-2 rounded-md border border-emerald-500 text-emerald-300 hover:bg-emerald-500/10 transition-all"
                >
                  Sign Up
                </button>
              </div>
            )}
            <button onClick={toggleMenu} className="md:hidden p-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
              </svg>
            </button>
          </div>
        </div>
        {isMenuOpen && (
          <div className="md:hidden bg-slate-900/90 backdrop-blur-lg shadow-lg z-50">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {['overview', 'features', 'technology', 'demo', 'upload', 'roles', 'manage shares'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => { setActiveTab(tab); setIsMenuOpen(false); }}
                  className={`block w-full text-left px-3 py-2 rounded-md capitalize transition-colors ${activeTab === tab ? 'bg-blue-500/20 text-blue-400' : 'hover:bg-slate-800'}`}
                >
                  {tab}
                </button>
              ))}
            </div>
            <div className="px-2 pt-2 pb-3 sm:px-3 border-t border-slate-700 mt-2">
              {token ? (
                <button
                  onClick={() => {
                    localStorage.removeItem('token');
                    localStorage.removeItem('email');
                    localStorage.removeItem('roles');
                    setToken('');
                    setUserEmail('');
                    setUserRoles([]);
                    setActiveTab('login');
                    setIsMenuOpen(false);
                  }}
                  className="block w-full text-left px-3 py-2 rounded-md text-red-400 hover:bg-slate-800"
                >
                  Logout
                </button>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setActiveTab('login');
                      setAuthMode('login');
                      setIsMenuOpen(false);
                    }}
                    className="block w-full text-left px-3 py-2 rounded-md text-blue-400 hover:bg-slate-800"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('login');
                      setAuthMode('register');
                      setIsMenuOpen(false);
                    }}
                    className="block w-full text-left px-3 py-2 rounded-md text-emerald-400 hover:bg-slate-800"
                  >
                    Sign Up
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      {activeTab === 'overview' && (
        <section className="pt-24 pb-16 px-4 relative z-10">
          <div className="container mx-auto max-w-6xl">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight bg-gradient-to-r from-blue-400 to-emerald-400 text-transparent bg-clip-text">
                  Secure Cloud File Sharing with Blockchain-Based Audit Logs
                </h1>
                <p className="text-lg md:text-xl mb-8 text-gray-300">
                  Revolutionizing data security with decentralized audit trails and end-to-end encrypted file sharing.
                </p>
                <div className="flex flex-wrap gap-4">
                  <button
                    onClick={() => {
                      setActiveTab('features');
                      setTimeout(() => {
                        featuresRef.current?.scrollIntoView({ behavior: 'smooth' });
                      }, 100);
                    }}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-emerald-600 text-white rounded-lg hover:from-blue-500 hover:to-emerald-500 transition-all shadow-lg hover:shadow-blue-500/30"
                  >
                    Get Started
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('demo');
                      setTimeout(() => {
                        demoRef.current?.scrollIntoView({ behavior: 'smooth' });
                      }, 100);
                    }}
                    className="px-6 py-3 border border-blue-600 rounded-lg hover:bg-blue-900/20 transition-colors"
                  >
                    Learn More
                  </button>
                </div>
              </div>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-emerald-600 rounded-2xl blur-xl opacity-30"></div>
                <img
                  src="/assets/secure-blockchain.svg"
                  alt="Blockchain visualization"
                  className="relative z-10 rounded-2xl shadow-2xl border border-slate-700"
                />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Features Section */}
      {activeTab === 'features' && (
        <section ref={featuresRef} className="py-20 px-4 relative z-10">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-emerald-400 text-transparent bg-clip-text">
                Advanced Features
              </h2>
              <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto">
                Our platform combines cutting-edge technologies to provide unmatched security and transparency.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  title: "End-to-End Encryption (AES-256)",
                  description: "Files are encrypted on the client using AES-256 with password-based keys and a validation header.",
                  icon: (
                    <svg className="w-12 h-12 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                      <path d="M7 11V7a5 5 0 0110 0v4"></path>
                    </svg>
                  ),
                },
                {
                  title: "Time-Limited File Sharing",
                  description: "Simulate access control by setting expiry times for shared files with date-time selection.",
                  icon: (
                    <svg className="w-12 h-12 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path d="M12 8v4l3 3" />
                      <circle cx="12" cy="12" r="10" />
                    </svg>
                  ),
                },
                {
                  title: "Smart Contract Rule Simulation",
                  description: "Assign access rules to users and files (e.g., 'until' dates) to simulate contract logic.",
                  icon: (
                    <svg className="w-12 h-12 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                      <path d="M14 2v6h6M16 13H8M16 17H8M10 13v4" />
                    </svg>
                  ),
                },
                {
                  title: "Role-Based Access Control",
                  description: "Define roles like Auditor or Admin with fine-grained permissions (upload/download/revoke).",
                  icon: (
                    <svg className="w-12 h-12 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.82a9.583 9.583 0 012.51.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                    </svg>
                  ),
                },
                {
                  title: "File Integrity Verification",
                  description: "Uses SHA-256 to verify if uploaded and downloaded files are identical and untampered.",
                  icon: (
                    <svg className="w-12 h-12 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path d="M9 12l2 2 4-4" />
                      <circle cx="12" cy="12" r="10" />
                    </svg>
                  ),
                },
                {
                  title: "Audit Log Simulation",
                  description: "Track simulated actions like upload, share, revoke to mimic blockchain logging.",
                  icon: (
                    <svg className="w-12 h-12 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path d="M4 4h16v2H4zM4 10h16v2H4zM4 16h16v2H4z" />
                    </svg>
                  ),
                },
              ].map((feature, index) => (
                <div
                  key={index}
                  className="bg-slate-800/70 backdrop-blur-sm p-8 rounded-xl shadow-lg hover:shadow-xl hover:shadow-blue-500/20 transition-all border border-slate-700 hover:border-blue-500/50"
                >
                  <div className="mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-bold mb-3 text-white">{feature.title}</h3>
                  <p className="text-gray-400">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ✅ UPDATED Technology Section */}
      {activeTab === 'technology' && (
        <section className="py-20 px-4 relative z-10">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-emerald-400 text-transparent bg-clip-text">
                Technology Stack
              </h2>
              <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto">
                This project integrates a modern, full-stack JavaScript ecosystem to deliver a secure and robust application.
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-emerald-600 rounded-2xl blur-xl opacity-20"></div>
                <img
                  src="/assets/secure-image-2.jpg"
                  alt="Secure B2B Technology"
                  className="relative z-10 rounded-2xl shadow-lg border border-slate-700"
                />
              </div>
              <div className="bg-slate-800/70 backdrop-blur-sm p-8 rounded-xl border border-slate-700">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-bold mb-2 text-blue-400">Backend</h3>
                    <ul className="space-y-2 text-gray-300">
                      <li>• Node.js & Express.js For building the core RESTful API.</li>
                      <li>• MongoDB & Mongoose As the NoSQL database for storing user, file, and log data.</li>
                      <li>• JWT & bcrypt.js For secure user authentication and password hashing.</li>
                      <li>• Nodemailer For handling automated email notifications.</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2 text-blue-400">Frontend</h3>
                    <ul className="space-y-2 text-gray-300">
                      <li>•  React & Vite: For a fast, modern single-page application.</li>
                      <li>•  Tailwind CSS For utility-first, responsive styling.</li>
                      <li>•  Axios  For handling API requests to the backend.</li>
                      <li>•  Crypto-JS For client-side file integrity checks (SHA-256).</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2 text-blue-400">Blockchain Layer (Concept)</h3>
                    <ul className="space-y-2 text-gray-300">
                      <li>• The current MongoDB audit log is the functional precursor to a future Hyperledger Fabric or Ethereum -based immutable ledger.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Demo Section */}
      {activeTab === 'demo' && (
        <section ref={demoRef} className="py-20 px-4 relative z-10">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-emerald-400 text-transparent bg-clip-text">
                Interactive Demo
              </h2>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                Experience our secure file sharing platform in action.
              </p>
            </div>
            <div ref={shareComponentRef} className="bg-slate-800 p-6 rounded-xl shadow-xl border border-slate-700 mb-12">
              <h3 className="text-2xl font-bold text-blue-400 mb-4">📁 Share a File (With Expiry)</h3>
              <input
                ref={fileInputRef}
                type="file"
                className="mb-4 text-white"
                onChange={(e) => {
                  setSharedFile(e.target.files[0]);
                }}
              />
              <input
                type="email"
                placeholder="Recipient Email"
                value={shareWithEmail}
                onChange={(e) => setShareWithEmail(e.target.value)}
                className="mb-4 px-4 py-2 w-full rounded bg-slate-700 text-white"
              />
              <div className="mb-4">
                <label className="block mb-1 font-semibold text-white">Set Expiry Time</label>
                <DatePicker
                  selected={expiryTime}
                  onChange={(date) => setExpiryTime(date)}
                  showTimeSelect
                  dateFormat="Pp"
                  className="p-2 rounded bg-slate-700 text-white"
                />
              </div>
              <button
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded"
                onClick={shareFileWithEmail}
                disabled={isSharing}
              >
                {isSharing ? 'Sharing...' : 'Share File'}
              </button>

              {sharedFile && (
                <div className="mt-6 p-4 bg-slate-700 rounded text-white">
                  <p><strong>File:</strong> {sharedFile.name}</p>
                  <p><strong>Shared At:</strong> {sharedAt?.toLocaleString()}</p>
                  <p><strong>Expires At:</strong> {expiryTime?.toLocaleString()}</p>
                  {shareLink && (
                    <p className="mt-2 text-emerald-400">
                      🔗 <a href={shareLink} className="underline" target="_blank" rel="noreferrer">{shareLink}</a>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(shareLink);
                          alert("📋 Link copied to clipboard!");
                        }}
                        className="ml-2 text-sm bg-slate-600 px-2 py-1 rounded hover:bg-slate-500"
                      >
                        Copy
                      </button>
                    </p>
                  )}

                  {expiryTime && new Date() > new Date(expiryTime) ? (
                    <p className="text-red-400 mt-2">⛔ Access Expired</p>
                  ) : (
                    <button
                      className="mt-2 px-3 py-1 bg-green-600 hover:bg-green-500 text-white rounded"
                      onClick={() => {
                        if (shareLink) {
                          window.open(shareLink, '_blank');
                        } else {
                          alert('Share link is not available.');
                        }
                      }}
                    >
                      Download File
                    </button>
                  )}
                </div>
              )}
            </div>
            <div className="bg-slate-800 p-6 rounded-xl shadow-xl border border-slate-700 mb-12">
              <h3 className="text-2xl font-bold text-blue-400 mb-4">🔐 End-to-End Encryption</h3>
              <div className="mb-4">
                <label className="block text-white mb-2 font-semibold">Choose File</label>
                <input
                  type="file"
                  className="mb-4 text-white"
                  onChange={(e) => setSelectedFile(e.target.files[0])}
                />
              </div>
              <div className="mb-4">
                <label className="block text-white mb-2 font-semibold">Password</label>
                <input
                  type="password"
                  className="p-2 rounded bg-slate-700 text-white"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div className="flex space-x-4 mb-4">
                <button
                  className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded"
                  onClick={handleEncrypt}
                >
                  🔒 Encrypt
                </button>
                <button
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded"
                  onClick={handleDecrypt}
                >
                  🔓 Decrypt
                </button>
              </div>
              {decryptedBlobUrl && (
                <div className="mt-4">
                  <a
                    href={decryptedBlobUrl}
                    download={selectedFile?.name || "decrypted_file"}
                    className="text-emerald-400 underline"
                  >
                    ⬇️ Download Decrypted File
                  </a>
                </div>
              )}
            </div>
            <div className="bg-slate-800 p-6 rounded-xl shadow-xl border border-slate-700 mb-12">
              <h3 className="text-2xl font-bold text-blue-400 mb-4">⚙️ Smart Contract Rule Simulator</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <input type="text" placeholder="User (e.g., Alice)" value={user} onChange={(e) => setUser(e.target.value)} className="p-2 rounded bg-slate-700 text-white" />
                <input type="text" placeholder="File (e.g., file.pdf)" value={file} onChange={(e) => setFile(e.target.value)} className="p-2 rounded bg-slate-700 text-white" />
                <DatePicker selected={until} onChange={(date) => setUntil(date)} showTimeSelect placeholderText="Access Until" className="p-2 rounded bg-slate-700 text-white" dateFormat="Pp" />
              </div>
              <button onClick={() => {
                if (user && file && until) {
                  const newRule = { user, file, until };
                  setRules([...rules, newRule]);
                  setUser('');
                  setFile('');
                  setUntil(null);
                }
              }} className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded">
                ➕ Add Rule
              </button>
              <div className="mt-6">
                <h4 className="text-lg font-semibold text-white mb-2">Current Rules</h4>
                {rules.length === 0 ? (
                  <p className="text-slate-400">No rules added yet.</p>
                ) : (
                  <ul className="space-y-2">
                    {rules.map((rule, index) => (
                      <li key={index} className="bg-slate-700 p-3 rounded text-white text-sm">
                        IF <strong>{rule.user}</strong> CAN ACCESS <strong>{rule.file}</strong> UNTIL <strong>{new Date(rule.until).toLocaleString()}</strong>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            <div className="bg-slate-800 p-6 rounded-xl shadow-xl border border-slate-700 mb-12">
              <h3 className="text-2xl font-bold text-blue-400 mb-4">🧪 File Integrity Verifier</h3>
              <div className="mb-4">
                <label className="block text-white mb-2 font-semibold">Original File</label>
                <input type="file" className="text-white" onChange={async (e) => {
                  const file = e.target.files[0];
                  setOriginalFile(file);
                  const buffer = await file.arrayBuffer();
                  const wordArray = CryptoJS.lib.WordArray.create(buffer);
                  const hash = CryptoJS.SHA256(wordArray).toString(CryptoJS.enc.Hex);
                  setOriginalHash(hash);
                }} />
                {originalHash && <p className="mt-2 text-sm text-emerald-400">SHA-256: <code>{originalHash}</code></p>}
              </div>
              <div className="mb-4">
                <label className="block text-white mb-2 font-semibold">Verification File</label>
                <input type="file" className="text-white" onChange={async (e) => {
                  const file = e.target.files[0];
                  setVerificationFile(file);
                  const buffer = await file.arrayBuffer();
                  const wordArray = CryptoJS.lib.WordArray.create(buffer);
                  const hash = CryptoJS.SHA256(wordArray).toString(CryptoJS.enc.Hex);
                  setVerificationHash(hash);
                }} />
                {verificationHash && <p className="mt-2 text-sm text-blue-400">SHA-256: <code>{verificationHash}</code></p>}
              </div>
              <button className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded" onClick={() => {
                if (originalHash && verificationHash) setIsMatch(originalHash === verificationHash);
              }}>✅ Verify Integrity</button>
              {isMatch !== null && (
                <p className={`mt-4 font-semibold ${isMatch ? 'text-green-400' : 'text-red-400'}`}>
                  {isMatch ? '✔️ Files Match' : '❌ Files Do Not Match'}
                </p>
              )}
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h4 className="font-bold mb-4 text-blue-400">🖱️ User Actions</h4>
                <div className="space-y-4">
                  {[
                    { label: "Upload File", tab: "upload" },
                    { label: "Share File", tab: "demo", ref: shareComponentRef },
                    { label: "Manage Shares", tab: "manage shares" },
                    { label: "View Audit Log", scrollTo: "audit" },
                  ].map(({ label, tab, scrollTo, ref }, i) => (
                    <button
                      key={i}
                      className="w-full text-left p-3 rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors"
                      onClick={() => {
                        if (tab) setActiveTab(tab);
                        if (ref) {
                          setTimeout(() => ref.current?.scrollIntoView({ behavior: 'smooth' }), 100);
                        }
                        if (scrollTo && scrollTo === 'audit') {
                          fetchAuditLogs();
                          setTimeout(() => {
                            const el = document.querySelector("#audit-log-section");
                            el?.scrollIntoView({ behavior: 'smooth' });
                          }, 100);
                        }
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div id="audit-log-section">
                <div className="bg-slate-800 p-4 rounded-lg mb-4 border border-slate-700">
                  <h5 className="text-lg font-semibold mb-3 text-white">Filter Logs</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {isAdminRole(userRoles) && (
                      <input
                        type="text"
                        placeholder="Filter by User Email"
                        className="p-2 rounded bg-slate-700 text-white"
                        value={auditFilters.userEmail}
                        onChange={e => setAuditFilters({ ...auditFilters, userEmail: e.target.value })}
                      />
                    )}
                    <select
                      className="p-2 rounded bg-slate-700 text-white"
                      value={auditFilters.action}
                      onChange={e => setAuditFilters({ ...auditFilters, action: e.target.value })}
                    >
                      <option value="">All Actions</option>
                      <option value="UPLOAD">Upload</option>
                      <option value="SHARE_FILE">Share File</option>
                      <option value="DOWNLOAD_DIRECT">Direct Download</option>
                      <option value="DOWNLOAD_VIA_LINK">Link Download</option>
                      <option value="DELETE_FILE">Delete File</option>
                      <option value="REVOKE_ACCESS">Revoke Access</option>
                    </select>
                    <DatePicker
                      selected={auditFilters.startDate}
                      onChange={date => setAuditFilters({ ...auditFilters, startDate: date })}
                      placeholderText="Start Date"
                      className="p-2 w-full rounded bg-slate-700 text-white"
                    />
                    <DatePicker
                      selected={auditFilters.endDate}
                      onChange={date => setAuditFilters({ ...auditFilters, endDate: date })}
                      placeholderText="End Date"
                      className="p-2 w-full rounded bg-slate-700 text-white"
                    />
                  </div>
                  <button
                    onClick={fetchAuditLogs}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500"
                  >
                    Apply Filters
                  </button>
                </div>
                <h4 className="font-bold mb-4 text-blue-400">🧾 Audit Log Viewer</h4>
                <div id="audit-log" className="bg-slate-800 p-4 rounded-lg h-64 overflow-y-auto border border-slate-700">
                  {loadingLogs ? (
                    <p className="text-gray-400">Loading logs...</p>
                  ) : auditLogs.length > 0 ? (
                    auditLogs.map((log) => (
                      <div key={log._id} className="text-sm text-gray-300 mb-2 border-b border-slate-700 pb-1">
                        <p>
                          <strong>Action:</strong> <span className="text-blue-400 font-semibold">{log.action}</span>
                        </p>
                        <p>
                          <strong>User:</strong> {log.userEmail || 'System'}
                        </p>
                        <p>
                          <strong>Time:</strong> {new Date(log.timestamp).toLocaleString()}
                        </p>
                        {log.meta && (
                          <p className="text-xs text-slate-400 truncate">
                            <strong>Meta:</strong> {JSON.stringify(log.meta)}
                          </p>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-400">No audit logs found. Perform an action to see logs here.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Login Section */}
      {activeTab === 'login' && !token && (
        <section ref={loginRef} className="py-20 px-4 relative z-10">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-16">
              <LoginPage
                onLogin={() => setActiveTab('demo')}
                setToken={setToken}
                setUserEmail={setUserEmail}
                setUserRoles={setUserRoles}
                mode={authMode}
                onModeChange={setAuthMode}
              />
            </div>
          </div>
        </section>
      )}

      {/* Roles Section */}
      {activeTab === 'roles' && (
        <section className="py-20 px-4 relative z-10">
          <div className="container mx-auto max-w-6xl">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-emerald-400 text-transparent bg-clip-text">
              Manage Roles
            </h2>
            <div className="mb-6">
              <input
                type="text"
                placeholder="Role name"
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="px-4 py-2 rounded bg-slate-700 text-white mr-4"
              />
              <label className="text-white mr-2">
                <input
                  type="checkbox"
                  checked={permissions.upload}
                  onChange={(e) =>
                    setPermissions({ ...permissions, upload: e.target.checked })
                  }
                  className="mr-1"
                />
                Upload
              </label>
              <label className="text-white mr-2">
                <input
                  type="checkbox"
                  checked={permissions.download}
                  onChange={(e) =>
                    setPermissions({ ...permissions, download: e.target.checked })
                  }
                  className="mr-1"
                />
                Download
              </label>
              <label className="text-white">
                <input
                  type="checkbox"
                  checked={permissions.revoke}
                  onChange={(e) =>
                    setPermissions({ ...permissions, revoke: e.target.checked })
                  }
                  className="mr-1"
                />
                Revoke
              </label>
              <button
                onClick={handleAddRole}
                className="ml-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500"
              >
                Add Role
              </button>
            </div>
            <table className="w-full text-white border-collapse border border-slate-700 mb-12">
              <thead>
                <tr className="bg-slate-800">
                  <th className="p-2 border border-slate-700">Role</th>
                  <th className="p-2 border border-slate-700">Upload</th>
                  <th className="p-2 border border-slate-700">Download</th>
                  <th className="p-2 border border-slate-700">Revoke</th>
                </tr>
              </thead>
              <tbody>
                {roles.map((role, i) => (
                  <tr key={i} className="text-center">
                    <td className="p-2 border border-slate-700">{role.name}</td>
                    <td className="p-2 border border-slate-700">{role.upload ? '✅' : '❌'}</td>
                    <td className="p-2 border border-slate-700">{role.download ? '✅' : '❌'}</td>
                    <td className="p-2 border border-slate-700">{role.revoke ? '✅' : '❌'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="bg-slate-800 p-6 rounded-xl shadow-xl border border-slate-700">
              <h3 className="text-2xl font-bold text-blue-400 mb-4">🎮 Live Role Simulation</h3>
              <div className="flex space-x-2 mb-4">
                <button
                  className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded"
                  onClick={() => {
                    const output = roles.map(r =>
                      `👤 ${r.name}: ${r.upload ? '⬆️ Upload ' : ''}${r.download ? '⬇️ Download ' : ''}${r.revoke ? '🚫 Revoke ' : ''}`
                    ).join('\n');
                    setSimulationOutput(output);
                  }}
                >
                  ▶️ Start Simulation
                </button>
                <button
                  className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded"
                  onClick={() => {
                    setRoles([
                      { name: 'admin', upload: true, download: true, revoke: true },
                      { name: 'user', upload: true, download: true, revoke: false }
                    ]);
                    alert("🔄 Roles have been reset to default.");
                  }}
                >
                  🔄 Reset
                </button>
              </div>
              {simulationOutput && (
                <pre className="bg-slate-700 p-4 mt-4 rounded text-white text-sm whitespace-pre-wrap">
                  {simulationOutput}
                </pre>
              )}
              <div className="mt-4 bg-slate-700 p-4 rounded text-white text-sm">
                <h4 className="font-semibold mb-2">🧠 Current Role Permissions</h4>
                {roles.length === 0 ? (
                  <p className="text-slate-400">No roles configured.</p>
                ) : (
                  <ul className="list-disc ml-5 space-y-1">
                    {roles.map((role, i) => (
                      <li key={i}>
                        <strong>{role.name}</strong>:
                        {role.upload ? '⬆️ Upload ' : ''}
                        {role.download ? '⬇️ Download ' : ''}
                        {role.revoke ? '🚫 Revoke ' : ''}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <p className="text-slate-300">
                This section will simulate how roles with specific permissions behave under different access scenarios.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Manage Shares Section - Combined Sent & Received */}
      {activeTab === 'manage shares' && (
        <section className="py-20 px-4 relative z-10">
          <div className="container mx-auto max-w-6xl">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-emerald-400 text-transparent bg-clip-text">
              Manage Shared Files
            </h2>
            <button
              onClick={fetchMyShares}
              className="mb-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500"
            >
              {loadingShares ? 'Loading...' : '🔄 Refresh All Shares'}
            </button>

            {/* Sent Shares */}
            <div className="mb-10">
              <h3 className="text-2xl font-bold text-emerald-400 mb-4">📤 Files You Shared</h3>
              <div className="bg-slate-800 p-6 rounded-xl shadow-xl border border-slate-700">
                {loadingShares ? (
                  <p>Loading...</p>
                ) : myShares.length > 0 ? (
                  <table className="w-full text-white text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-600">
                        <th className="p-2">File Name</th>
                        <th className="p-2">Shared With</th>
                        <th className="p-2">Expires At</th>
                        <th className="p-2">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {myShares.map(share => (
                        <tr key={share._id} className="border-b border-slate-700">
                          <td className="p-2">{share.fileId?.originalName || 'N/A'}</td>
                          <td className="p-2">{share.sharedWith}</td>
                          <td className="p-2">{share.expiresAt ? new Date(share.expiresAt).toLocaleString() : 'Never'}</td>
                          <td className="p-2">
                            <button
                              onClick={() => handleRevoke(share._id)}
                              className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-500 text-xs"
                            >
                              Revoke
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-slate-400">You haven't shared any files yet.</p>
                )}
              </div>
            </div>

            {/* Received Shares */}
            <div>
              <h3 className="text-2xl font-bold text-blue-400 mb-4">📥 Files Shared With You</h3>
              <div className="bg-slate-800 p-6 rounded-xl shadow-xl border border-slate-700">
                {loadingShares ? (
                  <p>Loading...</p>
                ) : receivedShares.length > 0 ? (
                  <table className="w-full text-white text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-600">
                        <th className="p-2">File Name</th>
                        <th className="p-2">Shared By</th>
                        <th className="p-2">Expires At</th>
                        <th className="p-2">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {receivedShares.map(share => (
                        <tr key={share._id} className="border-b border-slate-700">
                          <td className="p-2">{share.fileId?.originalName || 'N/A'}</td>
                          <td className="p-2">{share.sharedBy}</td>
                          <td className="p-2">{share.expiresAt ? new Date(share.expiresAt).toLocaleString() : 'Never'}</td>
                          <td className="p-2">
                            <button
                              onClick={() => handleDownloadReceived(share.token)}
                              className="px-3 py-1 bg-emerald-600 text-white rounded hover:bg-emerald-500 text-xs"
                            >
                              Download
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-slate-400">No files have been shared with you yet.</p>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Upload Section */}
      {activeTab === 'upload' && (
        <section className="py-20 px-4 relative z-10">
          <div className="container mx-auto max-w-6xl">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-emerald-400 text-transparent bg-clip-text">
              Upload a File
            </h2>
            <input
              type="file"
              onChange={(e) => setSelectedFile(e.target.files[0])}
              className="mb-4 text-white"
            />
            <button
              onClick={handleUpload}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
            >
              Upload
            </button>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="bg-slate-900/80 backdrop-blur-lg text-white py-12 relative z-10">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <svg className="w-6 h-6 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 4V20M4 12H20" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="font-bold text-xl bg-gradient-to-r from-blue-400 to-emerald-400 text-transparent bg-clip-text">SecureChain</span>
              </div>
              <p className="text-gray-400 mb-4">
                Revolutionizing data security with decentralized audit trails and end-to-end encrypted file sharing.
              </p>
              <div className="flex space-x-4">
                {['twitter', 'linkedin', 'github'].map((social) => (
                  <a key={social} href="#" className="p-2 rounded-full bg-slate-800 hover:bg-blue-900/50 transition-colors">
                    <svg className="w-5 h-5 text-blue-400" viewBox="0 0 24 24" fill="currentColor">
                      <path d={social === 'twitter'
                        ? "M23 3a10.9 10.9 0 01-3.14 1.53A4.48 4.48 0 0012 8v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"
                        : social === 'linkedin'
                          ? "M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6z M2 9h4v12H2z M3 3h2v4H3z"
                          : "M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.82a9.583 9.583 0 012.51.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"}
                      />
                    </svg>
                  </a>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-lg font-bold mb-4">Stay Updated</h4>
              <p className="text-gray-400 mb-4">Subscribe to our newsletter for the latest updates and insights.</p>
              <form className="flex flex-col sm:flex-row gap-2">
                <input
                  type="email"
                  placeholder="Your email"
                  className="px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1"
                  required
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-emerald-600 text-white rounded-lg hover:from-blue-500 hover:to-emerald-500 transition-all"
                >
                  Subscribe
                </button>
              </form>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-slate-800 text-center text-gray-400">
            <p>&copy; 2023 SecureChain. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;