import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
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
} from 'lucide-react';
import { useTheme } from '../theme';
import Sidebar from '../components/Sidebar';
import { AccountGear } from '../components/AccountDrawer';

const categories = ['All', 'Anxiety', 'Sleep', 'Relationships', 'Wins 🎉', 'General'];

const initialPosts = [
  {
    id: 1,
    author: 'Quietmind22',
    avatar: 'Q',
    color: 'bg-indigo-600',
    time: '2h ago',
    category: 'Wins 🎉',
    title: 'Small win: called a friend instead of bottling it up',
    body: "Almost talked myself out of it, but I'm glad I picked up the phone. Felt lighter afterward than I have in days.",
    tags: ['hopeful', 'connection'],
    likes: 24,
    liked: false,
    bookmarked: false,
    comments: [],
  },
  {
    id: 2,
    author: 'NightOwl_19',
    avatar: 'N',
    color: 'bg-emerald-600',
    time: '5h ago',
    category: 'Sleep',
    title: 'Tips for a racing mind at 2am?',
    body: "Body's exhausted, brain won't stop replaying the day. What's actually worked for you, beyond 'just relax'?",
    tags: ['sleep', 'advice-wanted'],
    likes: 18,
    liked: false,
    bookmarked: false,
    comments: [],
  },
  {
    id: 3,
    author: 'paperplanes',
    avatar: 'P',
    color: 'bg-orange-600',
    time: 'Yesterday',
    category: 'Anxiety',
    title: 'Finals week is eating me alive',
    body: 'Three exams, one week, zero motivation. Anyone else in the same boat, or got a way to make it feel less impossible?',
    tags: ['anxious', 'school'],
    likes: 31,
    liked: false,
    bookmarked: false,
    comments: [],
  },
  {
    id: 4,
    author: 'amara_writes',
    avatar: 'A',
    color: 'bg-rose-600',
    time: 'Yesterday',
    category: 'General',
    title: 'Grateful for this space',
    body: "Been lurking for months. First time posting just to say, reading everyone's entries has made me feel less alone.",
    tags: ['grateful'],
    likes: 47,
    liked: false,
    bookmarked: false,
    comments: [],
  },
  {
    id: 5,
    author: 'driftwood',
    avatar: 'D',
    color: 'bg-sky-600',
    time: '2 days ago',
    category: 'Relationships',
    title: 'How do you set boundaries without the guilt?',
    body: 'I can say the words, but the guilt that follows is exhausting. Looking for what actually helped you sit with it.',
    tags: ['boundaries', 'advice-wanted'],
    likes: 29,
    liked: false,
    bookmarked: false,
    comments: [],
  },
];

const POSTS_KEY = 'mindspace_posts';

