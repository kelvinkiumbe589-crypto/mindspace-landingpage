import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Home,
  BookOpen,
  BarChart3,
  MessageCircle,
  Stethoscope,
  Settings,
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
} from 'lucide-react';

const navItems = [
  { label: 'Dashboard', icon: Home, path: '/dashboard' },
  { label: 'Mood Journal', icon: BookOpen, path: '/mood-journal' },
  { label: 'Mood Trends', icon: BarChart3, path: '/mood-trends' },
  { label: 'Community Forum', icon: MessageCircle, path: '/community-forum' },
  { label: 'Find a Therapist', icon: Stethoscope, path: '/find-a-therapist' },
];

function Sidebar({ active, userName }) {
  const navigate = useNavigate();
  const initial = (userName || 'there').charAt(0).toUpperCase();

  return (
    <aside className="w-64 bg-zinc-950 border-r border-zinc-800 flex flex-col h-screen px-4 py-6 shrink-0 sticky top-0">
      <div className="flex items-center gap-2.5 px-2 mb-6">
        <div className="w-[34px] h-[34px] rounded-[10px] bg-[#534AB7] flex items-center justify-center text-base">
          🧠
        </div>
        <span className="font-semibold text-white">MindSpace</span>
      </div>

      <div className="flex items-center gap-3 bg-zinc-900 rounded-xl px-3 py-2.5 mb-6">
        <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-sm font-semibold text-white">
          {initial}
        </div>
        <div className="leading-tight">
          <p className="text-sm font-medium text-white">{userName || 'there'}</p>
          <p className="text-xs text-zinc-500">Student</p>
        </div>
      </div>

      <nav className="flex flex-col gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.label === active;
          return (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors text-left ${
                isActive
                  ? 'bg-indigo-600 text-white font-medium'
                  : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
              }`}
            >
              <Icon size={18} />
              {item.label}
            </button>
          );
        })}
      </nav>

      <button
        onClick={() => navigate('/settings')}
        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200 mt-auto text-left"
      >
        <Settings size={18} />
        Settings
      </button>
    </aside>
  );
}

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
    comments: [],
  },
];

export default function CommunityForum() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [query, setQuery] = useState('');
  const [posts, setPosts] = useState(initialPosts);
  const [userName, setUserName] = useState('there');

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
  }, []);

  const initial = userName.charAt(0).toUpperCase();

  const toggleLike = (id) => {
    setPosts((prev) =>
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
    setPosts((prev) =>
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
      comments: [],
    };
    setPosts((prev) => [post, ...prev]);
    setShowComposer(false);
    setNewTitle('');
    setNewBody('');
    setNewCategory('General');
    setNewTags('');
  };

  const filtered = posts.filter((p) => {
    const matchesCategory = activeCategory === 'All' || p.category === activeCategory;
    const matchesQuery =
      p.title.toLowerCase().includes(query.toLowerCase()) ||
      p.body.toLowerCase().includes(query.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  return (
    <div className="flex bg-black min-h-screen text-white font-sans">
      <Sidebar active="Community Forum" userName={userName} />

      <main className="flex-1 px-8 py-6 overflow-y-auto h-screen">
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
            <button className="w-9 h-9 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-400 hover:text-white transition-colors">
              <Bell size={18} />
            </button>
            <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-sm font-semibold">
              {initial}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 flex flex-col gap-5">
            <div className="flex gap-3">
              <div className="flex-1 flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5">
                <Search size={16} className="text-zinc-500" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search posts..."
                  className="bg-transparent outline-none text-sm placeholder-zinc-500 w-full text-white"
                />
              </div>
              <button
                onClick={() => setShowComposer(true)}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 transition-colors px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap"
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
                      : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-4">
              {filtered.map((post) => (
                <div
                  key={post.id}
                  className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 hover:border-zinc-700 transition-colors"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className={`w-9 h-9 rounded-full ${post.color} flex items-center justify-center text-sm font-semibold shrink-0`}
                    >
                      {post.avatar}
                    </div>
                    <div className="leading-tight">
                      <p className="text-sm font-medium">{post.author}</p>
                      <p className="text-xs text-zinc-500">
                        {post.time} · {post.category}
                      </p>
                    </div>
                  </div>
                  <h3 className="font-semibold mb-1.5">{post.title}</h3>
                  {post.body && (
                    <p className="text-sm text-zinc-400 mb-3 leading-relaxed">{post.body}</p>
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
                  <div className="flex items-center gap-5 text-zinc-500 text-sm">
                    <button
                      onClick={() => toggleLike(post.id)}
                      className={`flex items-center gap-1.5 transition-colors ${
                        post.liked ? 'text-rose-400' : 'hover:text-rose-400'
                      }`}
                    >
                      <Heart size={15} fill={post.liked ? 'currentColor' : 'none'} /> {post.likes}
                    </button>
                    <button
                      onClick={() => toggleComments(post.id)}
                      className={`flex items-center gap-1.5 transition-colors ${
                        openComments[post.id] ? 'text-indigo-400' : 'hover:text-indigo-400'
                      }`}
                    >
                      <MessageSquare size={15} /> {post.comments.length}
                    </button>
                    <button className="flex items-center gap-1.5 hover:text-amber-400 transition-colors ml-auto">
                      <Bookmark size={15} />
                    </button>
                  </div>

                  {/* Comments */}
                  {openComments[post.id] && (
                    <div className="mt-4 pt-4 border-t border-zinc-800 flex flex-col gap-3">
                      {post.comments.map((c) => (
                        <div key={c.id} className="flex items-start gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-zinc-700 flex items-center justify-center text-xs font-semibold shrink-0">
                            {c.avatar}
                          </div>
                          <div className="bg-zinc-800 rounded-xl px-3 py-2 flex-1">
                            <p className="text-xs text-zinc-400 mb-0.5">
                              <span className="font-medium text-zinc-200">{c.author}</span> · {c.time}
                            </p>
                            <p className="text-sm text-zinc-300">{c.text}</p>
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
                          className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm outline-none placeholder-zinc-500 text-white"
                        />
                        <button
                          onClick={() => addComment(post.id)}
                          className="w-9 h-9 rounded-xl bg-indigo-600 hover:bg-indigo-500 transition-colors flex items-center justify-center shrink-0"
                        >
                          <Send size={15} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {filtered.length === 0 && (
                <p className="text-zinc-500 text-sm text-center py-10">No posts match your search.</p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-5">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Shield size={16} className="text-indigo-400" />
                <h3 className="font-semibold text-sm">Community Guidelines</h3>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed mb-3">
                Be kind, keep it anonymous-friendly, and remember this space is peer support, not
                medical advice.
              </p>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Need immediate support? Visit{' '}
                <span className="text-indigo-400">Crisis Resources</span> in Settings.
              </p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
              <h3 className="font-semibold text-sm mb-3">Trending tags</h3>
              <div className="flex flex-wrap gap-2">
                {['#selfcare', '#anxiety', '#sleep', '#wins', '#motivation', '#boundaries'].map(
                  (tag) => (
                    <span
                      key={tag}
                      className="text-xs px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-300"
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
              <p className="text-xs text-zinc-300 leading-relaxed">
                Posts tagged "wins" are up 40% this week, looks like good things are happening 🎉
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* New Post Modal */}
      {showComposer && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-5">
          <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold">New Post</h2>
              <button
                onClick={() => setShowComposer(false)}
                className="text-zinc-500 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <label className="text-xs text-zinc-400 mb-1.5 block">Title</label>
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="What's on your mind?"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm outline-none placeholder-zinc-500 text-white mb-4"
            />

            <label className="text-xs text-zinc-400 mb-1.5 block">Share your thoughts</label>
            <textarea
              value={newBody}
              onChange={(e) => setNewBody(e.target.value)}
              rows={4}
              placeholder="Write freely — this is a safe space..."
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm outline-none placeholder-zinc-500 text-white resize-none mb-4"
            />

            <div className="flex gap-3 mb-4">
              <div className="flex-1">
                <label className="text-xs text-zinc-400 mb-1.5 block">Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm outline-none text-white cursor-pointer"
                >
                  {categories
                    .filter((c) => c !== 'All')
                    .map((c) => (
                      <option key={c} value={c} className="bg-zinc-900">
                        {c}
                      </option>
                    ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="text-xs text-zinc-400 mb-1.5 block">Tags (comma separated)</label>
                <input
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                  placeholder="hopeful, advice-wanted"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm outline-none placeholder-zinc-500 text-white"
                />
              </div>
            </div>

            <button
              onClick={handleNewPost}
              disabled={!newTitle.trim() && !newBody.trim()}
              className="w-full py-3 rounded-xl text-sm font-medium bg-indigo-600 hover:bg-indigo-500 transition-colors disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed"
            >
              Post to Community
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
