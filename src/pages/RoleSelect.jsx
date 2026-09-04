import React from "react";
import { useNavigate } from "react-router-dom";
import ThemeToggle from "../components/ThemeToggle.jsx";

export default function RoleSelect() {
  const navigate = useNavigate();

  return (
    <div className="shell">
      <div className="top-bar" style={{ marginBottom: 0 }}>
        <div>
          <div className="brand">MediSphere</div>
          <div className="subtitle" style={{ marginBottom: 0 }}>
            AI-powered patient case-taking platform
          </div>
        </div>
        <ThemeToggle />
      </div>
      <div style={{ height: 24 }} />

      <div className="role-grid">
        <button className="role-btn" onClick={() => navigate("/patient/login")}>
          <strong>Login as Patient</strong>
          Share your symptoms and get a doctor to review your case.
        </button>
        <button className="role-btn" onClick={() => navigate("/doctor/login")}>
          <strong>Login as Doctor</strong>
          View the live patient queue and respond to cases.
        </button>
      </div>
    </div>
  );
}