export default function CommunityForum() {
  const { theme, toggleTheme } = useTheme();
  const [activeCategory, setActiveCategory] = useState('All');
  const [query, setQuery] = useState('');
  const [posts, setPosts] = useState(initialPosts);
  const [userName, setUserName] = useState('there');
  const [showSaved, setShowSaved] = useState(false);

  // Composer state
  const [showComposer, setShowComposer] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newBody, setNewBody] = useState('');
  const [newCategory, setNewCategory] = useState('General');
  const [newTags, setNewTags] = useState('');

  // Comment UI state
  const [openComments, setOpenComments] = useState({});
  const [commentDrafts, setCommentDrafts] = useState({});

  useEffect(() => {
    const storedUser = localStorage.getItem('mindspace_user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        if (user.name) setUserName(user.name.split(' ')[0]);
      } catch (e) {}
    }

    // Load saved posts (shared with the dashboard); seed with samples on first visit
    try {
      const stored = localStorage.getItem(POSTS_KEY);
      const parsed = stored ? JSON.parse(stored) : null;
      if (Array.isArray(parsed) && parsed.length) {
        setPosts(parsed);
      } else {
        localStorage.setItem(POSTS_KEY, JSON.stringify(initialPosts));
      }
    } catch (e) {}
  }, []);

  const initial = userName.charAt(0).toUpperCase();

  // Update posts state and persist so the dashboard stays in sync
  const persistPosts = (updater) => {
    setPosts((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      localStorage.setItem(POSTS_KEY, JSON.stringify(next));
      return next;
    });
  };

  const toggleBookmark = (id) => {
    persistPosts((prev) => prev.map((p) => (p.id === id ? { ...p, bookmarked: !p.bookmarked } : p)));
  };

  const toggleLike = (id) => {
    persistPosts((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 }
          : p
      )
    );
  };

  const toggleComments = (id) => {
    setOpenComments((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const addComment = (id) => {
    const text = (commentDrafts[id] || '').trim();
    if (!text) return;
    persistPosts((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              comments: [
                ...p.comments,
                { id: Date.now(), author: userName, avatar: initial, text, time: 'Just now' },
              ],
            }
          : p
      )
    );
    setCommentDrafts((prev) => ({ ...prev, [id]: '' }));
  };

  const handleNewPost = () => {
    if (!newTitle.trim() && !newBody.trim()) return;
    const post = {
      id: Date.now(),
      author: userName,
      avatar: initial,
      color: 'bg-indigo-600',
      time: 'Just now',
      category: newCategory,
      title: newTitle.trim() || 'Untitled',
      body: newBody.trim(),
      tags: newTags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      likes: 0,
      liked: false,
      bookmarked: false,
      comments: [],
    };
    persistPosts((prev) => [post, ...prev]);
    setShowComposer(false);
    setNewTitle('');
    setNewBody('');
    setNewCategory('General');
    setNewTags('');
  };

  const savedCount = posts.filter((p) => p.bookmarked).length;

  const filtered = posts.filter((p) => {
    if (showSaved && !p.bookmarked) return false;
    const matchesCategory = activeCategory === 'All' || p.category === activeCategory;
    const matchesQuery =
      p.title.toLowerCase().includes(query.toLowerCase()) ||
      p.body.toLowerCase().includes(query.toLowerCase());
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
            <button className="w-9 h-9 rounded-full bg-[var(--card)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)] transition-colors">
              <Bell size={18} />
            </button>
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
                  </div>
                  <h3 className="font-semibold mb-1.5">{post.title}</h3>
                  {post.body && (
                    <p className="text-sm text-[var(--text-muted)] mb-3 leading-relaxed">{post.body}</p>
                  )}
                  {post.tags.length > 0 && (
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
                      <MessageSquare size={15} /> {post.comments.length}
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
                      {post.comments.map((c) => (
                        <div key={c.id} className="flex items-start gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-[var(--card-2)] flex items-center justify-center text-xs font-semibold shrink-0">
                            {c.avatar}
                          </div>
                          <div className="bg-[var(--card-2)] rounded-xl px-3 py-2 flex-1">
                            <p className="text-xs text-[var(--text-muted)] mb-0.5">
                              <span className="font-medium text-[var(--text-soft)]">{c.author}</span> · {c.time}
                            </p>
                            <p className="text-sm text-[var(--text-soft)]">{c.text}</p>
                          </div>
                        </div>
                      ))}
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
                (showSaved ? (
                  <div className="text-center py-12 text-[var(--text-dim)]">
                    <Bookmark size={28} className="mx-auto mb-3 text-[var(--text-dim)]" />
                    <p className="text-sm text-[var(--text-muted)] mb-1">No bookmarks yet</p>
                    <p className="text-xs">
                      Tap the bookmark icon on any post to save it here for later.
                    </p>
                  </div>
                ) : (
                  <p className="text-[var(--text-dim)] text-sm text-center py-10">
                    No posts match your search.
                  </p>
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
                onClick={() => setShowComposer(false)}
                className="text-[var(--text-dim)] hover:text-[var(--text)] transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <label className="text-xs text-[var(--text-muted)] mb-1.5 block">Title</label>
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="What's on your mind?"
              className="w-full bg-[var(--card-2)] border border-[var(--border)] rounded-xl px-3 py-2.5 text-sm outline-none placeholder-zinc-500 text-[var(--text)] mb-4"
            />

            <label className="text-xs text-[var(--text-muted)] mb-1.5 block">Share your thoughts</label>
            <textarea
              value={newBody}
              onChange={(e) => setNewBody(e.target.value)}
              rows={4}
              placeholder="Write freely — this is a safe space..."
              className="w-full bg-[var(--card-2)] border border-[var(--border)] rounded-xl px-3 py-2.5 text-sm outline-none placeholder-zinc-500 text-[var(--text)] resize-none mb-4"
            />

            <div className="flex gap-3 mb-4">
              <div className="flex-1">
                <label className="text-xs text-[var(--text-muted)] mb-1.5 block">Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full bg-[var(--card-2)] border border-[var(--border)] rounded-xl px-3 py-2.5 text-sm outline-none text-[var(--text)] cursor-pointer"
                >
                  {categories
                    .filter((c) => c !== 'All')
                    .map((c) => (
                      <option key={c} value={c} className="bg-[var(--card)]">
                        {c}
                      </option>
                    ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="text-xs text-[var(--text-muted)] mb-1.5 block">Tags (comma separated)</label>
                <input
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                  placeholder="hopeful, advice-wanted"
                  className="w-full bg-[var(--card-2)] border border-[var(--border)] rounded-xl px-3 py-2.5 text-sm outline-none placeholder-zinc-500 text-[var(--text)]"
                />
              </div>
            </div>

            <button
              onClick={handleNewPost}
              disabled={!newTitle.trim() && !newBody.trim()}
              className="w-full py-3 rounded-xl text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white transition-colors disabled:bg-[var(--card-2)] disabled:text-[var(--text-dim)] disabled:cursor-not-allowed"
            >
              Post to Community
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
