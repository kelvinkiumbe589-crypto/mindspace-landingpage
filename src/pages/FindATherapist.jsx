import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Search,
  Filter,
  Star,
  Video,
  MapPin,
  Sparkles,
  BadgeCheck,
  BarChart3,
  Sun,
  Moon,
  Clock,
  CheckCircle2,
  ArrowRight,
  Trash2,
} from 'lucide-react';
import { useTheme } from '../theme';
import { useReveal } from '../useReveal';
import Sidebar from '../components/Sidebar';
import SessionChat from '../components/SessionChat';
import SessionRoom from '../components/SessionRoom';
import { AccountGear } from '../components/AccountDrawer';
import { useSupportUnread, openSupportChat } from '../useSupportUnread';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080';
const specialties = ['All', 'Anxiety', 'Depression', 'Relationships', 'Trauma', 'Sleep', 'Stress'];

export default function FindATherapist() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const unread = useSupportUnread();
  useReveal([]);
  const [activeSpecialty, setActiveSpecialty] = useState('All');
  const [query, setQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [availableOnly, setAvailableOnly] = useState(false);
  const [minRating, setMinRating] = useState(0);

  const [therapists, setTherapists] = useState([]);
  const [loadingT, setLoadingT] = useState(true);
  const [bookings, setBookings] = useState([]);

  const token = () => localStorage.getItem('mindspace_token');

  const loadTherapists = async () => {
    try {
      const r = await fetch(`${API_BASE}/api/therapists`);
      if (r.ok) setTherapists(await r.json());
    } catch (e) {} finally { setLoadingT(false); }
  };
  const loadBookings = async () => {
    if (!token()) return;
    try {
      const r = await fetch(`${API_BASE}/api/bookings/me`, { headers: { Authorization: `Bearer ${token()}` } });
      if (r.ok) setBookings(await r.json());
    } catch (e) {}
  };
  useEffect(() => {
    loadTherapists();
    loadBookings();
    const onFocus = () => loadBookings();
    window.addEventListener('focus', onFocus);
    const id = setInterval(loadBookings, 15000);
    return () => { window.removeEventListener('focus', onFocus); clearInterval(id); };
  }, []);

  const clearFilters = () => { setAvailableOnly(false); setMinRating(0); };
  const activeFilterCount = (availableOnly ? 1 : 0) + (minRating > 0 ? 1 : 0);

  const filtered = therapists.filter((t) => {
    const matchesSpecialty = activeSpecialty === 'All' || (t.specialties || []).includes(activeSpecialty);
    const matchesQuery = t.name.toLowerCase().includes(query.toLowerCase());
    const matchesAvailable = !availableOnly || t.available;
    const matchesRating = (t.rating || 0) >= minRating;
    return matchesSpecialty && matchesQuery && matchesAvailable && matchesRating;
  });

  // Booking groups (server statuses)
  const [activeRoom, setActiveRoom] = useState(null);
  const incomplete = bookings.filter((b) => b.status === 'PENDING_PAYMENT' || b.status === 'FAILED');
  const awaiting = bookings.filter((b) => b.status === 'AWAITING_APPROVAL');
  const upcoming = bookings.filter((b) => b.status === 'APPROVED');
  const done = bookings.filter((b) => b.status === 'DONE');

  const therapistById = (id) => therapists.find((t) => t.userId === id);
  const continueBooking = (b) => { const t = therapistById(b.therapistId); if (t) navigate('/booking', { state: { therapist: t } }); };

  const deleteBooking = async (id) => {
    if (!token()) return;
    try {
      await fetch(`${API_BASE}/api/bookings/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token()}` } });
      loadBookings();
    } catch (e) {}
  };
  const rateBooking = async (id, rating) => {
    if (!token()) return;
    try {
      await fetch(`${API_BASE}/api/bookings/${id}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ rating }),
      });
      loadBookings();
      loadTherapists(); // refresh the therapist's average rating in the directory
    } catch (e) {}
  };
  const fmtSched = (iso) => { if (!iso) return 'Time TBD'; try { return new Date(iso).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }); } catch (e) { return ''; } };
  const label = (b) => `${b.sessionType === 'PHYSICAL' ? 'In-person' : 'Online'} · KES ${Number(b.amount).toLocaleString()}`;

  return (
    <div className="flex bg-[var(--bg)] min-h-screen text-[var(--text)] font-sans">
      {activeRoom && <SessionRoom bookingId={activeRoom} onClose={() => setActiveRoom(null)} />}
      <Sidebar />

      <main className="flex-1 px-8 py-6 h-screen flex flex-col overflow-hidden">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">Find a Therapist <span>🩺</span></h1>
            <p className="text-indigo-400 text-sm mt-1">Connect with licensed professionals who understand what you're going through</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={toggleTheme} title="Toggle light / dark mode" className="w-9 h-9 rounded-full bg-[var(--card)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)] transition-colors">
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button onClick={openSupportChat} title={unread > 0 ? `${unread} new repl${unread === 1 ? 'y' : 'ies'} from support` : 'Notifications'}
              className={`relative w-9 h-9 rounded-full bg-[var(--card)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)] transition-colors ${unread > 0 ? 'support-glow' : ''}`}>
              <Bell size={18} />
              {unread > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#e5484d] text-white text-[10px] font-bold flex items-center justify-center border-2 border-[var(--bg)] leading-none">{unread > 9 ? '9+' : unread}</span>
              )}
            </button>
            <AccountGear size={36} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
          <div className="lg:col-span-2 flex flex-col gap-5 min-h-0">
            <div className="flex gap-3">
              <div className="flex-1 flex items-center gap-2 bg-[var(--card)] border border-[var(--border)] rounded-xl px-4 py-2.5">
                <Search size={16} className="text-[var(--text-dim)]" />
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name or specialty..." className="bg-transparent outline-none text-sm placeholder-zinc-500 w-full text-[var(--text)]" />
              </div>
              <button onClick={() => setShowFilters((s) => !s)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-colors border ${showFilters || activeFilterCount > 0 ? 'bg-indigo-600/15 border-indigo-500/40 text-indigo-300' : 'bg-[var(--card)] border-[var(--border)] text-[var(--text-soft)]'}`}>
                <Filter size={16} /> Filters{activeFilterCount > 0 && ` (${activeFilterCount})`}
              </button>
            </div>

            {showFilters && (
              <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Filters</h3>
                  {activeFilterCount > 0 && <button onClick={clearFilters} className="text-xs text-indigo-400 hover:text-indigo-300">Clear all</button>}
                </div>
                <div>
                  <p className="text-xs text-[var(--text-muted)] mb-2">Minimum rating</p>
                  <div className="flex gap-2 flex-wrap">
                    {[{ value: 0, label: 'Any' }, { value: 4.0, label: '4.0+' }, { value: 4.5, label: '4.5+' }, { value: 4.8, label: '4.8+' }].map(({ value, label }) => (
                      <button key={label} onClick={() => setMinRating(value)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${minRating === value ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-[var(--card-2)] border-[var(--border)] text-[var(--text-soft)]'}`}>{label}</button>
                    ))}
                  </div>
                </div>
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input type="checkbox" checked={availableOnly} onChange={(e) => setAvailableOnly(e.target.checked)} className="w-4 h-4 accent-indigo-600" />
                  <span className="text-xs text-[var(--text-soft)]">Available now only</span>
                </label>
              </div>
            )}

            <div className="flex gap-2 flex-wrap">
              {specialties.map((s) => (
                <button key={s} onClick={() => setActiveSpecialty(s)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors ${activeSpecialty === s ? 'bg-indigo-600 text-white' : 'bg-[var(--card)] text-[var(--text-muted)] hover:text-[var(--text-soft)] border border-[var(--border)]'}`}>{s}</button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 overflow-y-auto min-h-0 flex-1 pr-1 content-start">
              {loadingT && <p className="text-[var(--text-dim)] text-sm py-10 sm:col-span-2 text-center">Loading therapists…</p>}
              {!loadingT && filtered.map((t) => (
                <div key={t.id} className="hover-lift bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 flex flex-col transition-colors">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 text-white" style={{ background: t.color || '#534AB7' }}>{t.initials}</div>
                    <div className="leading-tight min-w-0">
                      <p className="text-sm font-semibold truncate flex items-center gap-1.5">
                        {t.available && <span className="pulse-dot" style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#1D9E75', flexShrink: 0 }} />}
                        {t.name}
                      </p>
                      <p className="text-xs text-[var(--text-dim)] truncate">{t.title}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-amber-400 mb-3">
                    <Star size={13} fill="currentColor" /><span className="font-medium">{t.rating}</span>
                    <span className="text-[var(--text-dim)]">({t.reviews} reviews)</span>
                  </div>
                  <div className="flex gap-1.5 flex-wrap mb-3">
                    {(t.specialties || []).map((s) => <span key={s} className="text-xs px-2.5 py-1 rounded-full bg-indigo-950 text-indigo-300">{s}</span>)}
                  </div>
                  <div className="flex items-center gap-2 text-[var(--text-dim)] mb-4">
                    <Video size={14} /><MapPin size={14} />
                    <span className="text-xs ml-auto text-[var(--text-soft)] font-medium">from KES {Number(t.priceOnline).toLocaleString()}</span>
                  </div>
                  <button disabled={!t.available} onClick={() => navigate('/booking', { state: { therapist: t } })}
                    className={`mt-auto w-full py-2.5 rounded-xl text-sm font-medium transition-colors ${t.available ? 'bg-indigo-600 hover:bg-indigo-500 text-white' : 'bg-[var(--card-2)] text-[var(--text-dim)] cursor-not-allowed'}`}>
                    {t.available ? 'Book Session' : 'Currently Full'}
                  </button>
                </div>
              ))}
              {!loadingT && filtered.length === 0 && (
                <p className="text-[var(--text-dim)] text-sm text-center py-10 sm:col-span-2">
                  {therapists.length === 0 ? 'No therapists available yet — please check back soon.' : 'No therapists match your filters.'}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-5 overflow-y-auto min-h-0">
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={16} className="text-indigo-400" />
                <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--card-2)] text-[var(--text-muted)]">Powered by Gemini</span>
              </div>
              <h3 className="font-semibold text-sm mb-2">Matched for you</h3>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed mb-3">Your recent entries mention sleep and stress most often, therapists specializing in those areas are highlighted below.</p>
              <button className="text-xs text-indigo-400 font-medium flex items-center gap-1">See matches <BarChart3 size={12} /></button>
            </div>

            <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5">
              <h3 className="font-semibold text-sm mb-3">How booking works</h3>
              <div className="flex flex-col gap-3 text-xs text-[var(--text-muted)]">
                <div className="flex items-center gap-3"><div className="w-6 h-6 rounded-full bg-[var(--card-2)] flex items-center justify-center text-[var(--text-soft)] shrink-0">1</div>Pick a therapist and a time that works</div>
                <div className="flex items-center gap-3"><div className="w-6 h-6 rounded-full bg-[var(--card-2)] flex items-center justify-center text-[var(--text-soft)] shrink-0">2</div>Pay securely — online or in person</div>
                <div className="flex items-center gap-3"><div className="w-6 h-6 rounded-full bg-[var(--card-2)] flex items-center justify-center text-[var(--text-soft)] shrink-0">3</div>Your therapist approves and meets you</div>
              </div>
            </div>

            <div className="bg-emerald-950 border border-emerald-900 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-2"><BadgeCheck size={16} className="text-emerald-400" /><h3 className="font-semibold text-sm">Licensed & verified</h3></div>
              <p className="text-xs text-[var(--text-soft)] leading-relaxed">Every therapist on MindSpace is licensed and credential-verified before joining the platform.</p>
            </div>

            {(incomplete.length > 0 || awaiting.length > 0 || upcoming.length > 0 || done.length > 0) && (
              <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5">
                <h3 className="font-semibold text-sm mb-3">My sessions</h3>

                {incomplete.length > 0 && (
                  <div className="mb-4">
                    <p className="text-[11px] uppercase tracking-wide text-[var(--text-dim)] mb-2 flex items-center gap-1.5"><Clock size={12} className="text-rose-400" /> Incomplete</p>
                    <div className="flex flex-col gap-2">
                      {incomplete.map((b) => (
                        <div key={b.id} className="bg-[var(--card-2)] border border-[var(--border)] rounded-xl p-3 flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-xs font-semibold truncate">{b.therapistName}</p>
                            <p className="text-[11px] text-[var(--text-dim)]">{label(b)} · {fmtSched(b.scheduledAt)}</p>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {therapistById(b.therapistId) && (
                              <button onClick={() => continueBooking(b)} className="flex items-center gap-1 text-[11px] font-medium bg-indigo-600 hover:bg-indigo-500 text-white px-2.5 py-1.5 rounded-lg">Continue <ArrowRight size={12} /></button>
                            )}
                            <button onClick={() => deleteBooking(b.id)} title="Remove" className="w-7 h-7 flex items-center justify-center rounded-lg text-[var(--text-dim)] hover:text-rose-400 hover:bg-rose-500/10"><Trash2 size={13} /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {awaiting.length > 0 && (
                  <div className="mb-4">
                    <p className="text-[11px] uppercase tracking-wide text-[var(--text-dim)] mb-2 flex items-center gap-1.5"><Clock size={12} className="text-amber-400" /> Awaiting approval</p>
                    <div className="flex flex-col gap-2">
                      {awaiting.map((b) => (
                        <div key={b.id} className="bg-[var(--card-2)] border border-[var(--border)] rounded-xl p-3 flex items-center justify-between gap-2">
                          <div className="min-w-0"><p className="text-xs font-semibold truncate">{b.therapistName}</p><p className="text-[11px] text-[var(--text-dim)]">{label(b)} · {fmtSched(b.scheduledAt)}</p></div>
                          <span className="shrink-0 text-[10px] font-semibold px-2 py-1 rounded-full bg-amber-500/15 text-amber-400">Pending</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {upcoming.length > 0 && (
                  <div className="mb-4">
                    <p className="text-[11px] uppercase tracking-wide text-[var(--text-dim)] mb-2 flex items-center gap-1.5"><CheckCircle2 size={12} className="text-sky-400" /> Upcoming</p>
                    <div className="flex flex-col gap-2">
                      {upcoming.map((b) => (
                        <div key={b.id} className="bg-[var(--card-2)] border border-[var(--border)] rounded-xl p-3 flex flex-col gap-2">
                          <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0"><p className="text-xs font-semibold truncate">{b.therapistName}</p><p className="text-[11px] text-[var(--text-dim)]">{label(b)} · {fmtSched(b.scheduledAt)}</p></div>
                            <div className="shrink-0 flex items-center gap-2">
                              {b.sessionType === 'ONLINE' && (
                                <button onClick={() => setActiveRoom(b.id)} className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 transition-colors" title="Join video call">
                                  <Video size={12} /> Join call
                                </button>
                              )}
                              {b.sessionType === 'PHYSICAL' && b.practiceMapUrl && (
                                <a href={b.practiceMapUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 transition-colors" title="Open location in Google Maps">
                                  <MapPin size={12} /> Location
                                </a>
                              )}
                              <SessionChat bookingId={b.id} title={b.therapistName} />
                              <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-sky-500/15 text-sky-400">Confirmed</span>
                            </div>
                          </div>
                          {b.sessionType === 'PHYSICAL' && (b.practiceAddress || b.checkInCode) && (
                            <div className="text-[11px] text-[var(--text-dim)] border-t border-[var(--border)] pt-2 flex flex-col gap-1">
                              {b.practiceAddress && <span className="flex items-start gap-1.5"><MapPin size={12} className="mt-0.5 shrink-0" /> {b.practiceAddress}</span>}
                              {b.practiceNotes && <span className="pl-[18px]">{b.practiceNotes}</span>}
                              {b.checkInCode && <span className="pl-[18px]">Check-in code: <span className="font-semibold text-[var(--text-soft)] tracking-widest">{b.checkInCode}</span></span>}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {done.length > 0 && (
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-[var(--text-dim)] mb-2 flex items-center gap-1.5"><CheckCircle2 size={12} className="text-emerald-400" /> History</p>
                    <div className="flex flex-col gap-2">
                      {done.map((b) => (
                        <div key={b.id} className="bg-[var(--card-2)] border border-[var(--border)] rounded-xl p-3">
                          <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0"><p className="text-xs font-semibold truncate">{b.therapistName}</p><p className="text-[11px] text-[var(--text-dim)]">{label(b)} · {fmtSched(b.scheduledAt)}</p></div>
                            <div className="shrink-0 flex items-center gap-2">
                              <SessionChat bookingId={b.id} title={b.therapistName} />
                              <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-emerald-500/15 text-emerald-400">Done</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 mt-2">
                            <span className="text-[11px] text-[var(--text-dim)] mr-1">{b.rating ? 'Your rating' : 'Rate:'}</span>
                            {[1, 2, 3, 4, 5].map((n) => (
                              <button key={n} onClick={() => rateBooking(b.id, n)} title={`${n} star${n > 1 ? 's' : ''}`} className="text-amber-400 hover:scale-110 transition-transform">
                                <Star size={15} fill={(b.rating || 0) >= n ? 'currentColor' : 'none'} />
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
