import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Home, BookOpen, BarChart3, MessageCircle, MessagesSquare, Stethoscope, DoorOpen, Menu, Coffee, Star, X } from "lucide-react";
import { logout } from "../auth";
import AccountDrawer from "./AccountDrawer";
import SupportChat from "./SupportChat";
import AiChat from "./AiChat";
import AddToHomeScreen from "./AddToHomeScreen";
import BuyCoffee from "./BuyCoffee";
import RatingModal from "./RatingModal";
import { useIsMobile } from "../useIsMobile";

const NAV = [
  { label: "Dashboard", icon: Home, path: "/dashboard" },
  { label: "Mood Journal", icon: BookOpen, path: "/mood-journal" },
  { label: "Mood Trends", icon: BarChart3, path: "/mood-trends" },
  { label: "Community Forum", icon: MessageCircle, path: "/community-forum" },
  { label: "Messages", icon: MessagesSquare, path: "/messages" },
  { label: "Find a Therapist", icon: Stethoscope, path: "/find-a-therapist" },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isMobile = useIsMobile();
  const [collapsedState, setCollapsed] = useState(() => localStorage.getItem("mindspace_sidebar") === "collapsed");
  const [mobileOpen, setMobileOpen] = useState(false);

  // On mobile the sidebar is an off-canvas drawer; on desktop it collapses to an icon rail.
  const collapsed = isMobile ? false : collapsedState;

  let userName = "there";
  try {
    const u = JSON.parse(localStorage.getItem("mindspace_user") || "{}");
    if (u.name) userName = u.name.split(" ")[0];
  } catch (e) {}
  const initial = userName.charAt(0).toUpperCase();

  const toggle = () => {
    setCollapsed((c) => {
      const next = !c;
      localStorage.setItem("mindspace_sidebar", next ? "collapsed" : "open");
      return next;
    });
  };

  const go = (path) => { navigate(path); setMobileOpen(false); };

  const width = collapsed ? "76px" : "260px";

  const iconBtn = {
    width: "34px", height: "34px", borderRadius: "10px", flexShrink: 0,
    background: "var(--card-2)", border: "1px solid var(--border)",
    display: "flex", alignItems: "center", justifyContent: "center",
    cursor: "pointer", color: "var(--text-muted)",
  };

  const asideStyle = isMobile
    ? {
        width: "260px", background: "var(--sidebar)", borderRight: "1px solid var(--border)",
        padding: "20px 14px", display: "flex", flexDirection: "column",
        position: "fixed", top: 0, left: 0, height: "100vh", zIndex: 320,
        transform: mobileOpen ? "translateX(0)" : "translateX(-110%)",
        transition: "transform 0.25s ease", overflowY: "auto",
      }
    : {
        width, background: "var(--sidebar)", borderRight: "1px solid var(--border)",
        padding: "20px 14px", display: "flex", flexDirection: "column",
        position: "sticky", top: 0, height: "100vh", overflowX: "hidden", flexShrink: 0,
        transition: "width 0.25s ease",
      };

  return (
    <>
      {/* Mobile: floating hamburger + backdrop */}
      {isMobile && (
        <>
          <button
            onClick={() => setMobileOpen(true)}
            title="Menu"
            style={{
              position: "fixed", top: "12px", left: "12px", zIndex: 300,
              width: "40px", height: "40px", borderRadius: "10px",
              background: "var(--elevated)", border: "1px solid var(--border)",
              display: mobileOpen ? "none" : "flex", alignItems: "center", justifyContent: "center",
              color: "var(--text)", cursor: "pointer", boxShadow: "0 4px 14px rgba(0,0,0,0.25)",
            }}
          >
            <Menu size={20} />
          </button>
          {mobileOpen && (
            <div onClick={() => setMobileOpen(false)}
              style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 310 }} />
          )}
        </>
      )}

      <aside style={asideStyle}>
        {/* Brand + toggle */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: collapsed ? "center" : "space-between", gap: "10px", padding: "0 4px", marginBottom: "24px", minHeight: "34px" }}>
          {!collapsed && (
            <div onClick={() => go("/dashboard")} style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
              <div style={{ width: "34px", height: "34px", background: "#534AB7", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", flexShrink: 0 }}>🧠</div>
              <span style={{ fontSize: "17px", fontWeight: 600, whiteSpace: "nowrap", color: "var(--text)" }}>MindSpace</span>
            </div>
          )}
          {isMobile ? (
            <div onClick={() => setMobileOpen(false)} title="Close" style={iconBtn}><X size={18} /></div>
          ) : (
            <div onClick={toggle} title={collapsed ? "Expand" : "Collapse"} style={iconBtn}><Menu size={18} /></div>
          )}
        </div>

        {/* User card */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: collapsed ? "center" : "flex-start", gap: "10px", padding: collapsed ? "8px 0" : "12px", borderRadius: "12px", background: collapsed ? "transparent" : "rgba(83,74,183,0.15)", marginBottom: "20px" }}>
          <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "#534AB7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", color: "#fff", flexShrink: 0 }}>
            {initial}
          </div>
          {!collapsed && (
            <div style={{ overflow: "hidden" }}>
              <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-strong)", margin: 0, whiteSpace: "nowrap" }}>{userName}</p>
              <p style={{ fontSize: "11px", color: "var(--text-muted-2)", margin: 0 }}>Member</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav style={{ display: "flex", flexDirection: "column", gap: "4px", flex: 1 }}>
          {NAV.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;
            return (
              <div
                key={item.label}
                onClick={() => go(item.path)}
                title={collapsed ? item.label : undefined}
                style={{
                  position: "relative", display: "flex", alignItems: "center",
                  justifyContent: collapsed ? "center" : "flex-start", gap: "12px",
                  padding: "10px 12px", borderRadius: "10px", cursor: "pointer", fontSize: "14px",
                  background: isActive ? "rgba(83,74,183,0.18)" : "transparent",
                  color: isActive ? "var(--accent-soft)" : "var(--text-muted)",
                  fontWeight: isActive ? 600 : 400,
                }}
              >
                {isActive && <span style={{ position: "absolute", left: 0, top: "20%", bottom: "20%", width: "3px", borderRadius: "3px", background: "#534AB7" }} />}
                <Icon size={18} style={{ flexShrink: 0 }} />
                {!collapsed && <span style={{ whiteSpace: "nowrap" }}>{item.label}</span>}
              </div>
            );
          })}
        </nav>

        {/* Buy us a coffee */}
        <div
          onClick={() => { window.dispatchEvent(new CustomEvent("mindspace:open-coffee")); setMobileOpen(false); }}
          title={collapsed ? "Buy us a coffee" : undefined}
          style={{ display: "flex", alignItems: "center", justifyContent: collapsed ? "center" : "flex-start", gap: "12px", padding: "10px 12px", borderRadius: "10px", cursor: "pointer", fontSize: "14px", color: "#c98a4b", background: "rgba(176,122,63,0.12)", border: "1px solid rgba(176,122,63,0.3)", marginBottom: "6px", fontWeight: 600 }}
        >
          <Coffee size={18} style={{ flexShrink: 0 }} />
          {!collapsed && "Buy us a coffee"}
        </div>

        {/* Rate us */}
        <div
          onClick={() => { window.dispatchEvent(new CustomEvent("mindspace:open-rating")); setMobileOpen(false); }}
          title={collapsed ? "Rate MindSpace" : undefined}
          style={{ display: "flex", alignItems: "center", justifyContent: collapsed ? "center" : "flex-start", gap: "12px", padding: "10px 12px", borderRadius: "10px", cursor: "pointer", fontSize: "14px", color: "#d6a90a", background: "rgba(245,179,1,0.10)", border: "1px solid rgba(245,179,1,0.28)", marginBottom: "6px", fontWeight: 600 }}
        >
          <Star size={18} style={{ flexShrink: 0 }} />
          {!collapsed && "Rate MindSpace"}
        </div>

        {/* Logout */}
        <div
          onClick={() => { logout(); navigate("/"); }}
          title={collapsed ? "Logout" : undefined}
          style={{ display: "flex", alignItems: "center", justifyContent: collapsed ? "center" : "flex-start", gap: "12px", padding: "10px 12px", borderRadius: "10px", cursor: "pointer", fontSize: "14px", color: "var(--text-dim)" }}
        >
          <DoorOpen size={18} style={{ flexShrink: 0 }} />
          {!collapsed && "Logout"}
        </div>
      </aside>
      <AccountDrawer />
      <SupportChat />
      <AiChat />
      <AddToHomeScreen />
      <BuyCoffee />
      <RatingModal />
    </>
  );
}
