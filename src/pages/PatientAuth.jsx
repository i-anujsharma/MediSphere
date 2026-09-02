import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient.js";

export default function PatientAuth() {
  const navigate = useNavigate();
  const [mode, setMode] = useState("login"); // "login" | "signup"
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (signInError) {
      setError(signInError.message);
      return;
    }
    navigate("/patient/dashboard");
  }

  async function handleSignup(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError) {
      setLoading(false);
      setError(signUpError.message);
      return;
    }

    const userId = data.user?.id;
    if (userId) {
      // Create the shared profile row
      await supabase.from("profiles").insert({
        id: userId,
        role: "patient",
        name,
      });
      // Create the patient-specific row. ABHA ID is linked later from the
      // dashboard, after the ABDM authorization flow -- not at signup.
      await supabase.from("patients").insert({
        id: userId,
      });
    }

    setLoading(false);
    navigate("/patient/dashboard");
  }

  return (
    <div className="shell">
      <div className="brand">MediKiosk</div>
      <div className="subtitle">Patient {mode === "login" ? "login" : "sign up"}</div>

      <div className="card">
        <form onSubmit={mode === "login" ? handleLogin : handleSignup}>
          {mode === "signup" && (
            <>
              <label>Full name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />

            </>
          )}

          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />

          {error && <div className="error-text">{error}</div>}

          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? "Please wait..." : mode === "login" ? "Log in" : "Create account"}
          </button>
        </form>

        <p className="helper-text">
          {mode === "login" ? "New patient? " : "Already have an account? "}
          <button
            className="link-btn"
            onClick={() => setMode(mode === "login" ? "signup" : "login")}
          >
            {mode === "login" ? "Sign up" : "Log in"}
          </button>
        </p>
      </div>
    </div>
  );
}
