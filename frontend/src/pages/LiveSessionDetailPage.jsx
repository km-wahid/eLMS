import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import liveService from '../services/liveService';
import { useLiveChat } from '../hooks/useLiveChat';
import { Send, MessageSquare, Wifi, WifiOff } from 'lucide-react';

const PLATFORMS = { zoom: '🎥 Zoom', jitsi: '🔵 Jitsi', meet: '🟢 Meet', teams: '💜 Teams', other: '🌐 Other' };
const STATUS_STYLES = {
  scheduled: 'bg-blue-100 text-blue-700',
  live:      'bg-red-100 text-red-700',
  ended:     'bg-gray-100 text-gray-600',
  cancelled: 'bg-yellow-100 text-yellow-700',
};

function Countdown({ scheduledAt }) {
  const [diff, setDiff] = useState(null);
  useEffect(() => {
    const calc = () => { const ms = new Date(scheduledAt) - Date.now(); setDiff(ms > 0 ? ms : 0); };
    calc();
    const t = setInterval(calc, 1000);
    return () => clearInterval(t);
  }, [scheduledAt]);
  if (diff === null || diff <= 0) return <span className="text-green-600 font-medium text-sm">Session is starting now!</span>;
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return <span className="text-indigo-600 font-mono text-sm">Starts in {h > 0 ? `${h}h ` : ""}{m}m {s}s</span>;
}

