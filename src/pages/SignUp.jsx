import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function SignUp() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleGoogle = () => {
    window.location.href = "http://localhost:8080/oauth2/authorization/google";
  };

  const strength = form.password.length === 0 ? 0 : form.password.length < 6 ? 1 : form.password.length < 10 ? 2 : 3;
  const strengthColor = ["transparent", "#ef4444", "#f59e0b", "#22c55e"][strength];
  const strengthLabel = ["", "Weak", "Fair", "Strong"][strength];

  return (
    <div style={{ minHeight: "100vh", background: "#0d0d14", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui, sans-serif", padding: "20px", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: "-100px", right: "-100px", width: "400px", height: "400px", borderRadius: "50%", background: "radial-gradient(circle, rgba(83,74,183,0.15) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ width: "100%", maxWidth: "420px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(127,119,221,0.2)", borderRadius: "24px", padding: "40px", backdropFilter: "blur(20px)", boxShadow: "0 25px 60px rgba(0,0,0,0.4)", position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "32px" }}>
          <div style={{ width: "36px", height: "36px", background: "#534AB7", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}>🧠</div>
          <span style={{ fontSize: "18px", fontWeight: 600, color: "#f0eeff" }}>MindSpace</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "24px" }}>
          {[1,2].map(s => (
            <div key={s} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: step >= s ? "#534AB7" : "rgba(127,119,221,0.15)", border: "1px solid " + (step >= s ? "#534AB7" : "rgba(127,119,221,0.2)"), display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 600, color: step >= s ? "#fff" : "#4a4870" }}>{step > s ? "✓" : s}</div>
              {s < 2 && <div style={{ width: "40px", height: "1px", background: step > 1 ? "#534AB7" : "rgba(127,119,221,0.15)" }} />}
            </div>
          ))}
          <span style={{ fontSize: "12px", color: "#6b6990", marginLeft: "8px" }}>{step === 1 ? "Your details" : "Set password"}</span>
        </div>
        <h1 style={{ fontSize: "26px", fontWeight: 600, color: "#f0eeff", marginBottom: "6px" }}>{step === 1 ? "Create your account" : "Secure your account"}</h1>
        <p style={{ fontSize: "14px", color: "#6b6990", marginBottom: "28px" }}>{step === 1 ? "Free forever for university students" : "Choose a strong password"}</p>
        {step === 1 && (
          <>
            <button onClick={handleGoogle} style={{ width: "100%", padding: "13px", borderRadius: "12px", border: "1px solid rgba(127,119,221,0.25)", background: "rgba(255,255,255,0.05)", color: "#e8e6ff", fontSize: "14px", fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", marginBottom: "20px" }}>
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
                <input name="name" value={form.name} onChange={handleChange} placeholder="Kelvin Kiumbe" style={{ width: "100%", padding: "12px 14px", borderRadius: "10px", border: "1px solid rgba(127,119,221,0.2)", background: "rgba(255,255,255,0.04)", color: "#e8e6ff", fontSize: "14px", outline: "none", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ fontSize: "12px", color: "#9d9bc4", display: "block", marginBottom: "6px" }}>University email</label>
                <input name="email" value={form.email} onChange={handleChange} placeholder="you@university.ac.ke" type="email" style={{ width: "100%", padding: "12px 14px", borderRadius: "10px", border: "1px solid rgba(127,119,221,0.2)", background: "rgba(255,255,255,0.04)", color: "#e8e6ff", fontSize: "14px", outline: "none", boxSizing: "border-box" }} />
              </div>
              <button onClick={() => setStep(2)} style={{ width: "100%", padding: "13px", borderRadius: "12px", border: "none", background: "#534AB7", color: "#fff", fontSize: "14px", fontWeight: 600, cursor: "pointer", marginTop: "6px" }}>Continue →</button>
            </div>
          </>
        )}
        {step === 2 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div>
              <label style={{ fontSize: "12px", color: "#9d9bc4", display: "block", marginBottom: "6px" }}>Password</label>
              <div style={{ position: "relative" }}>
                <input name="password" value={form.password} onChange={handleChange} type={showPass ? "text" : "password"} placeholder="••••••••" style={{ width: "100%", padding: "12px 40px 12px 14px", borderRadius: "10px", border: "1px solid rgba(127,119,221,0.2)", background: "rgba(255,255,255,0.04)", color: "#e8e6ff", fontSize: "14px", outline: "none", boxSizing: "border-box" }} />
                <button onClick={() => setShowPass(!showPass)} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#6b6990", fontSize: "16px", padding: 0 }}>{showPass ? "🙈" : "👁️"}</button>
              </div>
              {form.password.length > 0 && (
                <div style={{ marginTop: "8px" }}>
                  <div style={{ display: "flex", gap: "4px", marginBottom: "4px" }}>
                    {[1,2,3].map(i => (<div key={i} style={{ flex: 1, height: "3px", borderRadius: "2px", background: strength >= i ? strengthColor : "rgba(127,119,221,0.15)" }} />))}
                  </div>
                  <span style={{ fontSize: "11px", color: strengthColor }}>{strengthLabel}</span>
                </div>
              )}
            </div>
            <div>
              <label style={{ fontSize: "12px", color: "#9d9bc4", display: "block", marginBottom: "6px" }}>Confirm password</label>
              <input name="confirm" value={form.confirm} onChange={handleChange} type="password" placeholder="••••••••" style={{ width: "100%", padding: "12px 14px", borderRadius: "10px", border: "1px solid " + (form.confirm && form.confirm !== form.password ? "#ef4444" : "rgba(127,119,221,0.2)"), background: "rgba(255,255,255,0.04)", color: "#e8e6ff", fontSize: "14px", outline: "none", boxSizing: "border-box" }} />
              {form.confirm && form.confirm !== form.password && (<p style={{ fontSize: "11px", color: "#ef4444", marginTop: "4px" }}>Passwords don't match</p>)}
            </div>
            <div style={{ display: "flex", gap: "10px", marginTop: "6px" }}>
              <button onClick={() => setStep(1)} style={{ flex: 1, padding: "13px", borderRadius: "12px", border: "1px solid rgba(127,119,221,0.2)", background: "transparent", color: "#9d9bc4", fontSize: "14px", cursor: "pointer" }}>← Back</button>
              <button style={{ flex: 2, padding: "13px", borderRadius: "12px", border: "none", background: loading ? "#3d3690" : "#534AB7", color: "#fff", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}>{loading ? "Creating account..." : "Create account →"}</button>
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
