import React, { useState } from 'react';

const RolesSimulator = ({ showToast }) => {
  const [roles, setRoles] = useState([
    { name: 'admin', upload: true, download: true, revoke: true },
    { name: 'user', upload: true, download: true, revoke: false },
    { name: 'auditor', upload: false, download: true, revoke: false },
  ]);

  const [newRole, setNewRole] = useState('');
  const [permissions, setPermissions] = useState({
    upload: true,
    download: true,
    revoke: false,
  });
  const [simulationOutput, setSimulationOutput] = useState('');

  const handleAddRole = (e) => {
    e.preventDefault();
    if (!newRole.trim()) return;
    if (roles.some((r) => r.name.toLowerCase() === newRole.trim().toLowerCase())) {
      showToast?.('Role with this identifier already exists.', 'warning');
      return;
    }
    setRoles([...roles, { name: newRole.trim().toLowerCase(), ...permissions }]);
    setNewRole('');
    setPermissions({ upload: true, download: true, revoke: false });
    showToast?.(`Role "${newRole}" added successfully!`, 'success');
  };

  const handleRunSimulation = () => {
    const output = roles.map(r =>
      `👤 ROLE [${r.name.toUpperCase()}]: ${r.upload ? '✅ Upload (Allowed) ' : '❌ Upload (Blocked) '} | ${r.download ? '✅ Download (Allowed) ' : '❌ Download (Blocked) '} | ${r.revoke ? '✅ Revoke (Allowed)' : '❌ Revoke (Blocked)'}`
    ).join('\n\n');
    setSimulationOutput(output);
    showToast?.('RBAC Permission Matrix simulation executed.', 'info');
  };

  const handleReset = () => {
    setRoles([
      { name: 'admin', upload: true, download: true, revoke: true },
      { name: 'user', upload: true, download: true, revoke: false },
      { name: 'auditor', upload: false, download: true, revoke: false },
    ]);
    setSimulationOutput('');
    showToast?.('Roles reset to system defaults.', 'info');
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-slate-800/80 backdrop-blur-md p-6 rounded-2xl border border-slate-700/80 shadow-xl">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 text-transparent bg-clip-text flex items-center gap-2">
          <span>👥</span> Role-Based Access Control (RBAC) Simulator
        </h2>
        <p className="text-slate-400 text-sm mt-1">
          Configure cryptographic role permissions and evaluate policy enforcement across upload, download, and revocation actions.
        </p>

        {/* Create Role Form */}
        <form onSubmit={handleAddRole} className="mt-6 p-4 bg-slate-900/60 rounded-xl border border-slate-700 flex flex-wrap items-center gap-4 text-sm">
          <input
            type="text"
            placeholder="New role name (e.g. compliance-officer)"
            value={newRole}
            onChange={(e) => setNewRole(e.target.value)}
            className="px-3.5 py-2 rounded-xl bg-slate-800 text-white border border-slate-700 focus:outline-none focus:border-blue-500 text-xs sm:text-sm flex-1 min-w-[200px]"
          />

          <div className="flex items-center gap-4 text-xs font-semibold text-slate-300">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={permissions.upload}
                onChange={(e) => setPermissions({ ...permissions, upload: e.target.checked })}
                className="rounded accent-blue-600"
              />
              Upload
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={permissions.download}
                onChange={(e) => setPermissions({ ...permissions, download: e.target.checked })}
                className="rounded accent-blue-600"
              />
              Download
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={permissions.revoke}
                onChange={(e) => setPermissions({ ...permissions, revoke: e.target.checked })}
                className="rounded accent-blue-600"
              />
              Revoke
            </label>
          </div>

          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-xs transition shadow-md"
          >
            + Add Role
          </button>
        </form>
      </div>

      {/* Roles Matrix Table */}
      <div className="bg-slate-800/80 backdrop-blur-md rounded-2xl border border-slate-700/80 shadow-xl overflow-hidden">
        <div className="p-4 border-b border-slate-700 bg-slate-900/40 flex justify-between items-center">
          <h3 className="font-bold text-white text-sm">Configured Access Roles</h3>
          <span className="text-xs text-slate-400">{roles.length} roles active</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-900/60 text-xs uppercase text-slate-400 tracking-wider">
              <tr>
                <th className="px-6 py-3">Role Name</th>
                <th className="px-6 py-3 text-center">Can Upload</th>
                <th className="px-6 py-3 text-center">Can Download</th>
                <th className="px-6 py-3 text-center">Can Revoke</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {roles.map((r, i) => (
                <tr key={i} className="hover:bg-slate-700/30 transition">
                  <td className="px-6 py-4 font-semibold text-white uppercase text-xs tracking-wider">
                    {r.name}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2 py-0.5 rounded text-xs ${r.upload ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'}`}>
                      {r.upload ? 'Allowed ✅' : 'Denied ❌'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2 py-0.5 rounded text-xs ${r.download ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'}`}>
                      {r.download ? 'Allowed ✅' : 'Denied ❌'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2 py-0.5 rounded text-xs ${r.revoke ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'}`}>
                      {r.revoke ? 'Allowed ✅' : 'Denied ❌'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Simulator Actions */}
      <div className="bg-slate-800/80 backdrop-blur-md p-6 rounded-2xl border border-slate-700/80 shadow-xl space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-white text-base">Policy Evaluation Simulator</h3>
          <div className="flex gap-2">
            <button
              onClick={handleRunSimulation}
              className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-semibold transition shadow-md"
            >
              ▶ Run Access Simulation
            </button>
            <button
              onClick={handleReset}
              className="px-3.5 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl text-xs font-medium transition"
            >
              Reset Roles
            </button>
          </div>
        </div>

        {simulationOutput && (
          <pre className="p-4 bg-slate-950 rounded-xl text-emerald-400 font-mono text-xs border border-slate-800 whitespace-pre-wrap animate-fade-in">
            {simulationOutput}
          </pre>
        )}
      </div>
    </div>
  );
};

export default RolesSimulator;
