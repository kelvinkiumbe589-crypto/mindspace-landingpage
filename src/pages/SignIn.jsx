import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function SignIn() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");

  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleGoogle = () => {
    window.location.href = "http://localhost:8080/oauth2/authorization/google";
  };

  const validate = () => {
    const newErrors = {};
    if (!email.trim()) newErrors.email = "Email is required";
    else if (!isValidEmail(email)) newErrors.email = "Enter a valid email address";
    if (!password) newErrors.password = "Password is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    setServerError("");
    if (!validate()) return;
    setLoading(true);
    try {
      const response = await fetch("http://localhost:8080/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem("mindspace_user", JSON.stringify({ name: data.username || email.split("@")[0] }));
        if (data.token) localStorage.setItem("mindspace_token", data.token);
        navigate("/dashboard");
      } else {
        setServerError(data.message || "Invalid email or password.");
      }
    } catch (err) {
      setServerError("Could not connect to server. Make sure the backend is running on port 8080.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0d0d14", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui, sans-serif", padding: "20px", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: "-100px", left: "-100px", width: "400px", height: "400px", borderRadius: "50%", background: "radial-gradient(circle, rgba(83,74,183,0.15) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ width: "100%", maxWidth: "420px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(127,119,221,0.2)", borderRadius: "24px", padding: "40px", backdropFilter: "blur(20px)", boxShadow: "0 25px 60px rgba(0,0,0,0.4)", position: "relative", zIndex: 1 }}>

        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "32px" }}>
          <div style={{ width: "36px", height: "36px", background: "#534AB7", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}>🧠</div>
          <span style={{ fontSize: "18px", fontWeight: 600, color: "#f0eeff" }}>MindSpace</span>
        </div>

        <h1 style={{ fontSize: "26px", fontWeight: 600, color: "#f0eeff", marginBottom: "6px" }}>Welcome back</h1>
        <p style={{ fontSize: "14px", color: "#6b6990", marginBottom: "24px" }}>Sign in to continue your wellness journey</p>

        {serverError && (
          <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "10px", padding: "12px", fontSize: "13px", color: "#fca5a5", marginBottom: "16px" }}>
            ⚠️ {serverError}
          </div>
        )}

        <button onClick={handleGoogle} type="button" style={{ width: "100%", padding: "13px", borderRadius: "12px", border: "1px solid rgba(127,119,221,0.25)", background: "rgba(255,255,255,0.05)", color: "#e8e6ff", fontSize: "14px", fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", marginBottom: "20px" }}>
          <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/><path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/><path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z"/><path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z"/></svg>
          Continue with Google
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
          <div style={{ flex: 1, height: "1px", background: "rgba(127,119,221,0.15)" }} />
          <span style={{ fontSize: "12px", color: "#4a4870" }}>or sign in with email</span>
          <div style={{ flex: 1, height: "1px", background: "rgba(127,119,221,0.15)" }} />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div>
            <label style={{ fontSize: "12px", color: "#9d9bc4", display: "block", marginBottom: "6px" }}>Email address</label>
            <input
              type="email" value={email}
              onChange={e => { setEmail(e.target.value); setErrors({ ...errors, email: "" }); setServerError(""); }}
              placeholder="you@university.ac.ke"
              style={{ width: "100%", padding: "12px 14px", borderRadius: "10px", border: `1px solid ${errors.email ? "#ef4444" : "rgba(127,119,221,0.2)"}`, background: "rgba(255,255,255,0.04)", color: "#e8e6ff", fontSize: "14px", outline: "none", boxSizing: "border-box" }}
            />
            {errors.email && <p style={{ fontSize: "11px", color: "#ef4444", marginTop: "4px" }}>{errors.email}</p>}
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
              <label style={{ fontSize: "12px", color: "#9d9bc4" }}>Password</label>
              <a href="#" style={{ fontSize: "12px", color: "#7F77DD", textDecoration: "none" }}>Forgot password?</a>
            </div>
            <div style={{ position: "relative" }}>
              <input
                type={showPass ? "text" : "password"} value={password}
                onChange={e => { setPassword(e.target.value); setErrors({ ...errors, password: "" }); setServerError(""); }}
                placeholder="••••••••"
                style={{ width: "100%", padding: "12px 40px 12px 14px", borderRadius: "10px", border: `1px solid ${errors.password ? "#ef4444" : "rgba(127,119,221,0.2)"}`, background: "rgba(255,255,255,0.04)", color: "#e8e6ff", fontSize: "14px", outline: "none", boxSizing: "border-box" }}
              />
              <button onClick={() => setShowPass(!showPass)} type="button" style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#6b6990", fontSize: "16px", padding: 0 }}>
                {showPass ? "🙈" : "👁️"}
              </button>
            </div>
            {errors.password && <p style={{ fontSize: "11px", color: "#ef4444", marginTop: "4px" }}>{errors.password}</p>}
          </div>

          <button onClick={handleSubmit} disabled={loading} type="button" style={{ width: "100%", padding: "13px", borderRadius: "12px", border: "none", background: loading ? "#3d3690" : "#534AB7", color: "#fff", fontSize: "14px", fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", marginTop: "6px" }}>
            {loading ? "Signing in..." : "Sign in →"}
          </button>
        </div>

        <p style={{ textAlign: "center", fontSize: "13px", color: "#6b6990", marginTop: "24px" }}>
          Don't have an account?{" "}
          <span onClick={() => navigate("/signup")} style={{ color: "#7F77DD", cursor: "pointer", fontWeight: 500 }}>Create one free</span>
        </p>
      </div>
    </div>
  );
}
