import { useState } from 'react';
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
} from 'lucide-react';

const navItems = [
  { label: 'Dashboard', icon: Home, path: 'dashboard' },
  { label: 'Mood Journal', icon: BookOpen, path: '/mood-journal' },
  { label: 'Mood Trends', icon: BarChart3, path: '/mood-trends' },
  { label: 'Community Forum', icon: MessageCircle, path: '/community-forum' },
  { label: 'Find a Therapist', icon: Stethoscope, path: '/find-a-therapist' },
];

function Sidebar({ active }) {
  const navigate = useNavigate();

  return (
    <aside className="w-64 bg-zinc-950 border-r border-zinc-800 flex flex-col h-screen px-4 py-6 shrink-0 sticky top-0">
      <div className="flex items-center gap-2 px-2 mb-6">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-500" />
        <span className="font-semibold text-white">MindSpace</span>
      </div>

      <div className="flex items-center gap-3 bg-zinc-900 rounded-xl px-3 py-2.5 mb-6">
        <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-sm font-semibold text-white">
          T
        </div>
        <div className="leading-tight">
          <p className="text-sm font-medium text-white">there</p>
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

const posts = [
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
    replies: 6,
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
    replies: 14,
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
    replies: 22,
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
    replies: 9,
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
    replies: 17,
  },
];

export default function CommunityForum() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [query, setQuery] = useState('');

  const filtered = posts.filter((p) => {
    const matchesCategory = activeCategory === 'All' || p.category === activeCategory;
    const matchesQuery =
      p.title.toLowerCase().includes(query.toLowerCase()) ||
      p.body.toLowerCase().includes(query.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  return (
    <div className="flex bg-black min-h-screen text-white font-sans">
      <Sidebar active="Community Forum" />

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
              T
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
              <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 transition-colors px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap">
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
                  <p className="text-sm text-zinc-400 mb-3 leading-relaxed">{post.body}</p>
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
                  <div className="flex items-center gap-5 text-zinc-500 text-sm">
                    <button className="flex items-center gap-1.5 hover:text-rose-400 transition-colors">
                      <Heart size={15} /> {post.likes}
                    </button>
                    <button className="flex items-center gap-1.5 hover:text-indigo-400 transition-colors">
                      <MessageSquare size={15} /> {post.replies}
                    </button>
                    <button className="flex items-center gap-1.5 hover:text-amber-400 transition-colors ml-auto">
                      <Bookmark size={15} />
                    </button>
                  </div>
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
    </div>
  );
}
