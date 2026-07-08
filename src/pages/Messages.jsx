import { useState, useEffect, useRef, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import { AccountGear } from '../components/AccountDrawer';
import NotificationBell from '../components/NotificationBell';
import {
  Search, Plus, Send, Users, ArrowLeft, MoreVertical, UserPlus,
  Bell, BellOff, Ban, Flag, LogOut, X, MessageSquare, Shield,
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080';
const WS_BASE = API_BASE.replace(/^http/, 'ws');
const token = () => localStorage.getItem('mindspace_token');

const PALETTE = ['bg-indigo-600', 'bg-emerald-600', 'bg-orange-600', 'bg-rose-600', 'bg-sky-600', 'bg-purple-600'];
function colorFor(name) {
  let h = 0;
  for (const ch of name || '') h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return PALETTE[h % PALETTE.length];
}
function timeAgo(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const s = (Date.now() - d.getTime()) / 1000;
  if (Number.isNaN(s)) return '';
  if (s < 60) return 'now';
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  if (s < 172800) return 'yesterday';
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}
function clockTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

async function api(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token()}`,
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    let msg = 'Something went wrong.';
    try { msg = (await res.json()).message || msg; } catch (e) {}
    throw new Error(msg);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

export default function Messages() {
  const [conversations, setConversations] = useState([]);
  const [active, setActive] = useState(null);       // ConversationDetail
  const [loadingConv, setLoadingConv] = useState(false);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');
  const [sheet, setSheet] = useState(null);          // 'new' | 'group' | 'add' | null
  const [menuOpen, setMenuOpen] = useState(false);
  const scrollRef = useRef(null);
  const wsRef = useRef(null);
  const activeIdRef = useRef(null);

  activeIdRef.current = active?.id || null;

  const loadConversations = useCallback(async () => {
    try { setConversations(await api('/api/chat/conversations')); }
    catch (e) { setError(e.message); }
  }, []);

  const openConversation = useCallback(async (id) => {
    setLoadingConv(true);
    setMenuOpen(false);
    try {
      const detail = await api(`/api/chat/conversations/${id}`);
      setActive(detail);
      // Clear the unread badge locally.
      setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, unread: 0 } : c)));
    } catch (e) { setError(e.message); }
    finally { setLoadingConv(false); }
  }, []);

  // Initial load.
  useEffect(() => { loadConversations(); }, [loadConversations]);

  // Live socket.
  useEffect(() => {
    if (!token()) return;
    const ws = new WebSocket(`${WS_BASE}/ws/chat?token=${encodeURIComponent(token())}`);
    wsRef.current = ws;
    ws.onmessage = (ev) => {
      let data;
      try { data = JSON.parse(ev.data); } catch { return; }
      if (data.type !== 'message') return;
      const { conversationId, message } = data;
      // If it's the open conversation, append (dedupe by id).
      if (conversationId === activeIdRef.current) {
        setActive((prev) => {
          if (!prev || prev.id !== conversationId) return prev;
          if (prev.messages.some((m) => m.id === message.id)) return prev;
          return { ...prev, messages: [...prev.messages, message] };
        });
      }
      // Update the sidebar list (last message + unread bump for others).
      setConversations((prev) => {
        const idx = prev.findIndex((c) => c.id === conversationId);
        if (idx === -1) { loadConversations(); return prev; }
        const copy = [...prev];
        const bumpUnread = conversationId !== activeIdRef.current && !message.mine;
        copy[idx] = {
          ...copy[idx],
          lastMessage: message.content,
          lastMessageAt: message.createdAt,
          unread: bumpUnread ? (copy[idx].unread || 0) + 1 : copy[idx].unread,
        };
        // Move to top.
        const [item] = copy.splice(idx, 1);
        return [item, ...copy];
      });
    };
    ws.onclose = () => { wsRef.current = null; };
    return () => { try { ws.close(); } catch (e) {} };
  }, [loadConversations]);

  // Auto-scroll to newest.
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [active?.messages?.length, active?.id]);

  const send = async () => {
    const content = draft.trim();
    if (!content || !active) return;
    setDraft('');
    try {
      const msg = await api(`/api/chat/conversations/${active.id}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content }),
      });
      setActive((prev) => {
        if (!prev || prev.id !== active.id) return prev;
        if (prev.messages.some((m) => m.id === msg.id)) return prev;
        return { ...prev, messages: [...prev.messages, msg] };
      });
      setConversations((prev) => prev.map((c) =>
        c.id === active.id ? { ...c, lastMessage: content, lastMessageAt: msg.createdAt } : c));
    } catch (e) { setError(e.message); setDraft(content); }
  };

  const doMenuAction = async (fn) => {
    setMenuOpen(false);
    try { await fn(); } catch (e) { setError(e.message); }
  };

  const toggleMute = () => doMenuAction(async () => {
    const cur = conversations.find((c) => c.id === active.id);
    const muted = !(cur?.muted);
    await api(`/api/chat/conversations/${active.id}/mute`, { method: 'POST', body: JSON.stringify({ muted }) });
    setConversations((prev) => prev.map((c) => (c.id === active.id ? { ...c, muted } : c)));
  });

  const leaveConversation = () => doMenuAction(async () => {
    if (!window.confirm(active.type === 'GROUP' ? 'Leave this group?' : 'Delete this conversation?')) return;
    await api(`/api/chat/conversations/${active.id}/leave`, { method: 'POST' });
    setActive(null);
    loadConversations();
  });

  const blockOther = () => doMenuAction(async () => {
    const otherId = otherUserId(active);
    if (!otherId) return;
    if (!window.confirm('Block this user? They will no longer be able to message you.')) return;
    await api('/api/chat/block', { method: 'POST', body: JSON.stringify({ userId: otherId }) });
    setError('User blocked.');
  });

  const reportOther = () => doMenuAction(async () => {
    const reason = window.prompt('Briefly describe the problem (this goes to the MindSpace team):');
    if (reason == null) return;
    await api('/api/chat/report', {
      method: 'POST',
      body: JSON.stringify({ userId: otherUserId(active), conversationId: active.id, reason }),
    });
    setError('Report sent. Thank you — our team will review it.');
  });

  const cur = conversations.find((c) => c.id === active?.id);

  return (
    <div className="flex h-screen bg-[var(--bg)] text-[var(--text)]">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--border)] shrink-0">
          <div className="flex items-center gap-2">
            <MessageSquare size={20} className="text-indigo-400" />
            <h1 className="text-lg font-semibold">Messages</h1>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <AccountGear />
          </div>
        </div>

        {error && (
          <div className="mx-4 mt-3 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError('')}><X size={14} /></button>
          </div>
        )}

        <div className="flex flex-1 min-h-0">
          {/* Conversation list */}
          <div className={`w-full sm:w-80 border-r border-[var(--border)] flex flex-col min-h-0 ${active ? 'hidden sm:flex' : 'flex'}`}>
            <div className="p-3 flex gap-2 shrink-0">
              <button
                onClick={() => setSheet('new')}
                className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl py-2 text-sm font-medium transition-colors"
              >
                <Plus size={16} /> New chat
              </button>
              <button
                onClick={() => setSheet('group')}
                title="New group"
                className="w-10 flex items-center justify-center bg-[var(--card-2)] border border-[var(--border)] rounded-xl hover:border-indigo-500 transition-colors"
              >
                <Users size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto min-h-0">
              {conversations.length === 0 && (
                <div className="text-center px-6 py-16 text-[var(--text-dim)]">
                  <MessageSquare size={28} className="mx-auto mb-3" />
                  <p className="text-sm text-[var(--text-muted)] mb-1">No conversations yet</p>
                  <p className="text-xs">Tap “New chat” to message another member.</p>
                </div>
              )}
              {conversations.map((c) => (
                <button
                  key={c.id}
                  onClick={() => openConversation(c.id)}
                  className={`w-full flex items-center gap-3 px-3 py-3 text-left hover:bg-[var(--card-2)] transition-colors ${active?.id === c.id ? 'bg-[var(--card-2)]' : ''}`}
                >
                  <div className={`w-11 h-11 rounded-full ${colorFor(c.title)} flex items-center justify-center text-sm font-semibold shrink-0 relative`}>
                    {c.type === 'GROUP' ? <Users size={18} /> : c.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-sm truncate">{c.title}{c.type === 'GROUP' && <span className="text-[var(--text-dim)] font-normal"> · {c.memberCount}</span>}</span>
                      <span className="text-[11px] text-[var(--text-dim)] shrink-0">{timeAgo(c.lastMessageAt)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-[var(--text-muted)] truncate">{c.lastMessage || 'No messages yet'}</span>
                      {c.unread > 0 && (
                        <span className="shrink-0 min-w-[18px] h-[18px] px-1 rounded-full bg-indigo-500 text-white text-[10px] font-semibold flex items-center justify-center">{c.unread}</span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Thread */}
          <div className={`flex-1 flex flex-col min-h-0 ${active ? 'flex' : 'hidden sm:flex'}`}>
            {!active ? (
              <div className="flex-1 flex flex-col items-center justify-center text-[var(--text-dim)]">
                <MessageSquare size={40} className="mb-3" />
                <p className="text-sm">Select a conversation to start messaging</p>
              </div>
            ) : (
              <>
                {/* Thread header */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border)] shrink-0">
                  <button onClick={() => setActive(null)} className="sm:hidden text-[var(--text-muted)]"><ArrowLeft size={20} /></button>
                  <div className={`w-9 h-9 rounded-full ${colorFor(active.title)} flex items-center justify-center text-sm font-semibold shrink-0`}>
                    {active.type === 'GROUP' ? <Users size={16} /> : active.title?.charAt(0)?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{active.title}</p>
                    <p className="text-xs text-[var(--text-dim)] truncate">
                      {active.type === 'GROUP'
                        ? active.members.map((m) => m.username).join(', ')
                        : 'Direct message'}
                    </p>
                  </div>
                  <div className="relative">
                    <button onClick={() => setMenuOpen((o) => !o)} className="text-[var(--text-muted)] hover:text-[var(--text)] p-1"><MoreVertical size={18} /></button>
                    {menuOpen && (
                      <div className="absolute right-0 top-9 z-20 w-52 bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-xl py-1 text-sm">
                        {active.type === 'GROUP' && (
                          <button onClick={() => { setMenuOpen(false); setSheet('add'); }} className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-[var(--card-2)] text-left">
                            <UserPlus size={15} /> Add people
                          </button>
                        )}
                        <button onClick={toggleMute} className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-[var(--card-2)] text-left">
                          {cur?.muted ? <><Bell size={15} /> Unmute</> : <><BellOff size={15} /> Mute</>}
                        </button>
                        {active.type === 'DIRECT' && (
                          <>
                            <button onClick={blockOther} className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-[var(--card-2)] text-left text-rose-300">
                              <Ban size={15} /> Block user
                            </button>
                            <button onClick={reportOther} className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-[var(--card-2)] text-left text-amber-300">
                              <Flag size={15} /> Report
                            </button>
                          </>
                        )}
                        <button onClick={leaveConversation} className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-[var(--card-2)] text-left text-rose-300">
                          <LogOut size={15} /> {active.type === 'GROUP' ? 'Leave group' : 'Delete chat'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Messages */}
                <div ref={scrollRef} className="flex-1 overflow-y-auto min-h-0 px-4 py-4 flex flex-col gap-2">
                  {loadingConv && <p className="text-center text-xs text-[var(--text-dim)]">Loading…</p>}
                  {active.messages.map((m) => (
                    <div key={m.id} className={`flex flex-col max-w-[78%] ${m.mine ? 'self-end items-end' : 'self-start items-start'}`}>
                      {active.type === 'GROUP' && !m.mine && (
                        <span className="text-[11px] text-[var(--text-dim)] mb-0.5 px-1">{m.senderName}</span>
                      )}
                      <div className={`px-3.5 py-2 rounded-2xl text-sm leading-relaxed break-words ${m.mine ? 'bg-indigo-600 text-white rounded-br-sm' : 'bg-[var(--card-2)] text-[var(--text-soft)] rounded-bl-sm'}`}>
                        {m.deleted ? <span className="italic opacity-70">Message deleted</span> : m.content}
                      </div>
                      <span className="text-[10px] text-[var(--text-dim)] mt-0.5 px-1">{clockTime(m.createdAt)}</span>
                    </div>
                  ))}
                  {!loadingConv && active.messages.length === 0 && (
                    <p className="text-center text-xs text-[var(--text-dim)] mt-8">No messages yet — say hello 👋</p>
                  )}
                </div>

                {/* Composer */}
                <div className="p-3 border-t border-[var(--border)] flex items-center gap-2 shrink-0">
                  <input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                    placeholder="Type a message…"
                    className="flex-1 bg-[var(--card-2)] border border-[var(--border)] rounded-full px-4 py-2.5 text-sm outline-none placeholder-zinc-500 text-[var(--text)]"
                  />
                  <button onClick={send} disabled={!draft.trim()} className="w-11 h-11 rounded-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white flex items-center justify-center shrink-0 transition-colors">
                    <Send size={17} />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {sheet && (
        <PeopleSheet
          mode={sheet}
          onClose={() => setSheet(null)}
          onDone={async (result) => {
            setSheet(null);
            if (result?.conversation) {
              await loadConversations();
              setActive(result.conversation);
            } else {
              loadConversations();
              if (active) openConversation(active.id);
            }
          }}
          conversationId={sheet === 'add' ? active?.id : null}
          existingIds={sheet === 'add' && active ? active.members.map((m) => m.userId) : []}
          onError={setError}
        />
      )}
    </div>
  );
}

function otherUserId(conv) {
  if (!conv || conv.type !== 'DIRECT') return null;
  // For a direct chat, the conversation title is the other member's username.
  const other = conv.members.find((m) => m.username === conv.title) || conv.members[0];
  return other ? other.userId : null;
}

// Search-people sheet used for: new DM, new group, add-to-group.
function PeopleSheet({ mode, onClose, onDone, conversationId, existingIds = [], onError }) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState([]); // {id, username}
  const [groupName, setGroupName] = useState('');
  const [busy, setBusy] = useState(false);
  const isGroup = mode === 'group';
  const isAdd = mode === 'add';
  const multi = isGroup || isAdd;

  useEffect(() => {
    const t = setTimeout(async () => {
      if (q.trim().length < 2) { setResults([]); return; }
      try {
        const r = await api(`/api/chat/users/search?q=${encodeURIComponent(q.trim())}`);
        setResults(r.filter((u) => !existingIds.includes(u.id)));
      } catch (e) {}
    }, 250);
    return () => clearTimeout(t);
  }, [q]); // eslint-disable-line

  const toggle = (u) => {
    setSelected((prev) => prev.some((s) => s.id === u.id)
      ? prev.filter((s) => s.id !== u.id)
      : [...prev, u]);
  };

  const startDirect = async (u) => {
    setBusy(true);
    try {
      const conversation = await api('/api/chat/conversations/direct', {
        method: 'POST', body: JSON.stringify({ userId: u.id }),
      });
      onDone({ conversation });
    } catch (e) { onError?.(e.message); setBusy(false); }
  };

  const createGroup = async () => {
    if (!groupName.trim() || selected.length === 0) return;
    setBusy(true);
    try {
      const conversation = await api('/api/chat/conversations/group', {
        method: 'POST',
        body: JSON.stringify({ name: groupName.trim(), memberIds: selected.map((s) => s.id) }),
      });
      onDone({ conversation });
    } catch (e) { onError?.(e.message); setBusy(false); }
  };

  const addToGroup = async () => {
    if (selected.length === 0) return;
    setBusy(true);
    try {
      const conversation = await api(`/api/chat/conversations/${conversationId}/members`, {
        method: 'POST', body: JSON.stringify({ memberIds: selected.map((s) => s.id) }),
      });
      onDone({ conversation });
    } catch (e) { onError?.(e.message); setBusy(false); }
  };

  const title = isGroup ? 'New group' : isAdd ? 'Add people' : 'New message';

  return (
    <div className="fixed inset-0 z-[400] flex items-end sm:items-center justify-center bg-black/50" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full sm:w-[440px] bg-[var(--card)] border border-[var(--border)] rounded-t-2xl sm:rounded-2xl p-5 max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">{title}</h3>
          <button onClick={onClose} className="text-[var(--text-muted)]"><X size={18} /></button>
        </div>

        {isGroup && (
          <input
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="Group name"
            className="mb-3 bg-[var(--card-2)] border border-[var(--border)] rounded-xl px-3 py-2.5 text-sm outline-none text-[var(--text)]"
          />
        )}

        {multi && selected.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {selected.map((s) => (
              <span key={s.id} className="flex items-center gap-1 bg-indigo-600/20 text-indigo-300 text-xs px-2 py-1 rounded-full">
                {s.username}
                <button onClick={() => toggle(s)}><X size={12} /></button>
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 bg-[var(--card-2)] border border-[var(--border)] rounded-xl px-3 py-2 mb-2">
          <Search size={15} className="text-[var(--text-dim)]" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search members by username…"
            autoFocus
            className="flex-1 bg-transparent text-sm outline-none text-[var(--text)]"
          />
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 -mx-1">
          {q.trim().length >= 2 && results.length === 0 && (
            <p className="text-xs text-[var(--text-dim)] text-center py-6">No members found.</p>
          )}
          {results.map((u) => {
            const isSel = selected.some((s) => s.id === u.id);
            return (
              <button
                key={u.id}
                onClick={() => (multi ? toggle(u) : startDirect(u))}
                disabled={busy}
                className={`w-full flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-[var(--card-2)] text-left ${isSel ? 'bg-[var(--card-2)]' : ''}`}
              >
                <div className={`w-9 h-9 rounded-full ${colorFor(u.username)} flex items-center justify-center text-sm font-semibold shrink-0`}>
                  {u.username.charAt(0).toUpperCase()}
                </div>
                <span className="flex-1 text-sm font-medium">{u.username}</span>
                {multi && isSel && <span className="w-5 h-5 rounded-full bg-indigo-500 text-white text-xs flex items-center justify-center">✓</span>}
              </button>
            );
          })}
        </div>

        <div className="flex items-start gap-2 mt-3 text-[11px] text-[var(--text-dim)]">
          <Shield size={13} className="shrink-0 mt-0.5" />
          <span>Be kind. You can block or report anyone from inside a chat. Reports go to the MindSpace team.</span>
        </div>

        {isGroup && (
          <button onClick={createGroup} disabled={busy || !groupName.trim() || selected.length === 0}
            className="mt-3 w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl py-2.5 text-sm font-medium transition-colors">
            Create group{selected.length > 0 ? ` (${selected.length})` : ''}
          </button>
        )}
        {isAdd && (
          <button onClick={addToGroup} disabled={busy || selected.length === 0}
            className="mt-3 w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl py-2.5 text-sm font-medium transition-colors">
            Add {selected.length > 0 ? `${selected.length} ` : ''}to group
          </button>
        )}
      </div>
    </div>
  );
}
