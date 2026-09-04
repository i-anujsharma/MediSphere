import React from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient.js";
import ThemeToggle from "./ThemeToggle.jsx";

const PATIENT_LINKS = [
  { label: "Dashboard", path: "/patient/dashboard", icon: "home" },
  { label: "Medicine reminders", path: "/patient/dashboard#reminders", icon: "bell" },
  { label: "Case history", path: "/patient/history", icon: "history" },
  { label: "My profile", path: "/patient/profile", icon: "user" },
];

const DOCTOR_LINKS = [
  { label: "Live queue", path: "/doctor/dashboard", icon: "home" },
];

const ICONS = {
  home: "M3 11.5 12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z",
  bell: "M12 3a5 5 0 0 0-5 5v3.2c0 .5-.18.98-.5 1.36L5 14.5h14l-1.5-2c-.32-.38-.5-.85-.5-1.35V8a5 5 0 0 0-5-5zM9.5 18a2.5 2.5 0 0 0 5 0",
  history:
    "M12 8v5l3.5 2M12 4a8 8 0 1 1-6.32 3.1M5 4v4h4",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-7 9a7 7 0 0 1 14 0",
};

function Icon({ name }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d={ICONS[name]} />
    </svg>
  );
}

export default function Sidebar({ open, onClose, role, name, subtitle }) {
  const navigate = useNavigate();
  const links = role === "doctor" ? DOCTOR_LINKS : PATIENT_LINKS;

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate("/");
  }

  function go(path) {
    onClose();
    if (path.includes("#")) {
      const [base, hash] = path.split("#");
      navigate(base);
      setTimeout(() => {
        document.getElementById(hash)?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } else {
      navigate(path);
    }
  }

  return (
    <>
      <div className={`sidebar-overlay ${open ? "show" : ""}`} onClick={onClose} />
      <aside className={`sidebar ${open ? "open" : ""}`}>
        <div className="sidebar-profile">
          <div className="avatar-circle">{(name || "?").charAt(0).toUpperCase()}</div>
          <div>
            <div className="sidebar-name">{name || "Loading..."}</div>
            <div className="sidebar-role">{subtitle}</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {links.map((link) => (
            <button key={link.label} className="sidebar-link" onClick={() => go(link.path)}>
              <Icon name={link.icon} />
              {link.label}
            </button>
          ))}
        </nav>

        <div className="sidebar-theme-row">
          Dark mode
          <ThemeToggle />
        </div>

        <button className="sidebar-link sidebar-logout" onClick={handleLogout}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
          </svg>
          Log out
        </button>
      </aside>
    </>
  );
}
