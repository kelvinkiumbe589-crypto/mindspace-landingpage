import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Plus,
  Heart,
  MessageSquare,
  Bookmark,
  Shield,
  Sparkles,
  Send,
  X,
  Sun,
  Moon,
  ChevronDown,
  ImagePlus,
} from 'lucide-react';
import { useTheme } from '../theme';
import Sidebar from '../components/Sidebar';
import { AccountGear } from '../components/AccountDrawer';
import NotificationBell from '../components/NotificationBell';

import { API_BASE } from '../lib/api';
import { fileToPostMedia } from '../lib/forumMedia';
const BOOKMARKS_KEY = 'mindspace_forum_bookmarks';
const categories = ['All', 'Anxiety', 'Sleep', 'Relationships', 'Wins 🎉', 'General'];

const PALETTE = ['bg-indigo-600', 'bg-emerald-600', 'bg-orange-600', 'bg-rose-600', 'bg-sky-600', 'bg-purple-600'];

const token = () => localStorage.getItem('mindspace_token');

function colorFor(name) {
  let h = 0;
  for (const ch of name || '') h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

function timeAgo(iso) {
  if (!iso) return 'Just now';
  const d = new Date(iso);
  const s = (Date.now() - d.getTime()) / 1000;
  if (Number.isNaN(s)) return '';
  if (s < 60) return 'Just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 172800) return 'Yesterday';
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function loadBookmarks() {
  try {
    return new Set(JSON.parse(localStorage.getItem(BOOKMARKS_KEY) || '[]'));
  } catch (e) {
    return new Set();
  }
}

// Map a backend ReplyResponse to the shape the UI renders.
function mapReply(r) {
  const author = r.author || 'Anonymous';
  return {
    id: r.id,
    author,
    avatar: author === 'Anonymous' ? '?' : author.charAt(0).toUpperCase(),
    text: r.content,
    time: timeAgo(r.createdAt),
    mine: !!r.mine,
  };
}

// Map a backend PostResponse to the shape the UI renders.
function mapPost(p, bookmarks) {
  const author = p.author || 'Anonymous';
  return {
    id: p.id,
    author,
    avatar: author === 'Anonymous' ? '?' : author.charAt(0).toUpperCase(),
    color: author === 'Anonymous' ? 'bg-zinc-600' : colorFor(author),
    time: timeAgo(p.createdAt),
    category: p.category || 'General',
    title: p.title,
    body: p.content,
    mediaUrl: p.mediaUrl || null,
    mediaType: p.mediaType || null,
    tags: [],
    likes: p.likeCount || 0,
    liked: p.likedByMe || false,
    mine: !!p.mine,
    bookmarked: bookmarks ? bookmarks.has(p.id) : false,
    replyCount: p.replyCount || 0,
    comments: null, // loaded lazily when the thread is opened
  };
}

export default function CommunityForum() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [activeCategory, setActiveCategory] = useState('All');
  const [query, setQuery] = useState('');
  const [posts, setPosts] = useState([]);
  const [loadError, setLoadError] = useState('');
  const [userName, setUserName] = useState('there');
  const [showSaved, setShowSaved] = useState(false);

  // Composer state
  const [showComposer, setShowComposer] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newBody, setNewBody] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newTags, setNewTags] = useState('');
  const [newAnonymous, setNewAnonymous] = useState(false);
  const [posting, setPosting] = useState(false);
  const [media, setMedia] = useState(null); // { mediaUrl, mediaType }
  const [mediaError, setMediaError] = useState('');
  const [readingMedia, setReadingMedia] = useState(false);
  const fileInputRef = useRef(null);

  // Comment UI state
  const [openComments, setOpenComments] = useState({});
  const [commentDrafts, setCommentDrafts] = useState({});

  const loadPosts = async () => {
    try {
      // Send the token when signed in so the server can flag which posts I've liked.
      const t = token();
      const res = await fetch(`${API_BASE}/api/forum/posts`, {
        headers: t ? { Authorization: `Bearer ${t}` } : {},
      });
      if (!res.ok) throw new Error('failed');
      const data = await res.json();
      const bm = loadBookmarks();
      setPosts(data.map((p) => mapPost(p, bm)));
      setLoadError('');
    } catch (e) {
      setLoadError("Couldn't load the community feed. Please try again in a moment.");
    }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('mindspace_user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        if (user.name) setUserName(user.name.split(' ')[0]);
      } catch (e) {}
    }
    loadPosts();
  }, []);

  const initial = userName.charAt(0).toUpperCase();

  const persistBookmarks = (ids) => {
    try { localStorage.setItem(BOOKMARKS_KEY, JSON.stringify([...ids])); } catch (e) {}
  };

  const toggleBookmark = (id) => {
    setPosts((prev) => {
      const next = prev.map((p) => (p.id === id ? { ...p, bookmarked: !p.bookmarked } : p));
      persistBookmarks(next.filter((p) => p.bookmarked).map((p) => p.id));
      return next;
    });
  };

  // Likes are live and shared across users. We update the UI optimistically,
  // then reconcile with the authoritative count the server returns.
  const toggleLike = async (id) => {
    if (!token()) { navigate('/signin'); return; }

    // Optimistic flip.
    setPosts((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 } : p
      )
    );

    try {
      const res = await fetch(`${API_BASE}/api/forum/posts/${id}/like`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token()}` },
      });
      if (!res.ok) throw new Error('failed');
      const { likeCount, liked } = await res.json();
      // Reconcile with the server's real numbers.
      setPosts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, liked, likes: likeCount } : p))
      );
    } catch (e) {
      // Roll back the optimistic change if the request failed.
      setPosts((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 } : p
        )
      );
    }
  };

  // Load a thread's replies. Sends the token so the server can flag which
  // comments are mine (editable/deletable).
  const loadComments = async (id) => {
    try {
      const t = token();
      const res = await fetch(`${API_BASE}/api/forum/posts/${id}`, {
        headers: t ? { Authorization: `Bearer ${t}` } : {},
      });
      if (res.ok) {
        const detail = await res.json();
        const comments = (detail.replies || []).map(mapReply);
        setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, comments } : p)));
      }
    } catch (e) {}
  };

  const toggleComments = async (id) => {
    const willOpen = !openComments[id];
    setOpenComments((prev) => ({ ...prev, [id]: willOpen }));
    if (willOpen) loadComments(id);
  };

  // ── Edit / delete my own comment ──
  const [editingComment, setEditingComment] = useState(null); // reply id
  const [editText, setEditText] = useState('');

  const startEditComment = (c) => { setEditingComment(c.id); setEditText(c.text); };
  const cancelEditComment = () => { setEditingComment(null); setEditText(''); };

  const saveEditComment = async (postId, commentId) => {
    const content = editText.trim();
    if (!content) return;
    try {
      const res = await fetch(`${API_BASE}/api/forum/replies/${commentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ content }),
      });
      if (res.ok) { cancelEditComment(); loadComments(postId); }
    } catch (e) {}
  };

  const deleteComment = async (postId, commentId) => {
    if (!window.confirm('Delete this comment? This cannot be undone.')) return;
    try {
      const res = await fetch(`${API_BASE}/api/forum/replies/${commentId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token()}` },
      });
      if (res.ok) {
        loadComments(postId);
        setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, replyCount: Math.max(0, (p.replyCount || 1) - 1) } : p)));
      }
    } catch (e) {}
  };

  // ── Edit / delete your own post ────────────────────────────
  const [editingPost, setEditingPost] = useState(null); // post id
  const [editPostTitle, setEditPostTitle] = useState('');
  const [editPostBody, setEditPostBody] = useState('');

  const startEditPost = (post) => {
    setEditingPost(post.id);
    setEditPostTitle(post.title || '');
    setEditPostBody(post.body || '');
  };
  const cancelEditPost = () => { setEditingPost(null); setEditPostTitle(''); setEditPostBody(''); };

  const saveEditPost = async (postId) => {
    const title = editPostTitle.trim();
    const content = editPostBody.trim();
    if (!title || !content) return;
    // The inline editor doesn't change the attachment, so send the post's existing
    // media back — otherwise the server would clear it on edit.
    const existing = posts.find((p) => p.id === postId);
    try {
      const res = await fetch(`${API_BASE}/api/forum/posts/${postId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({
          title,
          content,
          mediaUrl: existing?.mediaUrl || null,
          mediaType: existing?.mediaType || null,
        }),
      });
      if (res.ok) {
        setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, title, body: content } : p)));
        cancelEditPost();
      }
    } catch (e) {}
  };

  const deletePost = async (postId) => {
    if (!window.confirm('Delete this post? This cannot be undone.')) return;
    try {
      const res = await fetch(`${API_BASE}/api/forum/posts/${postId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token()}` },
      });
      if (res.ok) {
        setPosts((prev) => prev.filter((p) => p.id !== postId));
      }
    } catch (e) {}
  };

  const addComment = async (id) => {
    const text = (commentDrafts[id] || '').trim();
    if (!text) return;
    if (!token()) { navigate('/signin'); return; }
    setCommentDrafts((prev) => ({ ...prev, [id]: '' }));
    try {
      const res = await fetch(`${API_BASE}/api/forum/posts/${id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ content: text, isAnonymous: false }),
      });
      if (res.ok) {
        const reply = await res.json();
        setPosts((prev) =>
          prev.map((p) =>
            p.id === id
              ? { ...p, comments: [...(p.comments || []), mapReply(reply)], replyCount: (p.replyCount || 0) + 1 }
              : p
          )
        );
      }
    } catch (e) {}
  };

  const canPost = newTitle.trim() && newBody.trim() && newCategory;

  const pickMedia = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-picking the same file
    if (!file) return;
    setMediaError('');
    setReadingMedia(true);
    try {
      setMedia(await fileToPostMedia(file));
    } catch (err) {
      setMedia(null);
      setMediaError(err.message || "Couldn't attach that file.");
    } finally {
      setReadingMedia(false);
    }
  };

  const clearMedia = () => { setMedia(null); setMediaError(''); };

  const resetComposer = () => {
    setShowComposer(false);
    setNewTitle('');
    setNewBody('');
    setNewCategory('');
    setNewTags('');
    setNewAnonymous(false);
    clearMedia();
  };

  const handleNewPost = async () => {
    if (!canPost || posting) return;
    if (!token()) { navigate('/signin'); return; }
    setPosting(true);
    try {
      const res = await fetch(`${API_BASE}/api/forum/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({
          title: newTitle.trim(),
          content: newBody.trim(),
          category: newCategory,
          isAnonymous: newAnonymous,
          mediaUrl: media?.mediaUrl || null,
          mediaType: media?.mediaType || null,
        }),
      });
      if (res.ok) {
        const created = await res.json();
        setPosts((prev) => [mapPost(created, loadBookmarks()), ...prev]);
        resetComposer();
      }
    } catch (e) {}
    finally {
      setPosting(false);
    }
  };

  const savedCount = posts.filter((p) => p.bookmarked).length;

  const filtered = posts.filter((p) => {
    if (showSaved && !p.bookmarked) return false;
    const matchesCategory = activeCategory === 'All' || p.category === activeCategory;
    const matchesQuery =
      p.title.toLowerCase().includes(query.toLowerCase()) ||
      (p.body || '').toLowerCase().includes(query.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  return (
    <div className="flex bg-[var(--bg)] min-h-screen text-[var(--text)] font-sans">
      <Sidebar />

      <main className="flex-1 px-8 py-6 h-screen flex flex-col overflow-hidden">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              Community Forum <span>💬</span>
            </h1>
            <p className="text-indigo-400 text-sm mt-1">
              A safe space to share, connect, and support each other
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              title="Toggle light / dark mode"
              className="w-9 h-9 rounded-full bg-[var(--card)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <NotificationBell size={36} />
            <AccountGear size={36} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
          <div className="lg:col-span-2 flex flex-col gap-5 min-h-0">
            <div className="flex gap-3">
              <div className="flex-1 flex items-center gap-2 bg-[var(--card)] border border-[var(--border)] rounded-xl px-4 py-2.5">
                <Search size={16} className="text-[var(--text-dim)]" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search posts..."
                  className="bg-transparent outline-none text-sm placeholder-zinc-500 w-full text-[var(--text)]"
                />
              </div>
              <button
                onClick={() => setShowSaved((s) => !s)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-colors border ${
                  showSaved
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-400'
                    : 'bg-[var(--card)] border-[var(--border)] text-[var(--text-soft)] hover:border-[var(--border)]'
                }`}
              >
                <Bookmark size={16} fill={showSaved ? 'currentColor' : 'none'} /> Saved
                {savedCount > 0 && ` (${savedCount})`}
              </button>
              <button
                onClick={() => setShowComposer(true)}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white transition-colors px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap"
              >
                <Plus size={16} /> New Post
              </button>
            </div>

            <div className="flex gap-2 flex-wrap">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    activeCategory === cat
                      ? 'bg-indigo-600 text-white'
                      : 'bg-[var(--card)] text-[var(--text-muted)] hover:text-[var(--text-soft)] border border-[var(--border)]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-4 overflow-y-auto min-h-0 flex-1 pr-1">
              {filtered.map((post) => (
                <div
                  key={post.id}
                  className="hover-lift bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 hover:border-[var(--border)] transition-colors"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className={`w-9 h-9 rounded-full ${post.color} flex items-center justify-center text-sm font-semibold shrink-0`}
                    >
                      {post.avatar}
                    </div>
                    <div className="leading-tight">
                      <p className="text-sm font-medium">{post.author}</p>
                      <p className="text-xs text-[var(--text-dim)]">
                        {post.time} · {post.category}
                      </p>
                    </div>
                    {post.mine && editingPost !== post.id && (
                      <span className="flex items-center gap-2 shrink-0 ml-auto">
                        <button onClick={() => startEditPost(post)} className="text-[11px] text-indigo-300 hover:text-indigo-200">Edit</button>
                        <button onClick={() => deletePost(post.id)} className="text-[11px] text-rose-300 hover:text-rose-200">Delete</button>
                      </span>
                    )}
                  </div>
                  {editingPost === post.id ? (
                    <div className="flex flex-col gap-2 mb-3">
                      <input
                        value={editPostTitle}
                        onChange={(e) => setEditPostTitle(e.target.value)}
                        placeholder="Title"
                        autoFocus
                        className="bg-[var(--card-2)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm font-semibold outline-none text-[var(--text)]"
                      />
                      <textarea
                        value={editPostBody}
                        onChange={(e) => setEditPostBody(e.target.value)}
                        rows={4}
                        placeholder="Share your thoughts..."
                        className="bg-[var(--card-2)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm outline-none text-[var(--text)] resize-y"
                      />
                      <div className="flex items-center gap-3">
                        <button onClick={() => saveEditPost(post.id)} className="text-xs font-semibold text-emerald-300">Save</button>
                        <button onClick={cancelEditPost} className="text-xs text-[var(--text-dim)]">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <h3 className="font-semibold mb-1.5">{post.title}</h3>
                      {post.body && (
                        <p className="text-sm text-[var(--text-muted)] mb-3 leading-relaxed">{post.body}</p>
                      )}
                      {post.mediaUrl && post.mediaType === 'image' && (
                        <img
                          src={post.mediaUrl}
                          alt=""
                          loading="lazy"
                          className="mb-3 rounded-xl max-h-[26rem] w-auto max-w-full border border-[var(--border)]"
                        />
                      )}
                      {post.mediaUrl && post.mediaType === 'video' && (
                        <video
                          src={post.mediaUrl}
                          controls
                          playsInline
                          className="mb-3 rounded-xl max-h-[26rem] w-auto max-w-full border border-[var(--border)] bg-black"
                        />
                      )}
                    </>
                  )}
                  {post.tags && post.tags.length > 0 && (
                    <div className="flex gap-2 mb-3 flex-wrap">
                      {post.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-xs px-2.5 py-1 rounded-full bg-indigo-950 text-indigo-300"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-5 text-[var(--text-dim)] text-sm">
                    <button
                      onClick={() => toggleLike(post.id)}
                      className={`flex items-center gap-1.5 transition-colors ${
                        post.liked ? 'text-rose-400' : 'hover:text-rose-400'
                      }`}
                    >
                      <Heart className={post.liked ? 'heart-pop' : ''} size={15} fill={post.liked ? 'currentColor' : 'none'} /> {post.likes}
                    </button>
                    <button
                      onClick={() => toggleComments(post.id)}
                      className={`flex items-center gap-1.5 transition-colors ${
                        openComments[post.id] ? 'text-indigo-400' : 'hover:text-indigo-400'
                      }`}
                    >
                      <MessageSquare size={15} /> {post.comments ? post.comments.length : post.replyCount}
                    </button>
                    <button
                      onClick={() => toggleBookmark(post.id)}
                      title={post.bookmarked ? 'Remove bookmark' : 'Save post'}
                      className={`flex items-center gap-1.5 transition-colors ml-auto ${
                        post.bookmarked ? 'text-amber-400' : 'hover:text-amber-400'
                      }`}
                    >
                      <Bookmark size={15} fill={post.bookmarked ? 'currentColor' : 'none'} />
                    </button>
                  </div>

                  {/* Comments */}
                  {openComments[post.id] && (
                    <div className="mt-4 pt-4 border-t border-[var(--border)] flex flex-col gap-3">
                      {(post.comments || []).map((c) => (
                        <div key={c.id} className="flex items-start gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-[var(--card-2)] flex items-center justify-center text-xs font-semibold shrink-0">
                            {c.avatar}
                          </div>
                          <div className="bg-[var(--card-2)] rounded-xl px-3 py-2 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-xs text-[var(--text-muted)] mb-0.5">
                                <span className="font-medium text-[var(--text-soft)]">{c.author}</span> · {c.time}
                              </p>
                              {c.mine && editingComment !== c.id && (
                                <span className="flex items-center gap-2 shrink-0">
                                  <button onClick={() => startEditComment(c)} className="text-[11px] text-indigo-300 hover:text-indigo-200">Edit</button>
                                  <button onClick={() => deleteComment(post.id, c.id)} className="text-[11px] text-rose-300 hover:text-rose-200">Delete</button>
                                </span>
                              )}
                            </div>
                            {editingComment === c.id ? (
                              <div className="flex items-center gap-2 mt-1">
                                <input
                                  value={editText}
                                  onChange={(e) => setEditText(e.target.value)}
                                  onKeyDown={(e) => { if (e.key === 'Enter') saveEditComment(post.id, c.id); if (e.key === 'Escape') cancelEditComment(); }}
                                  autoFocus
                                  className="flex-1 bg-[var(--card)] border border-[var(--border)] rounded-lg px-2 py-1 text-sm outline-none text-[var(--text)]"
                                />
                                <button onClick={() => saveEditComment(post.id, c.id)} className="text-[11px] font-semibold text-emerald-300">Save</button>
                                <button onClick={cancelEditComment} className="text-[11px] text-[var(--text-dim)]">Cancel</button>
                              </div>
                            ) : (
                              <p className="text-sm text-[var(--text-soft)]">{c.text}</p>
                            )}
                          </div>
                        </div>
                      ))}
                      {post.comments && post.comments.length === 0 && (
                        <p className="text-xs text-[var(--text-dim)]">No replies yet — be the first to offer support.</p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <input
                          value={commentDrafts[post.id] || ''}
                          onChange={(e) =>
                            setCommentDrafts((prev) => ({ ...prev, [post.id]: e.target.value }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') addComment(post.id);
                          }}
                          placeholder="Write a supportive reply..."
                          className="flex-1 bg-[var(--card-2)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm outline-none placeholder-zinc-500 text-[var(--text)]"
                        />
                        <button
                          onClick={() => addComment(post.id)}
                          className="w-9 h-9 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-colors flex items-center justify-center shrink-0"
                        >
                          <Send size={15} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {filtered.length === 0 &&
                (loadError ? (
                  <p className="text-[var(--text-dim)] text-sm text-center py-10">{loadError}</p>
                ) : showSaved ? (
                  <div className="text-center py-12 text-[var(--text-dim)]">
                    <Bookmark size={28} className="mx-auto mb-3 text-[var(--text-dim)]" />
                    <p className="text-sm text-[var(--text-muted)] mb-1">No bookmarks yet</p>
                    <p className="text-xs">
                      Tap the bookmark icon on any post to save it here for later.
                    </p>
                  </div>
                ) : query || activeCategory !== 'All' ? (
                  <p className="text-[var(--text-dim)] text-sm text-center py-10">
                    No posts match your search.
                  </p>
                ) : (
                  <div className="text-center py-12 text-[var(--text-dim)]">
                    <MessageSquare size={28} className="mx-auto mb-3 text-[var(--text-dim)]" />
                    <p className="text-sm text-[var(--text-muted)] mb-1">No posts yet</p>
                    <p className="text-xs">Be the first to share something with the community.</p>
                  </div>
                ))}
            </div>
          </div>

          <div className="flex flex-col gap-5 overflow-y-auto min-h-0">
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Shield size={16} className="text-indigo-400" />
                <h3 className="font-semibold text-sm">Community Guidelines</h3>
              </div>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed mb-3">
                Be kind, keep it anonymous-friendly, and remember this space is peer support, not
                medical advice.
              </p>
              <p className="text-xs text-[var(--text-dim)] leading-relaxed">
                Need immediate support? Visit{' '}
                <span className="text-indigo-400">Crisis Resources</span> in Settings.
              </p>
            </div>

            <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5">
              <h3 className="font-semibold text-sm mb-3">Trending tags</h3>
              <div className="flex flex-wrap gap-2">
                {['#selfcare', '#anxiety', '#sleep', '#wins', '#motivation', '#boundaries'].map(
                  (tag) => (
                    <span
                      key={tag}
                      className="text-xs px-2.5 py-1 rounded-full bg-[var(--card-2)] text-[var(--text-soft)]"
                    >
                      {tag}
                    </span>
                  )
                )}
              </div>
            </div>

            <div className="bg-emerald-950 border border-emerald-900 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={16} className="text-emerald-400" />
                <h3 className="font-semibold text-sm">This week's vibe</h3>
              </div>
              <p className="text-xs text-[var(--text-soft)] leading-relaxed">
                Posts tagged "wins" are up 40% this week, looks like good things are happening 🎉
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* New Post Modal */}
      {showComposer && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-5">
          <div className="w-full max-w-lg bg-[var(--elevated)] border border-[var(--border)] rounded-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold">New Post</h2>
              <button
                onClick={resetComposer}
                className="text-[var(--text-dim)] hover:text-[var(--text)] transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <label className="text-xs text-[var(--text-muted)] mb-1.5 block">Title <span className="text-orange-400">*</span></label>
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="What's on your mind?"
              className="w-full bg-[var(--card-2)] border border-[var(--border)] rounded-xl px-3 py-2.5 text-sm outline-none placeholder-zinc-500 text-[var(--text)] mb-4"
            />

            <label className="text-xs text-[var(--text-muted)] mb-1.5 block">Your thoughts <span className="text-orange-400">*</span></label>
            <textarea
              value={newBody}
              onChange={(e) => setNewBody(e.target.value)}
              rows={4}
              placeholder="Write freely — this is a safe space..."
              className="w-full bg-[var(--card-2)] border border-[var(--border)] rounded-xl px-3 py-2.5 text-sm outline-none placeholder-zinc-500 text-[var(--text)] resize-none mb-4"
            />

            {/* Photo / video attachment */}
            <label className="text-xs text-[var(--text-muted)] mb-1.5 block">Photo or video (optional)</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              onChange={pickMedia}
              className="hidden"
            />
            {!media ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={readingMedia}
                className="w-full flex items-center justify-center gap-2 py-3 mb-4 rounded-xl text-sm font-medium border border-dashed border-[var(--border)] bg-[var(--card-2)] text-[var(--text-muted)] hover:text-[var(--text-soft)] hover:border-indigo-500 transition-colors disabled:opacity-60"
              >
                <ImagePlus size={16} />
                {readingMedia ? 'Attaching…' : 'Add a photo or video'}
              </button>
            ) : (
              <div className="relative mb-4">
                {media.mediaType === 'image' ? (
                  <img src={media.mediaUrl} alt="" className="rounded-xl max-h-56 w-auto max-w-full border border-[var(--border)]" />
                ) : (
                  <video src={media.mediaUrl} controls playsInline className="rounded-xl max-h-56 w-auto max-w-full border border-[var(--border)] bg-black" />
                )}
                <button
                  type="button"
                  onClick={clearMedia}
                  title="Remove attachment"
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
                >
                  <X size={15} />
                </button>
              </div>
            )}
            {mediaError && <p className="text-xs text-rose-400 -mt-2 mb-4">{mediaError}</p>}

            <div className="flex gap-3 mb-4">
              <div className="flex-1">
                <label className="text-xs text-[var(--text-muted)] mb-1.5 block">Category <span className="text-orange-400">*</span></label>
                <div className="relative">
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full appearance-none bg-[var(--card-2)] border border-[var(--border)] rounded-2xl px-3.5 py-2.5 pr-9 text-sm outline-none text-[var(--text)] cursor-pointer transition-colors focus:border-indigo-500"
                  >
                    <option value="" disabled style={{ background: "var(--elevated)", color: "var(--text-dim)" }}>Choose a category</option>
                    {categories
                      .filter((c) => c !== 'All')
                      .map((c) => (
                        <option key={c} value={c} style={{ background: "var(--elevated)", color: "var(--text)" }}>
                          {c}
                        </option>
                      ))}
                  </select>
                  <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-dim)] pointer-events-none" />
                </div>
              </div>
              <div className="flex-1">
                <label className="text-xs text-[var(--text-muted)] mb-1.5 block">Tags (optional)</label>
                <input
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                  placeholder="hopeful, advice-wanted"
                  className="w-full bg-[var(--card-2)] border border-[var(--border)] rounded-xl px-3 py-2.5 text-sm outline-none placeholder-zinc-500 text-[var(--text)]"
                />
              </div>
            </div>

            {/* Post identity */}
            <label className="text-xs text-[var(--text-muted)] mb-1.5 block">Post as</label>
            <div className="flex gap-2 mb-5">
              <button
                type="button"
                onClick={() => setNewAnonymous(false)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                  !newAnonymous
                    ? 'bg-indigo-600 border-indigo-600 text-white'
                    : 'bg-[var(--card-2)] border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-soft)]'
                }`}
              >
                <span className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center text-[11px] font-semibold text-white">{initial}</span>
                {userName}
              </button>
              <button
                type="button"
                onClick={() => setNewAnonymous(true)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                  newAnonymous
                    ? 'bg-indigo-600 border-indigo-600 text-white'
                    : 'bg-[var(--card-2)] border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-soft)]'
                }`}
              >
                🕶️ Anonymous
              </button>
            </div>

            <button
              onClick={handleNewPost}
              disabled={!canPost || posting}
              className="w-full py-3 rounded-xl text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white transition-colors disabled:bg-[var(--card-2)] disabled:text-[var(--text-dim)] disabled:cursor-not-allowed"
            >
              {posting ? "Posting…" : canPost ? "Post to Community" : "Add a title, your thoughts & a category"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
