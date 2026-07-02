import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import Dashboard from "./pages/Dashboard";
import MoodJournal from "./pages/MoodJournal";
import MoodTrends from "./pages/MoodTrends";
import CommunityForum from "./pages/CommunityForum";
import FindATherapist from "./pages/FindATherapist";
import Settings from "./pages/Settings";
import Booking from "./pages/Booking";
import Legal from "./pages/Legal";
import { isAuthenticated } from "./auth";

// Gate app routes behind login. Logged-out users are sent to Sign In.
function RequireAuth({ children }) {
  return isAuthenticated() ? children : <Navigate to="/signin" replace />;
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

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        {/* Public */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/privacy" element={<Legal kind="privacy" />} />
        <Route path="/terms" element={<Legal kind="terms" />} />

        {/* Protected */}
        <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
        <Route path="/mood-journal" element={<RequireAuth><MoodJournal /></RequireAuth>} />
        <Route path="/mood-trends" element={<RequireAuth><MoodTrends /></RequireAuth>} />
        <Route path="/community-forum" element={<RequireAuth><CommunityForum /></RequireAuth>} />
        <Route path="/find-a-therapist" element={<RequireAuth><FindATherapist /></RequireAuth>} />
        <Route path="/settings" element={<RequireAuth><Settings /></RequireAuth>} />
        <Route path="/booking" element={<RequireAuth><Booking /></RequireAuth>} />
      </Routes>
    </BrowserRouter>
  );
}
