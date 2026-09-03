import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient.js";

export default function DoctorAuth() {
  const navigate = useNavigate();
  const [mode, setMode] = useState("login"); // "login" | "signup" | "forgot"
  const [name, setName] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

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
    navigate("/doctor/dashboard");
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
      await supabase.from("profiles").insert({
        id: userId,
        role: "doctor",
        name,
      });
      await supabase.from("doctors").insert({
        id: userId,
        specialization,
        availability_status: "online",
      });
    }

    setLoading(false);
    navigate("/doctor/dashboard");
  }

  async function handleForgotPassword(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (resetError) {
      setError(resetError.message);
      return;
    }
    setResetSent(true);
  }

  return (
    <div className="shell">
      <div className="brand">MediSphere</div>
      <div className="subtitle">
        Doctor {mode === "login" ? "login" : mode === "signup" ? "sign up" : "password reset"}
      </div>

      <div className="card">
        {mode === "forgot" ? (
          resetSent ? (
            <>
              <p className="helper-text">
                If an account exists for {email}, a password reset link has been sent.
                Check your inbox (and spam folder).
              </p>
              <button className="link-btn" onClick={() => { setMode("login"); setResetSent(false); }}>
                Back to login
              </button>
            </>
          ) : (
            <form onSubmit={handleForgotPassword}>
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              {error && <div className="error-text">{error}</div>}
              <button className="btn-primary" type="submit" disabled={loading}>
                {loading ? "Sending..." : "Send reset link"}
              </button>
              <p className="helper-text">
                <button type="button" className="link-btn" onClick={() => setMode("login")}>
                  Back to login
                </button>
              </p>
            </form>
          )
        ) : (
          <>
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

                  <label>Specialization</label>
                  <input
                    type="text"
                    placeholder="e.g. General Medicine"
                    value={specialization}
                    onChange={(e) => setSpecialization(e.target.value)}
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

            {mode === "login" && (
              <p className="helper-text">
                <button className="link-btn" onClick={() => setMode("forgot")}>
                  Forgot password?
                </button>
              </p>
            )}

            <p className="helper-text">
              {mode === "login" ? "New doctor? " : "Already have an account? "}
              <button
                className="link-btn"
                onClick={() => setMode(mode === "login" ? "signup" : "login")}
              >
                {mode === "login" ? "Sign up" : "Log in"}
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
