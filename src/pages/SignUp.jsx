import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function SignUp() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [success, setSuccess] = useState("");
  const [code, setCode] = useState("");
  const [resending, setResending] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
    setServerError("");
  };

  const handleGoogle = () => {
    window.location.href = "http://localhost:8080/oauth2/authorization/google";
  };

  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const getPasswordChecks = (pw) => ({
    length: pw.length >= 8,
    upper: /[A-Z]/.test(pw),
    lower: /[a-z]/.test(pw),
    number: /[0-9]/.test(pw),
    special: /[!@#$%^&*(),.?":{}|<>_\-+=\[\];'`~\\/]/.test(pw),
  });

  const passwordChecks = getPasswordChecks(form.password);
  const isPasswordValid = Object.values(passwordChecks).every(Boolean);

  const validateStep1 = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = "Full name is required";
    if (!form.email.trim()) newErrors.email = "Email is required";
    else if (!isValidEmail(form.email)) newErrors.email = "Enter a valid email address";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors = {};
    if (!isPasswordValid) newErrors.password = "Password doesn't meet all requirements";
    if (form.confirm !== form.password) newErrors.confirm = "Passwords don't match";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = () => {
    if (validateStep1()) setStep(2);
  };

  const handleSubmit = async () => {
    if (!validateStep2()) return;
    setLoading(true);
    setServerError("");
    try {
      const response = await fetch("http://localhost:8080/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: form.name, email: form.email, password: form.password }),
      });
      const data = await response.json();
      if (response.ok) {
        // Details OK — a verification code was emailed. Move to the OTP step.
        setStep(3);
        setSuccess(data.message || `We sent a 6-digit code to ${form.email}.`);
      } else {
        const msg = data.error || (data && typeof data === "object" ? Object.values(data)[0] : null);
        setServerError(msg || "Registration failed. Please try again.");
      }
    } catch (err) {
      setServerError("Could not connect to server. Make sure the backend is running on port 8080.");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (loading) return;
    if (code.trim().length !== 6) {
      setServerError("Enter the 6-digit code from your email.");
      return;
    }
    setLoading(true);
    setServerError("");
    try {
      const response = await fetch("http://localhost:8080/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, code: code.trim(), purpose: "REGISTER", trustDevice: true }),
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok) {
        localStorage.setItem("mindspace_user", JSON.stringify({ name: form.name, email: form.email }));
        if (data.token) localStorage.setItem("mindspace_token", data.token);
        if (data.deviceToken) localStorage.setItem("mindspace_device_token", data.deviceToken);
        setSuccess("Account verified! Taking you to your dashboard…");
        setTimeout(() => navigate("/dashboard"), 1100);
      } else {
        setServerError(data.error || "Verification failed. Please try again.");
      }
    } catch (err) {
      setServerError("Could not connect to server. Make sure the backend is running on port 8080.");
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    if (resending) return;
    setResending(true);
    setServerError("");
    try {
      const response = await fetch("http://localhost:8080/api/auth/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, purpose: "REGISTER" }),
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok) setSuccess(data.message || "A new code is on its way.");
      else setServerError(data.error || "Couldn't resend the code.");
    } catch (err) {
      setServerError("Could not connect to server.");
    } finally {
      setResending(false);
    }
  };

  const strength = Object.values(passwordChecks).filter(Boolean).length;
  const strengthColor = ["transparent", "#ef4444", "#ef4444", "#f59e0b", "#f59e0b", "#22c55e"][strength];
  const strengthLabel = ["", "Very weak", "Weak", "Fair", "Good", "Strong"][strength];

  return (
    <div style={{ minHeight: "100vh", background: "#0d0d14", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui, sans-serif", padding: "20px", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: "-100px", right: "-100px", width: "400px", height: "400px", borderRadius: "50%", background: "radial-gradient(circle, rgba(83,74,183,0.15) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ width: "100%", maxWidth: "440px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(127,119,221,0.2)", borderRadius: "24px", padding: "40px", backdropFilter: "blur(20px)", boxShadow: "0 25px 60px rgba(0,0,0,0.4)", position: "relative", zIndex: 1 }}>

        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "32px" }}>
          <div style={{ width: "36px", height: "36px", background: "#534AB7", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}>🧠</div>
          <span style={{ fontSize: "18px", fontWeight: 600, color: "#f0eeff" }}>MindSpace</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "24px" }}>
          {[1, 2, 3].map(s => (
            <div key={s} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{
                width: "28px", height: "28px", borderRadius: "50%",
                background: step >= s ? "#534AB7" : "rgba(127,119,221,0.15)",
                border: `1px solid ${step >= s ? "#534AB7" : "rgba(127,119,221,0.2)"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "12px", fontWeight: 600, color: step >= s ? "#fff" : "#4a4870",
              }}>{step > s ? "✓" : s}</div>
              {s < 3 && <div style={{ width: "28px", height: "1px", background: step > s ? "#534AB7" : "rgba(127,119,221,0.15)" }} />}
            </div>
          ))}
          <span style={{ fontSize: "12px", color: "#6b6990", marginLeft: "8px" }}>{step === 1 ? "Your details" : step === 2 ? "Set password" : "Verify email"}</span>
        </div>

        <h1 style={{ fontSize: "26px", fontWeight: 600, color: "#f0eeff", marginBottom: "6px" }}>
          {step === 1 ? "Create your account" : step === 2 ? "Secure your account" : "Verify your email"}
        </h1>
        <p style={{ fontSize: "14px", color: "#6b6990", marginBottom: "24px" }}>
          {step === 1 ? "Free forever, for everyone" : step === 2 ? "Choose a strong password" : `Enter the 6-digit code we sent to ${form.email}`}
        </p>

        {serverError && (
          <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "10px", padding: "12px", fontSize: "13px", color: "#fca5a5", marginBottom: "16px" }}>
            ⚠️ {serverError}
          </div>
        )}

        {success && (
          <div style={{ background: "rgba(29,158,117,0.12)", border: "1px solid rgba(29,158,117,0.35)", borderRadius: "10px", padding: "12px", fontSize: "13px", color: "#7ee0bc", marginBottom: "16px" }}>
            ✓ {success}
          </div>
        )}

        {step === 1 && (
          <>
            <button onClick={handleGoogle} type="button" style={{ width: "100%", padding: "13px", borderRadius: "12px", border: "1px solid rgba(127,119,221,0.25)", background: "rgba(255,255,255,0.05)", color: "#e8e6ff", fontSize: "14px", fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", marginBottom: "20px" }}>
              <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/><path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/><path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z"/><path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z"/></svg>
              Sign up with Google
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
              <div style={{ flex: 1, height: "1px", background: "rgba(127,119,221,0.15)" }} />
              <span style={{ fontSize: "12px", color: "#4a4870" }}>or with email</span>
              <div style={{ flex: 1, height: "1px", background: "rgba(127,119,221,0.15)" }} />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ fontSize: "12px", color: "#9d9bc4", display: "block", marginBottom: "6px" }}>Full name</label>
                <input
                  name="name" value={form.name} onChange={handleChange} placeholder="Kelvin Kiumbe"
                  style={{ width: "100%", padding: "12px 14px", borderRadius: "10px", border: `1px solid ${errors.name ? "#ef4444" : "rgba(127,119,221,0.2)"}`, background: "rgba(255,255,255,0.04)", color: "#e8e6ff", fontSize: "14px", outline: "none", boxSizing: "border-box" }}
                />
                {errors.name && <p style={{ fontSize: "11px", color: "#ef4444", marginTop: "4px" }}>{errors.name}</p>}
              </div>
              <div>
                <label style={{ fontSize: "12px", color: "#9d9bc4", display: "block", marginBottom: "6px" }}>Email address</label>
                <input
                  name="email" value={form.email} onChange={handleChange} placeholder="you@university.ac.ke" type="email"
                  style={{ width: "100%", padding: "12px 14px", borderRadius: "10px", border: `1px solid ${errors.email ? "#ef4444" : "rgba(127,119,221,0.2)"}`, background: "rgba(255,255,255,0.04)", color: "#e8e6ff", fontSize: "14px", outline: "none", boxSizing: "border-box" }}
                />
                {errors.email && <p style={{ fontSize: "11px", color: "#ef4444", marginTop: "4px" }}>{errors.email}</p>}
              </div>
              <button onClick={handleContinue} type="button" style={{ width: "100%", padding: "13px", borderRadius: "12px", border: "none", background: "#534AB7", color: "#fff", fontSize: "14px", fontWeight: 600, cursor: "pointer", marginTop: "6px" }}>
                Continue →
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div>
              <label style={{ fontSize: "12px", color: "#9d9bc4", display: "block", marginBottom: "6px" }}>Password</label>
              <div style={{ position: "relative" }}>
                <input
                  name="password" value={form.password} onChange={handleChange}
                  type={showPass ? "text" : "password"} placeholder="••••••••"
                  style={{ width: "100%", padding: "12px 40px 12px 14px", borderRadius: "10px", border: `1px solid ${errors.password ? "#ef4444" : "rgba(127,119,221,0.2)"}`, background: "rgba(255,255,255,0.04)", color: "#e8e6ff", fontSize: "14px", outline: "none", boxSizing: "border-box" }}
                />
                <button onClick={() => setShowPass(!showPass)} type="button" style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#6b6990", fontSize: "16px", padding: 0 }}>
                  {showPass ? "🙈" : "👁️"}
                </button>
              </div>

              {form.password.length > 0 && (
                <div style={{ marginTop: "10px" }}>
                  <div style={{ display: "flex", gap: "4px", marginBottom: "8px" }}>
                    {[1, 2, 3, 4, 5].map(i => (
                      <div key={i} style={{ flex: 1, height: "3px", borderRadius: "2px", background: strength >= i ? strengthColor : "rgba(127,119,221,0.15)" }} />
                    ))}
                  </div>
                  <p style={{ fontSize: "11px", color: strengthColor, marginBottom: "8px" }}>{strengthLabel}</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    {[
                      { key: "length", label: "At least 8 characters" },
                      { key: "upper", label: "One uppercase letter (A-Z)" },
                      { key: "lower", label: "One lowercase letter (a-z)" },
                      { key: "number", label: "One number (0-9)" },
                      { key: "special", label: "One special character (!@#$%^&* etc.)" },
                    ].map(req => (
                      <div key={req.key} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: passwordChecks[req.key] ? "#7ee0bc" : "#6b6990" }}>
                        <span>{passwordChecks[req.key] ? "✓" : "○"}</span> {req.label}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {errors.password && <p style={{ fontSize: "11px", color: "#ef4444", marginTop: "6px" }}>{errors.password}</p>}
            </div>

            <div>
              <label style={{ fontSize: "12px", color: "#9d9bc4", display: "block", marginBottom: "6px" }}>Confirm password</label>
              <input
                name="confirm" value={form.confirm} onChange={handleChange} type="password" placeholder="••••••••"
                style={{ width: "100%", padding: "12px 14px", borderRadius: "10px", border: `1px solid ${errors.confirm ? "#ef4444" : "rgba(127,119,221,0.2)"}`, background: "rgba(255,255,255,0.04)", color: "#e8e6ff", fontSize: "14px", outline: "none", boxSizing: "border-box" }}
              />
              {errors.confirm && <p style={{ fontSize: "11px", color: "#ef4444", marginTop: "4px" }}>{errors.confirm}</p>}
            </div>

            <div style={{ display: "flex", gap: "10px", marginTop: "6px" }}>
              <button onClick={() => setStep(1)} type="button" style={{ flex: 1, padding: "13px", borderRadius: "12px", border: "1px solid rgba(127,119,221,0.2)", background: "transparent", color: "#9d9bc4", fontSize: "14px", cursor: "pointer" }}>
                ← Back
              </button>
              <button onClick={handleSubmit} disabled={loading} type="button" style={{ flex: 2, padding: "13px", borderRadius: "12px", border: "none", background: loading ? "#3d3690" : "#534AB7", color: "#fff", fontSize: "14px", fontWeight: 600, cursor: loading ? "not-allowed" : "pointer" }}>
                {loading ? "Sending code..." : "Send verification code →"}
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <input
              inputMode="numeric"
              autoFocus
              maxLength={6}
              value={code}
              onChange={(e) => { setCode(e.target.value.replace(/\D/g, "")); setServerError(""); }}
              onKeyDown={(e) => { if (e.key === "Enter") verifyOtp(); }}
              placeholder="______"
              style={{ width: "100%", padding: "14px", borderRadius: "12px", border: "1px solid rgba(127,119,221,0.25)", background: "rgba(255,255,255,0.04)", color: "#f0eeff", fontSize: "26px", letterSpacing: "12px", textAlign: "center", outline: "none", boxSizing: "border-box", fontFamily: "monospace" }}
            />
            <button onClick={verifyOtp} disabled={loading} type="button" style={{ width: "100%", padding: "13px", borderRadius: "12px", border: "none", background: loading ? "#3d3690" : "#534AB7", color: "#fff", fontSize: "14px", fontWeight: 600, cursor: loading ? "not-allowed" : "pointer" }}>
              {loading ? "Verifying…" : "Verify & create account →"}
            </button>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
              <span onClick={() => { setStep(2); setCode(""); setServerError(""); setSuccess(""); }} style={{ color: "#9d9bc4", cursor: "pointer" }}>← Back</span>
              <span onClick={resendOtp} style={{ color: "#7F77DD", cursor: resending ? "default" : "pointer", fontWeight: 500 }}>{resending ? "Sending…" : "Resend code"}</span>
            </div>
          </div>
        )}

        <p style={{ textAlign: "center", fontSize: "13px", color: "#6b6990", marginTop: "24px" }}>
          Already have an account?{" "}
          <span onClick={() => navigate("/signin")} style={{ color: "#7F77DD", cursor: "pointer", fontWeight: 500 }}>Sign in</span>
        </p>
      </div>
    </div>
  );
}
