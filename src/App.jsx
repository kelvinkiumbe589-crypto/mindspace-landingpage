import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import Dashboard from "./pages/Dashboard";
import MoodJournal from "./pages/MoodJournal";
import MoodTrends from "./pages/MoodTrends";
import CommunityForum from "./pages/CommunityForum";
import Messages from "./pages/Messages";
import FindATherapist from "./pages/FindATherapist";
import Settings from "./pages/Settings";
import Booking from "./pages/Booking";
import Legal from "./pages/Legal";
import { isAuthenticated } from "./auth";
import { trackPageView } from "./lib/analytics";
import { CallProvider } from "./lib/call";

// Gate app routes behind login. Logged-out users are sent to Sign In.
function RequireAuth({ children }) {
  return isAuthenticated() ? children : <Navigate to="/signin" replace />;
}

// Receives shared text from the OS share sheet (PWA share target), stashes it,
// and hands off to the Mood Journal which opens the composer prefilled.
function ShareReceiver() {
  const navigate = useNavigate();
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const text = [p.get("title"), p.get("text"), p.get("url")].filter(Boolean).join(" ").trim();
    if (text) {
      try { sessionStorage.setItem("mindspace_shared_text", text); } catch (e) {}
    }
    navigate("/mood-journal", { replace: true });
  }, [navigate]);
  return null;
}

// Reset scroll to the top whenever the route changes, so pages don't open
// mid-way down after navigating from a scrolled page.
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

// Record an anonymous page view on every route change.
function PageViewTracker() {
  const { pathname } = useLocation();
  useEffect(() => {
    trackPageView(pathname);
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <PageViewTracker />
      <CallProvider>
      <Routes>
        {/* Public */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/privacy" element={<Legal kind="privacy" />} />
        <Route path="/terms" element={<Legal kind="terms" />} />
        <Route path="/share" element={<ShareReceiver />} />

        {/* Protected */}
        <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
        <Route path="/mood-journal" element={<RequireAuth><MoodJournal /></RequireAuth>} />
        <Route path="/mood-trends" element={<RequireAuth><MoodTrends /></RequireAuth>} />
        <Route path="/community-forum" element={<RequireAuth><CommunityForum /></RequireAuth>} />
        <Route path="/messages" element={<RequireAuth><Messages /></RequireAuth>} />
        <Route path="/find-a-therapist" element={<RequireAuth><FindATherapist /></RequireAuth>} />
        <Route path="/settings" element={<RequireAuth><Settings /></RequireAuth>} />
        <Route path="/booking" element={<RequireAuth><Booking /></RequireAuth>} />
      </Routes>
      </CallProvider>
    </BrowserRouter>
  );
}
