import { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8080";

export default function SignIn() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [step, setStep] = useState("credentials"); // "credentials" | "otp" | "forgot" | "reset"
  const [code, setCode] = useState("");
  const [resending, setResending] = useState(false);
  const [trustDevice, setTrustDevice] = useState(true);
  const [newPassword, setNewPassword] = useState("");

  const finishLogin = (data) => {
    if (data.token) localStorage.setItem("mindspace_token", data.token);
    if (data.deviceToken) localStorage.setItem("mindspace_device_token", data.deviceToken);
    localStorage.setItem("mindspace_user", JSON.stringify({ name: data.username, email: data.email }));
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (loading) return;
    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const deviceToken = localStorage.getItem("mindspace_device_token") || "";
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password, deviceToken }),
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok) {
        if (data.token) {
          // Recognised device — skipped the OTP.
          finishLogin(data);
          setSuccess(`Signed in successfully! Welcome back${data.username ? ", " + data.username.split(" ")[0] : ""}…`);
          setTimeout(() => navigate("/dashboard"), 900);
        } else {
          // A verification code was emailed. Move to the OTP step.
          setStep("otp");
          setSuccess(data.message || `We sent a 6-digit code to ${email.trim()}.`);
        }
      } else {
        const msg = data.error || (data && typeof data === "object" ? Object.values(data)[0] : null);
        setError(msg || "Sign in failed. Please check your credentials.");
      }
    } catch (err) {
      setError("Could not connect to the server. Make sure the backend is running on port 8080.");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (e) => {
    if (e) e.preventDefault();
    if (loading) return;
    if (code.trim().length !== 6) {
      setError("Enter the 6-digit code from your email.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_BASE}/api/auth/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), code: code.trim(), purpose: "LOGIN", trustDevice }),
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok) {
        finishLogin(data);
        setSuccess(`Verified! Welcome back${data.username ? ", " + data.username.split(" ")[0] : ""}…`);
        setTimeout(() => navigate("/dashboard"), 900);
      } else {
        setError(data.error || "Verification failed. Please try again.");
      }
    } catch (err) {
      setError("Could not connect to the server. Make sure the backend is running on port 8080.");
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    if (resending) return;
    setResending(true);
    setError("");
    try {
      const response = await fetch(`${API_BASE}/api/auth/resend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), purpose: "LOGIN" }),
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok) setSuccess(data.message || "A new code is on its way.");
      else setError(data.error || "Couldn't resend the code.");
    } catch (err) {
      setError("Could not connect to the server.");
    } finally {
      setResending(false);
    }
  };

  // Step 1 of reset: email a code.
  const sendResetCode = async (e) => {
    if (e) e.preventDefault();
    if (loading) return;
    if (!email.trim()) {
      setError("Enter your email to reset your password.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_BASE}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok) {
        setStep("reset");
        setSuccess(data.message || "If an account exists, a reset code has been sent.");
      } else {
        setError(data.error || "Could not send a reset code.");
      }
    } catch (err) {
      setError("Could not connect to the server. Make sure the backend is running on port 8080.");
    } finally {
      setLoading(false);
    }
  };

  // Step 2 of reset: set the new password with the code, then sign in.
  const doResetPassword = async (e) => {
    if (e) e.preventDefault();
    if (loading) return;
    if (code.trim().length !== 6) {
      setError("Enter the 6-digit code from your email.");
      return;
    }
    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_BASE}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), code: code.trim(), newPassword }),
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok) {
        finishLogin(data);
        setSuccess("Password reset! Signing you in…");
        setTimeout(() => navigate("/dashboard"), 1000);
      } else {
        setError(data.error || "Could not reset your password.");
      }
    } catch (err) {
      setError("Could not connect to the server. Make sure the backend is running on port 8080.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = () => {
    // Replace with your Google OAuth URL
    window.location.href = `${API_BASE}/oauth2/authorization/google`;
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0d0d14",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "system-ui, sans-serif",
      padding: "20px",
      position: "relative",
      overflow: "hidden",
    }}>

      {/* Background glow effects */}
      <div style={{
        position: "absolute", top: "-100px", left: "-100px",
        width: "400px", height: "400px", borderRadius: "50%",
        background: "radial-gradient(circle, rgba(83,74,183,0.15) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", bottom: "-100px", right: "-100px",
        width: "400px", height: "400px", borderRadius: "50%",
        background: "radial-gradient(circle, rgba(127,119,221,0.1) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      <div style={{
        width: "100%", maxWidth: "420px",
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(127,119,221,0.2)",
        borderRadius: "24px",
        padding: "40px",
        backdropFilter: "blur(20px)",
        boxShadow: "0 25px 60px rgba(0,0,0,0.4)",
        position: "relative",
        zIndex: 1,
      }}>

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "32px" }}>
          <div style={{
            width: "36px", height: "36px", background: "#534AB7",
            borderRadius: "10px", display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: "18px",
          }}>🧠</div>
          <span style={{ fontSize: "18px", fontWeight: 600, color: "#f0eeff" }}>MindSpace</span>
        </div>

        {/* Heading */}
        <h1 style={{ fontSize: "26px", fontWeight: 600, color: "#f0eeff", marginBottom: "6px" }}>
          {step === "otp" ? "Verify it's you" : step === "forgot" ? "Reset your password" : step === "reset" ? "Set a new password" : "Welcome back"}
        </h1>
        <p style={{ fontSize: "14px", color: "#6b6990", marginBottom: "28px" }}>
          {step === "otp" ? "Enter the 6-digit code we emailed you"
            : step === "forgot" ? "We'll email you a 6-digit reset code"
            : step === "reset" ? "Enter the code and choose a new password"
            : "Sign in to continue your wellness journey"}
        </p>

        {/* ── Forgot password: request code ── */}
        {step === "forgot" && (
          <>
            {error && (
              <div style={{ background: "rgba(216,90,48,0.12)", border: "1px solid rgba(216,90,48,0.3)", borderRadius: "10px", padding: "12px 14px", marginBottom: "16px", fontSize: "13px", color: "#f0a07a" }}>⚠️ {error}</div>
            )}
            {success && (
              <div style={{ background: "rgba(29,158,117,0.12)", border: "1px solid rgba(29,158,117,0.35)", borderRadius: "10px", padding: "12px 14px", marginBottom: "16px", fontSize: "13px", color: "#7ee0bc" }}>✓ {success}</div>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ fontSize: "12px", color: "#9d9bc4", display: "block", marginBottom: "6px" }}>Email address</label>
                <input type="email" autoFocus value={email} onChange={(e) => { setEmail(e.target.value); setError(""); }} onKeyDown={(e) => { if (e.key === "Enter") sendResetCode(e); }} placeholder="you@example.com"
                  style={{ width: "100%", padding: "12px 14px", borderRadius: "10px", border: "1px solid rgba(127,119,221,0.2)", background: "rgba(255,255,255,0.04)", color: "#e8e6ff", fontSize: "14px", outline: "none", boxSizing: "border-box" }} />
              </div>
              <button onClick={sendResetCode} disabled={loading} type="button" style={{ width: "100%", padding: "13px", borderRadius: "12px", border: "none", background: loading ? "#3d3690" : "#534AB7", color: "#fff", fontSize: "14px", fontWeight: 600, cursor: loading ? "not-allowed" : "pointer" }}>
                {loading ? "Sending…" : "Send reset code →"}
              </button>
              <span onClick={() => { setStep("credentials"); setError(""); setSuccess(""); }} style={{ fontSize: "12px", color: "#9d9bc4", cursor: "pointer", textAlign: "center" }}>← Back to sign in</span>
            </div>
          </>
        )}

        {/* ── Forgot password: enter code + new password ── */}
        {step === "reset" && (
          <>
            {error && (
              <div style={{ background: "rgba(216,90,48,0.12)", border: "1px solid rgba(216,90,48,0.3)", borderRadius: "10px", padding: "12px 14px", marginBottom: "16px", fontSize: "13px", color: "#f0a07a" }}>⚠️ {error}</div>
            )}
            {success && (
              <div style={{ background: "rgba(29,158,117,0.12)", border: "1px solid rgba(29,158,117,0.35)", borderRadius: "10px", padding: "12px 14px", marginBottom: "16px", fontSize: "13px", color: "#7ee0bc" }}>✓ {success}</div>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <input inputMode="numeric" autoFocus maxLength={6} value={code} onChange={(e) => { setCode(e.target.value.replace(/\D/g, "")); setError(""); }} placeholder="______"
                style={{ width: "100%", padding: "14px", borderRadius: "12px", border: "1px solid rgba(127,119,221,0.25)", background: "rgba(255,255,255,0.04)", color: "#f0eeff", fontSize: "26px", letterSpacing: "12px", textAlign: "center", outline: "none", boxSizing: "border-box", fontFamily: "monospace" }} />
              <div>
                <label style={{ fontSize: "12px", color: "#9d9bc4", display: "block", marginBottom: "6px" }}>New password</label>
                <input type={showPass ? "text" : "password"} value={newPassword} onChange={(e) => { setNewPassword(e.target.value); setError(""); }} onKeyDown={(e) => { if (e.key === "Enter") doResetPassword(e); }} placeholder="At least 6 characters"
                  style={{ width: "100%", padding: "12px 14px", borderRadius: "10px", border: "1px solid rgba(127,119,221,0.2)", background: "rgba(255,255,255,0.04)", color: "#e8e6ff", fontSize: "14px", outline: "none", boxSizing: "border-box" }} />
              </div>
              <button onClick={doResetPassword} disabled={loading} type="button" style={{ width: "100%", padding: "13px", borderRadius: "12px", border: "none", background: loading ? "#3d3690" : "#534AB7", color: "#fff", fontSize: "14px", fontWeight: 600, cursor: loading ? "not-allowed" : "pointer" }}>
                {loading ? "Resetting…" : "Reset password & sign in →"}
              </button>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                <span onClick={() => { setStep("credentials"); setCode(""); setNewPassword(""); setError(""); setSuccess(""); }} style={{ color: "#9d9bc4", cursor: "pointer" }}>← Back to sign in</span>
                <span onClick={sendResetCode} style={{ color: "#7F77DD", cursor: loading ? "default" : "pointer", fontWeight: 500 }}>Resend code</span>
              </div>
            </div>
          </>
        )}

        {/* ── OTP step ── */}
        {step === "otp" && (
          <>
            {error && (
              <div style={{ background: "rgba(216,90,48,0.12)", border: "1px solid rgba(216,90,48,0.3)", borderRadius: "10px", padding: "12px 14px", marginBottom: "16px", fontSize: "13px", color: "#f0a07a" }}>
                ⚠️ {error}
              </div>
            )}
            {success && (
              <div style={{ background: "rgba(29,158,117,0.12)", border: "1px solid rgba(29,158,117,0.35)", borderRadius: "10px", padding: "12px 14px", marginBottom: "16px", fontSize: "13px", color: "#7ee0bc" }}>
                ✓ {success}
              </div>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <input
                inputMode="numeric"
                autoFocus
                maxLength={6}
                value={code}
                onChange={(e) => { setCode(e.target.value.replace(/\D/g, "")); setError(""); }}
                onKeyDown={(e) => { if (e.key === "Enter") verifyOtp(e); }}
                placeholder="______"
                style={{ width: "100%", padding: "14px", borderRadius: "12px", border: "1px solid rgba(127,119,221,0.25)", background: "rgba(255,255,255,0.04)", color: "#f0eeff", fontSize: "26px", letterSpacing: "12px", textAlign: "center", outline: "none", boxSizing: "border-box", fontFamily: "monospace" }}
              />
              <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#9d9bc4", cursor: "pointer" }}>
                <input type="checkbox" checked={trustDevice} onChange={(e) => setTrustDevice(e.target.checked)} style={{ accentColor: "#534AB7", width: "15px", height: "15px" }} />
                Trust this device for 30 days (skip codes here)
              </label>
              <button onClick={verifyOtp} disabled={loading} type="button" style={{ width: "100%", padding: "13px", borderRadius: "12px", border: "none", background: loading ? "#3d3690" : "#534AB7", color: "#fff", fontSize: "14px", fontWeight: 600, cursor: loading ? "not-allowed" : "pointer" }}>
                {loading ? "Verifying…" : "Verify & sign in →"}
              </button>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                <span onClick={() => { setStep("credentials"); setCode(""); setError(""); setSuccess(""); }} style={{ color: "#9d9bc4", cursor: "pointer" }}>← Use a different account</span>
                <span onClick={resendOtp} style={{ color: "#7F77DD", cursor: resending ? "default" : "pointer", fontWeight: 500 }}>{resending ? "Sending…" : "Resend code"}</span>
              </div>
            </div>
          </>
        )}

        {/* ── Credentials step ── */}
        {step === "credentials" && (
        <>
        {/* Google Button */}
        <button
          onClick={handleGoogle}
          style={{
            width: "100%", padding: "13px", borderRadius: "12px",
            border: "1px solid rgba(127,119,221,0.25)",
            background: "rgba(255,255,255,0.05)",
            color: "#e8e6ff", fontSize: "14px", fontWeight: 500,
            cursor: "pointer", display: "flex", alignItems: "center",
            justifyContent: "center", gap: "10px",
            transition: "all 0.2s",
            marginBottom: "20px",
          }}
          onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.08)"}
          onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
        >
          {/* Google SVG icon */}
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
            <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
            <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z"/>
            <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z"/>
          </svg>
          Continue with Google
        </button>

        {/* Divider */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
          <div style={{ flex: 1, height: "1px", background: "rgba(127,119,221,0.15)" }} />
          <span style={{ fontSize: "12px", color: "#4a4870" }}>or sign in with email</span>
          <div style={{ flex: 1, height: "1px", background: "rgba(127,119,221,0.15)" }} />
        </div>

        {/* Error */}
        {error && (
          <div style={{ background: "rgba(216,90,48,0.12)", border: "1px solid rgba(216,90,48,0.3)", borderRadius: "10px", padding: "12px 14px", marginBottom: "16px", fontSize: "13px", color: "#f0a07a" }}>
            ⚠️ {error}
          </div>
        )}

        {/* Success */}
        {success && (
          <div style={{ background: "rgba(29,158,117,0.12)", border: "1px solid rgba(29,158,117,0.35)", borderRadius: "10px", padding: "12px 14px", marginBottom: "16px", fontSize: "13px", color: "#7ee0bc" }}>
            ✓ {success}
          </div>
        )}

        {/* Form */}
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {/* Email */}
          <div>
            <label style={{ fontSize: "12px", color: "#9d9bc4", display: "block", marginBottom: "6px" }}>
              Email address
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="...@gmail.com"
              style={{
                width: "100%", padding: "12px 14px", borderRadius: "10px",
                border: "1px solid rgba(127,119,221,0.2)",
                background: "rgba(255,255,255,0.04)",
                color: "#e8e6ff", fontSize: "14px", outline: "none",
                boxSizing: "border-box",
              }}
              onFocus={e => e.target.style.borderColor = "#7F77DD"}
              onBlur={e => e.target.style.borderColor = "rgba(127,119,221,0.2)"}
            />
          </div>

          {/* Password */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
              <label style={{ fontSize: "12px", color: "#9d9bc4" }}>Password</label>
              <span onClick={() => { setStep("forgot"); setError(""); setSuccess(""); }} style={{ fontSize: "12px", color: "#7F77DD", textDecoration: "none", cursor: "pointer" }}>
                Forgot password?
              </span>
            </div>
            <div style={{ position: "relative" }}>
              <input
                type={showPass ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") handleSubmit(e); }}
                placeholder="••••••••"
                style={{
                  width: "100%", padding: "12px 40px 12px 14px", borderRadius: "10px",
                  border: "1px solid rgba(127,119,221,0.2)",
                  background: "rgba(255,255,255,0.04)",
                  color: "#e8e6ff", fontSize: "14px", outline: "none",
                  boxSizing: "border-box",
                }}
                onFocus={e => e.target.style.borderColor = "#7F77DD"}
                onBlur={e => e.target.style.borderColor = "rgba(127,119,221,0.2)"}
              />
              <button
                onClick={() => setShowPass(!showPass)}
                style={{
                  position: "absolute", right: "12px", top: "50%",
                  transform: "translateY(-50%)", background: "none",
                  border: "none", cursor: "pointer", color: "#6b6990",
                  fontSize: "16px", padding: 0,
                }}
              >
                {showPass ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            style={{
              width: "100%", padding: "13px", borderRadius: "12px",
              border: "none", background: loading ? "#3d3690" : "#534AB7",
              color: "#fff", fontSize: "14px", fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              marginTop: "6px", transition: "background 0.2s",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
            }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.background = "#6158c9" }}
            onMouseLeave={e => { if (!loading) e.currentTarget.style.background = "#534AB7" }}
          >
            {loading ? "Signing in..." : "Sign in →"}
          </button>
        </div>
        </>
        )}

        {/* Sign up link */}
        <p style={{ textAlign: "center", fontSize: "13px", color: "#6b6990", marginTop: "24px" }}>
          Don't have an account?{" "}
          <span
            onClick={() => navigate("/signup")}
            style={{ color: "#7F77DD", cursor: "pointer", fontWeight: 500 }}
          >
            Create one for free
          </span>
        </p>

      </div>
    </div>
  );
}
