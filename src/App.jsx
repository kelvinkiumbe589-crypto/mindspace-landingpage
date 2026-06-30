import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import Dashboard from "./pages/Dashboard";
import MoodJournal from "./pages/MoodJournal";
import MoodTrends from "./pages/MoodTrends";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/journal" element={<MoodJournal />} />
        <Route path="/trends" element={<MoodTrends />} />
      </Routes>
    </BrowserRouter>
  );
}