function ChatPanel({ sessionId }) {
  const { messages, connected, sendMessage } = useLiveChat(sessionId);
  const [text,    setText]    = useState("");
  const bottomRef             = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    sendMessage(trimmed);
    setText("");
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-indigo-600" />
          <span className="font-semibold text-sm text-gray-800 dark:text-gray-100">Live Chat</span>
        </div>
        <span className={`flex items-center gap-1 text-xs ${connected ? "text-green-600" : "text-gray-400"}`}>
          {connected ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
          {connected ? "Connected" : "Connecting…"}
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.length === 0 && (
          <p className="text-center text-gray-400 text-sm pt-8">No messages yet. Say hi! 👋</p>
        )}
        {messages.map((msg, i) => (
          <div key={i}>
            {msg.type === "system" ? (
              <p className="text-center text-xs text-gray-400 italic">{msg.message}</p>
            ) : (
              <div className="space-y-0.5">
                <div className="flex items-baseline gap-2">
                  <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-400">{msg.sender}</span>
                  <span className="text-xs text-gray-400">{msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString() : ""}</span>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-200">{msg.message}</p>
              </div>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="flex gap-2 px-3 py-3 border-t border-gray-200 dark:border-gray-700">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message…"
          className="flex-1 text-sm rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-1.5 bg-gray-50 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
          disabled={!connected}
        />
        <button
          type="submit"
          disabled={!connected || !text.trim()}
          className="p-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}

export default function LiveSessionDetailPage() {
  const { slug, id } = useParams();
  const { user }     = useAuthStore();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState("");

  useEffect(() => {
    liveService.getSession(slug, id)
      .then((r) => setSession(r.data))
      .finally(() => setLoading(false));
  }, [slug, id]);

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
    </div>
  );
  if (!session) return <div className="text-center py-20 text-red-600">Session not found.</div>;

  const isTeacher  = user?.role === "teacher" || user?.role === "admin";
  const isLive     = session.status === "live";
  const isEnded    = session.status === "ended";
  const canJoin    = session.is_joinable && session.meeting_url;
  const showChat   = isLive;

  const doAction = async (fn, ...args) => {
    try {
      const r = await fn(slug, id, ...args);
      setSession(r.data);
      setActionMsg("Updated.");
    } catch (e) {
      setActionMsg(e.response?.data?.detail || "Error");
    }
    setTimeout(() => setActionMsg(""), 3000);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero */}
      <div className={`py-12 px-4 ${isLive ? "bg-red-700" : "bg-gradient-to-r from-indigo-700 to-purple-700"}`}>
        <div className="max-w-5xl mx-auto">
          <Link to={`/courses/${slug}/live`} className="text-white/70 hover:text-white text-sm mb-4 inline-block">
            ← Back to Live Classes
          </Link>
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${STATUS_STYLES[session.status]}`}>
              {isLive && <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse mr-1.5" />}
              {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
            </span>
            <span className="text-white/80 text-sm">{PLATFORMS[session.platform] || session.platform}</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-1">{session.title}</h1>
          {session.description && <p className="text-white/80 text-sm mt-1">{session.description}</p>}

          <div className="mt-4 flex flex-wrap items-center gap-4">
            {session.status === "scheduled" && (
              <Countdown scheduledAt={session.scheduled_at} />
            )}
            {canJoin && (
              <a href={session.meeting_url} target="_blank" rel="noreferrer"
                 className="px-6 py-2 bg-white text-indigo-700 font-semibold rounded-lg hover:bg-indigo-50 transition-colors">
                Join Now →
              </a>
            )}
          </div>

          {/* Teacher actions */}
          {isTeacher && (
            <div className="mt-4 flex flex-wrap gap-3">
              {session.status === "scheduled" && (
                <button onClick={() => doAction(liveService.goLive)}
                  className="px-4 py-1.5 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600">
                  🔴 Go Live
                </button>
              )}
              {session.status === "live" && (
                <button onClick={() => {
                  const rec = prompt("Recording URL (optional):");
                  doAction(liveService.endSession, rec);
                }}
                  className="px-4 py-1.5 bg-gray-700 text-white rounded-lg text-sm hover:bg-gray-800">
                  ⏹ End Session
                </button>
              )}
              {(session.status === "scheduled" || session.status === "live") && (
                <button onClick={() => doAction(liveService.cancelSession)}
                  className="px-4 py-1.5 bg-yellow-500 text-white rounded-lg text-sm hover:bg-yellow-600">
                  Cancel
                </button>
              )}
            </div>
          )}
          {actionMsg && <p className="mt-2 text-sm text-white/90">{actionMsg}</p>}
        </div>
      </div>

      {/* Body */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className={`grid gap-6 ${showChat ? "md:grid-cols-3" : "md:grid-cols-1"}`}>
          {/* Details card */}
          <div className={`${showChat ? "md:col-span-2" : ""} space-y-6`}>
            {/* Info */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Session Details</h2>
              <dl className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-gray-500 font-medium">Scheduled</dt>
                  <dd className="text-gray-800 dark:text-gray-200 mt-1">
                    {new Date(session.scheduled_at).toLocaleString()}
                  </dd>
                </div>
                {session.duration_minutes && (
                  <div>
                    <dt className="text-gray-500 font-medium">Duration</dt>
                    <dd className="text-gray-800 dark:text-gray-200 mt-1">{session.duration_minutes} minutes</dd>
                  </div>
                )}
                {session.meeting_id && (
                  <div>
                    <dt className="text-gray-500 font-medium">Meeting ID</dt>
                    <dd className="font-mono text-gray-800 dark:text-gray-200 mt-1">{session.meeting_id}</dd>
                  </div>
                )}
                {session.passcode && (
                  <div>
                    <dt className="text-gray-500 font-medium">Passcode</dt>
                    <dd className="font-mono text-gray-800 dark:text-gray-200 mt-1">{session.passcode}</dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Recording */}
            {isEnded && session.recording_url && (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3">Recording</h2>
                <video src={session.recording_url} controls className="w-full rounded-lg max-h-80" />
                <a href={session.recording_url} target="_blank" rel="noreferrer"
                   className="mt-2 inline-block text-sm text-indigo-600 hover:underline">
                  Open recording in new tab
                </a>
              </div>
            )}
          </div>

          {/* Chat panel */}
          {showChat && (
            <div className="md:col-span-1 h-[500px]">
              <ChatPanel sessionId={id} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
