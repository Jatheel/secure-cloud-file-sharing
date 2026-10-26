import React, { useState, useEffect } from 'react';
import { auditAPI } from '../services/api';

const ActivityTimeline = ({ showToast }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTimeline = async () => {
    setLoading(true);
    try {
      const res = await auditAPI.getAuditLogs({ limit: 40 });
      setEvents(res.data?.logs || []);
    } catch (err) {
      console.error('Error fetching timeline events:', err);
      showToast?.('Failed to load activity timeline.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimeline();
  }, []);

  const getTimelineIcon = (action) => {
    if (action.includes('UPLOAD')) return { icon: '⬆️', bg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' };
    if (action.includes('SHARE')) return { icon: '🔗', bg: 'bg-blue-500/20 text-blue-400 border-blue-500/40' };
    if (action.includes('DOWNLOAD')) return { icon: '⬇️', bg: 'bg-purple-500/20 text-purple-400 border-purple-500/40' };
    if (action.includes('REVOKE') || action.includes('DELETE')) return { icon: '🗑️', bg: 'bg-amber-500/20 text-amber-400 border-amber-500/40' };
    if (action.includes('DENIED') || action.includes('FAILED')) return { icon: '❌', bg: 'bg-red-500/20 text-red-400 border-red-500/40' };
    return { icon: '📌', bg: 'bg-slate-700 text-slate-300 border-slate-600' };
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-800/80 backdrop-blur-md p-6 rounded-2xl border border-slate-700/80 shadow-xl">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 text-transparent bg-clip-text flex items-center gap-2">
            <span>⏱️</span> Security Activity Timeline
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Real-time chronological activity feed tracing all upload, access grant, and download actions.
          </p>
        </div>
        <button
          onClick={fetchTimeline}
          className="px-3.5 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl text-sm transition border border-slate-600"
          title="Refresh timeline"
        >
          ↻
        </button>
      </div>

      {loading ? (
        <div className="bg-slate-800/80 backdrop-blur-md p-12 rounded-2xl border border-slate-700/80 text-center text-slate-400">
          <svg className="animate-spin w-8 h-8 mx-auto mb-3 text-blue-500" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          Loading security timeline...
        </div>
      ) : events.length === 0 ? (
        <div className="bg-slate-800/80 backdrop-blur-md p-12 rounded-2xl border border-slate-700/80 text-center text-slate-400">
          No security events recorded yet in the timeline.
        </div>
      ) : (
        <div className="relative pl-6 sm:pl-8 space-y-6 before:content-[''] before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-gradient-to-b before:from-blue-500 before:via-emerald-500 before:to-purple-500">
          {events.map((ev, idx) => {
            const { icon, bg } = getTimelineIcon(ev.action);
            return (
              <div key={ev._id || idx} className="relative group">
                {/* Timeline node icon */}
                <div
                  className={`absolute -left-6 sm:-left-8 top-1.5 w-6 h-6 sm:w-8 sm:h-8 rounded-full border flex items-center justify-center text-xs sm:text-sm shadow-md transition-transform group-hover:scale-110 ${bg}`}
                >
                  {icon}
                </div>

                {/* Event Card */}
                <div className="bg-slate-800/80 backdrop-blur-md p-5 rounded-2xl border border-slate-700/70 shadow-lg transition-all hover:border-slate-600">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1 mb-2">
                    <span className="text-sm font-bold text-white flex items-center gap-2">
                      <span>{ev.action}</span>
                      {!ev.success && (
                        <span className="text-[10px] uppercase font-bold text-red-400 bg-red-950/60 px-2 py-0.5 rounded-full border border-red-500/40">
                          Denied
                        </span>
                      )}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      {new Date(ev.timestamp).toLocaleString()}
                    </span>
                  </div>

                  <div className="text-xs text-slate-300">
                    Initiated by: <span className="font-semibold text-blue-300">{ev.userEmail || 'System'}</span>
                    {ev.ip && <span className="text-slate-500 ml-2">({ev.ip})</span>}
                  </div>

                  {ev.meta && (
                    <div className="mt-3 p-2.5 bg-slate-900/80 rounded-xl border border-slate-800 text-xs text-slate-300 flex flex-wrap gap-x-4 gap-y-1">
                      {ev.meta.originalName && (
                        <div>
                          <span className="text-slate-500">File: </span>
                          <span className="text-emerald-300 font-medium">{ev.meta.originalName}</span>
                        </div>
                      )}
                      {ev.meta.sharedWith && (
                        <div>
                          <span className="text-slate-500">Recipient: </span>
                          <span className="text-purple-300 font-medium">{ev.meta.sharedWith}</span>
                        </div>
                      )}
                      {ev.meta.downloadCount !== undefined && (
                        <div>
                          <span className="text-slate-500">Downloads: </span>
                          <span className="text-blue-300 font-medium">{ev.meta.downloadCount}</span>
                        </div>
                      )}
                      {ev.meta.reason && (
                        <div className="text-red-300">
                          <span className="text-slate-500">Reason: </span>
                          {ev.meta.reason}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ActivityTimeline;
