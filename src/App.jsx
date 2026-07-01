import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import Dashboard from "./pages/Dashboard";
import MoodJournal from "./pages/MoodJournal";
import MoodTrends from "./pages/MoodTrends";
import CommunityForum from "./pages/CommunityForum";
import FindATherapist from "./pages/FindATherapist";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/mood-journal" element={<MoodJournal />} />
        <Route path="/mood-trends" element={<MoodTrends />} />
        <Route path="/community-forum" element={<CommunityForum />} />
        <Route path="/find-a-therapist" element={<FindATherapist />} />
      </Routes>
    </BrowserRouter>
  );
}
