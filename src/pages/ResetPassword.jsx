import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient.js";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    // Supabase automatically parses the recovery token from the URL and
    // creates a temporary session -- we just need to wait for that to be ready.
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setReady(true);
      }
    });

    // Fallback in case the event already fired before this component mounted.
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }
    setDone(true);
  }

  return (
    <div className="shell">
      <div className="brand">MediSphere</div>
      <div className="subtitle">Reset your password</div>

      <div className="card">
        {done ? (
          <>
            <p className="helper-text">Your password has been updated.</p>
            <button className="btn-primary" onClick={() => navigate("/")}>
              Go to login
            </button>
          </>
        ) : !ready ? (
          <p className="helper-text">
            Verifying your reset link... if this doesn't update in a few seconds,
            the link may have expired -- request a new one from the login page.
          </p>
        ) : (
          <form onSubmit={handleSubmit}>
            <label>New password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
            <label>Confirm new password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
            />
            {error && <div className="error-text">{error}</div>}
            <button className="btn-primary" type="submit" disabled={loading}>
              {loading ? "Updating..." : "Update password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
