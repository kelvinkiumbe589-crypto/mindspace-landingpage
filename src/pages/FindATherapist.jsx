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
  Filter,
  Star,
  Video,
  MapPin,
  Phone,
  Sparkles,
  BadgeCheck
} from 'lucide-react';

const navItems = [
  { label: 'Dashboard', icon: Home, path: '/dashboard' },
  { label: 'Mood Journal', icon: BookOpen, path: '/mood-journal' },
  { label: 'Mood Trends', icon: BarChart3, path: '/mood-trends' },
  { label: 'Community Forum', icon: MessageCircle, path: '/community-forum' },
  { label: 'Find a Therapist', icon: Stethoscope, path: '/find-a-therapist',active: true },
];

function Sidebar({ active }) {
  const navigate = useNavigate();

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
          T
        </div>
        <div className="leading-tight">
          <p className="text-sm font-medium text-white">there</p>
          <p className="text-xs text-zinc-500">citizen</p>
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

const specialties = ['All', 'Anxiety', 'Depression', 'Relationships', 'Trauma', 'Sleep', 'Stress'];

const therapists = [
  {
    id: 1,
    name: 'Dr. kelvin kiumbe',
    title: 'PhD, Clinical Psychology',
    initials: 'KK',
    color: 'bg-indigo-600',
    specialties: ['Anxiety', 'Stress'],
    rating: 4.9,
    reviews: 132,
    price: '$80 / session',
    sessionTypes: ['video', 'in-person'],
    available: true,
  },
  {
    id: 2,
    name: 'Irene Wairimu, LMFT',
    title: 'Licensed Marriage & Family Therapist',
    initials: 'IR',
    color: 'bg-emerald-600',
    specialties: ['Relationships'],
    rating: 4.8,
    reviews: 98,
    price: '$95 / session',
    sessionTypes: ['video', 'phone'],
    available: true,
  },
  {
    id: 3,
    name: 'Dr. Grace Wanjiru',
    title: 'PsyD, Trauma-Focused Therapy',
    initials: 'GW',
    color: 'bg-rose-600',
    specialties: ['Trauma', 'Anxiety'],
    rating: 5.0,
    reviews: 76,
    price: '$110 / session',
    sessionTypes: ['video'],
    available: false,
  },
  {
    id: 4,
    name: 'Francis Wainaina, LCSW',
    title: 'Licensed Clinical Social Worker',
    initials: 'FW',
    color: 'bg-amber-600',
    specialties: ['Depression', 'Sleep', 'Stress'],
    rating: 4.7,
    reviews: 154,
    price: '$70 / session',
    sessionTypes: ['video', 'in-person', 'phone'],
    available: true,
  },
  {
    id: 5,
    name: 'Dr. Joseph Njogu',
    title: 'PhD, Cognitive Behavioral Therapy',
    initials: 'JN',
    color: 'bg-sky-600',
    specialties: ['Anxiety', 'Depression'],
    rating: 4.9,
    reviews: 211,
    price: '$90 / session',
    sessionTypes: ['video', 'in-person'],
    available: true,
  },
  {
    id: 6,
    name: 'Tyreek Hassan, LPC',
    title: 'Licensed Professional Counselor',
    initials: 'TH',
    color: 'bg-violet-600',
    specialties: ['Stress', 'Relationships'],
    rating: 4.6,
    reviews: 64,
    price: '$75 / session',
    sessionTypes: ['video', 'phone'],
    available: true,
  },
];

const sessionIcon = { video: Video, 'in-person': MapPin, phone: Phone };

export default function FindATherapist() {
  const [activeSpecialty, setActiveSpecialty] = useState('All');
  const [query, setQuery] = useState('');

  // Filter panel state
  const [showFilters, setShowFilters] = useState(false);
  const [filterSessionTypes, setFilterSessionTypes] = useState([]);
  const [availableOnly, setAvailableOnly] = useState(false);
  const [minRating, setMinRating] = useState(0);

  const toggleSessionType = (type) => {
    setFilterSessionTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const clearFilters = () => {
    setFilterSessionTypes([]);
    setAvailableOnly(false);
    setMinRating(0);
  };

  const activeFilterCount =
    filterSessionTypes.length + (availableOnly ? 1 : 0) + (minRating > 0 ? 1 : 0);

  const filtered = therapists.filter((t) => {
    const matchesSpecialty = activeSpecialty === 'All' || t.specialties.includes(activeSpecialty);
    const matchesQuery = t.name.toLowerCase().includes(query.toLowerCase());
    const matchesSession =
      filterSessionTypes.length === 0 ||
      filterSessionTypes.some((s) => t.sessionTypes.includes(s));
    const matchesAvailable = !availableOnly || t.available;
    const matchesRating = t.rating >= minRating;
    return matchesSpecialty && matchesQuery && matchesSession && matchesAvailable && matchesRating;
  });

  return (
    <div className="flex bg-black min-h-screen text-white font-sans">
      <Sidebar active="Find a Therapist" />

      <main className="flex-1 px-8 py-6 h-screen flex flex-col overflow-hidden">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              Find a Therapist <span>🩺</span>
            </h1>
            <p className="text-indigo-400 text-sm mt-1">
              Connect with licensed professionals who understand what you're going through
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
          <div className="lg:col-span-2 flex flex-col gap-5 min-h-0">
            <div className="flex gap-3">
              <div className="flex-1 flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5">
                <Search size={16} className="text-zinc-500" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by name or specialty..."
                  className="bg-transparent outline-none text-sm placeholder-zinc-500 w-full text-white"
                />
              </div>
              <button
                onClick={() => setShowFilters((s) => !s)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-colors border ${
                  showFilters || activeFilterCount > 0
                    ? 'bg-indigo-600/15 border-indigo-500/40 text-indigo-300'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                }`}
              >
                <Filter size={16} /> Filters
                {activeFilterCount > 0 && ` (${activeFilterCount})`}
              </button>
            </div>

            {showFilters && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Filters</h3>
                  {activeFilterCount > 0 && (
                    <button
                      onClick={clearFilters}
                      className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                      Clear all
                    </button>
                  )}
                </div>

                <div>
                  <p className="text-xs text-zinc-400 mb-2">Session type</p>
                  <div className="flex gap-2 flex-wrap">
                    {[
                      { type: 'video', label: 'Video' },
                      { type: 'in-person', label: 'In-person' },
                      { type: 'phone', label: 'Phone' },
                    ].map(({ type, label }) => {
                      const Icon = sessionIcon[type];
                      const on = filterSessionTypes.includes(type);
                      return (
                        <button
                          key={type}
                          onClick={() => toggleSessionType(type)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                            on
                              ? 'bg-indigo-600 border-indigo-600 text-white'
                              : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:border-zinc-600'
                          }`}
                        >
                          <Icon size={13} /> {label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <p className="text-xs text-zinc-400 mb-2">Minimum rating</p>
                  <div className="flex gap-2 flex-wrap">
                    {[
                      { value: 0, label: 'Any' },
                      { value: 4.0, label: '4.0+' },
                      { value: 4.5, label: '4.5+' },
                      { value: 4.8, label: '4.8+' },
                    ].map(({ value, label }) => (
                      <button
                        key={label}
                        onClick={() => setMinRating(value)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                          minRating === value
                            ? 'bg-indigo-600 border-indigo-600 text-white'
                            : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:border-zinc-600'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={availableOnly}
                    onChange={(e) => setAvailableOnly(e.target.checked)}
                    className="w-4 h-4 accent-indigo-600"
                  />
                  <span className="text-xs text-zinc-300">Available now only</span>
                </label>
              </div>
            )}

            <div className="flex gap-2 flex-wrap">
              {specialties.map((s) => (
                <button
                  key={s}
                  onClick={() => setActiveSpecialty(s)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    activeSpecialty === s
                      ? 'bg-indigo-600 text-white'
                      : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 overflow-y-auto min-h-0 flex-1 pr-1">
              {filtered.map((t) => (
                <div
                  key={t.id}
                  className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex flex-col hover:border-zinc-700 transition-colors"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className={`w-11 h-11 rounded-full ${t.color} flex items-center justify-center text-sm font-semibold shrink-0`}
                    >
                      {t.initials}
                    </div>
                    <div className="leading-tight min-w-0">
                      <p className="text-sm font-semibold truncate">{t.name}</p>
                      <p className="text-xs text-zinc-500 truncate">{t.title}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-xs text-amber-400 mb-3">
                    <Star size={13} fill="currentColor" />
                    <span className="font-medium">{t.rating}</span>
                    <span className="text-zinc-500">({t.reviews} reviews)</span>
                  </div>

                  <div className="flex gap-1.5 flex-wrap mb-3">
                    {t.specialties.map((s) => (
                      <span
                        key={s}
                        className="text-xs px-2.5 py-1 rounded-full bg-indigo-950 text-indigo-300"
                      >
                        {s}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 text-zinc-500 mb-4">
                    {t.sessionTypes.map((type) => {
                      const Icon = sessionIcon[type];
                      return <Icon key={type} size={14} />;
                    })}
                    <span className="text-xs ml-auto text-zinc-300 font-medium">{t.price}</span>
                  </div>

                  <button
                    disabled={!t.available}
                    className={`mt-auto w-full py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      t.available
                        ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                        : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                    }`}
                  >
                    {t.available ? 'Book Session' : 'Currently Full'}
                  </button>
                </div>
              ))}
              {filtered.length === 0 && (
                <p className="text-zinc-500 text-sm text-center py-10 sm:col-span-2">
                  No therapists match your filters.
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-5 overflow-y-auto min-h-0">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={16} className="text-indigo-400" />
                <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">
                  Powered by Gemini
                </span>
              </div>
              <h3 className="font-semibold text-sm mb-2">Matched for you</h3>
              <p className="text-xs text-zinc-400 leading-relaxed mb-3">
                Your recent entries mention sleep and stress most often, therapists specializing in
                those areas are highlighted below.
              </p>
              <button className="text-xs text-indigo-400 font-medium flex items-center gap-1">
                See matches <BarChart3 size={12} />
              </button>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
              <h3 className="font-semibold text-sm mb-3">How booking works</h3>
              <div className="flex flex-col gap-3 text-xs text-zinc-400">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-300 shrink-0">
                    1
                  </div>
                  Browse and pick a therapist that fits
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-300 shrink-0">
                    2
                  </div>
                  Choose a time that works for you
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-300 shrink-0">
                    3
                  </div>
                  Meet by video, phone, or in person
                </div>
              </div>
            </div>

            <div className="bg-emerald-950 border border-emerald-900 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <BadgeCheck size={16} className="text-emerald-400" />
                <h3 className="font-semibold text-sm">Licensed & verified</h3>
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed">
                Every therapist on MindSpace is licensed and credential-verified before joining the
                platform.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
