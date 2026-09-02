import React, { useState } from "react";
import { supabase } from "../supabaseClient.js";

// This is a MOCK of the ABDM authorization flow, for prototype/demo purposes.
// Real integration means calling ABDM's actual APIs (send OTP to the number
// linked with the ABHA ID, verify it server-side) -- that requires HFR/HPR
// registration and sandbox approval, which is a separate production step.
// Swap the two functions below (sendMockOtp / verifyMockOtp) for real
// ABDM API calls when that's ready.

export default function AbhaLink({ userId, currentAbhaId, onLinked }) {
  const [step, setStep] = useState(currentAbhaId ? "linked" : "start"); // start -> otp_sent -> linked
  const [abhaId, setAbhaId] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function sendMockOtp() {
    if (abhaId.trim().length < 14) {
      setError("Enter a valid 14-digit ABHA ID.");
      return;
    }
    setError("");
    // In production: call ABDM's "generate OTP" API here.
    setStep("otp_sent");
  }

  async function verifyMockOtp() {
    if (otp.trim().length !== 6) {
      setError("Enter the 6-digit OTP.");
      return;
    }
    setError("");
    setLoading(true);
    // In production: call ABDM's "verify OTP" API here, then only save
    // the ABHA ID if ABDM confirms it.
    const { error: dbError } = await supabase
      .from("patients")
      .update({ abha_id: abhaId })
      .eq("id", userId);
    setLoading(false);

    if (dbError) {
      setError("Couldn't save ABHA ID. Try again.");
      return;
    }
    setStep("linked");
    onLinked?.(abhaId);
  }

  if (step === "linked") {
    return (
      <div className="card">
        <h3 style={{ marginTop: 0 }}>ABHA ID</h3>
        <p className="helper-text">Linked: {currentAbhaId || abhaId}</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>Link your ABHA ID</h3>
      <p className="helper-text">
        Linking your ABHA ID lets your medical history follow you across visits.
      </p>

      {step === "start" && (
        <>
          <label>ABHA ID</label>
          <input
            type="text"
            placeholder="14-digit ABHA number"
            value={abhaId}
            onChange={(e) => setAbhaId(e.target.value)}
          />
          {error && <div className="error-text">{error}</div>}
          <button className="btn-primary" onClick={sendMockOtp}>
            Send OTP
          </button>
        </>
      )}

      {step === "otp_sent" && (
        <>
          <p className="helper-text">
            OTP sent to the mobile number linked with this ABHA ID.
          </p>
          <label>Enter OTP</label>
          <input
            type="text"
            placeholder="6-digit OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
          />
          {error && <div className="error-text">{error}</div>}
          <button className="btn-primary" onClick={verifyMockOtp} disabled={loading}>
            {loading ? "Verifying..." : "Verify & link"}
          </button>
        </>
      )}
    </div>
  );
}
