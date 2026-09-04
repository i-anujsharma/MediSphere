import React from "react";
import ThemeToggle from "./ThemeToggle.jsx";

export default function TopBar({ onMenuClick, title, notifCount = 0 }) {
  return (
    <div className="app-topbar">
      <button className="hamburger-btn" onClick={onMenuClick} aria-label="Open menu">
        <span />
        <span />
        <span />
      </button>
      <div className="app-topbar-title">
        <div className="brand">MediSphere</div>
        {title && <div className="topbar-subtitle">{title}</div>}
      </div>
      <div className="topbar-actions">
        <ThemeToggle />
        <div className="notif-bell">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3a5 5 0 0 0-5 5v3.2c0 .5-.18.98-.5 1.36L5 14.5h14l-1.5-2c-.32-.38-.5-.85-.5-1.35V8a5 5 0 0 0-5-5zM9.5 18a2.5 2.5 0 0 0 5 0" />
          </svg>
          {notifCount > 0 && <span className="notif-badge">{notifCount}</span>}
        </div>
      </div>
    </div>
  );
}
