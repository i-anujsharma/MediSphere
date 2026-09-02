import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient.js";

export default function PatientProfile() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [abhaId, setAbhaId] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [preferredLanguage, setPreferredLanguage] = useState("en");

  useEffect(() => {
    async function load() {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        navigate("/patient/login");
        return;
      }
      setUserId(data.user.id);

      const { data: profile } = await supabase
        .from("profiles")
        .select("name, preferred_language")
        .eq("id", data.user.id)
        .single();

      const { data: patient } = await supabase
        .from("patients")
        .select("abha_id, dob, gender, emergency_contact_number")
        .eq("id", data.user.id)
        .single();

      if (profile) {
        setName(profile.name || "");
        setPreferredLanguage(profile.preferred_language || "en");
      }
      if (patient) {
        setAbhaId(patient.abha_id || "");
        setDob(patient.dob || "");
        setGender(patient.gender || "");
        setEmergencyContact(patient.emergency_contact_number || "");
      }
      setLoading(false);
    }
    load();
  }, [navigate]);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError("");

    const { error: profileError } = await supabase
      .from("profiles")
      .update({ name, preferred_language: preferredLanguage })
      .eq("id", userId);

    const { error: patientError } = await supabase
      .from("patients")
      .update({
        abha_id: abhaId || null,
        dob: dob || null,
        gender: gender || null,
        emergency_contact_number: emergencyContact || null,
      })
      .eq("id", userId);

    setSaving(false);

    if (profileError || patientError) {
      setError((profileError || patientError).message);
      return;
    }
    setSaved(true);
  }

  if (loading) {
    return (
      <div className="shell">
        <p className="helper-text">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="shell">
      <div className="top-bar">
        <div className="brand">MediKiosk</div>
        <button className="btn-secondary" onClick={() => navigate("/patient/dashboard")}>
          Back to dashboard
        </button>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>My profile</h3>
        <p className="helper-text">
          Link your ABHA ID here once you've completed ABDM authorization. This lets
          your medical history sync across visits.
        </p>

        <form onSubmit={handleSave}>
          <label>Full name</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} />

          <label>ABHA ID</label>
          <input
            type="text"
            placeholder="14-digit ABHA number"
            value={abhaId}
            onChange={(e) => setAbhaId(e.target.value)}
          />
          <p className="helper-text">
            Don't have one linked yet? You can add it later — it isn't required to use
            MediKiosk.
          </p>

          <label>Date of birth</label>
          <input
            type="text"
            placeholder="YYYY-MM-DD"
            value={dob}
            onChange={(e) => setDob(e.target.value)}
          />

          <label>Gender</label>
          <select value={gender} onChange={(e) => setGender(e.target.value)}>
            <option value="">Prefer not to say</option>
            <option value="female">Female</option>
            <option value="male">Male</option>
            <option value="other">Other</option>
          </select>

          <label>Emergency contact number</label>
          <input
            type="text"
            value={emergencyContact}
            onChange={(e) => setEmergencyContact(e.target.value)}
          />

          <label>Preferred language</label>
          <select
            value={preferredLanguage}
            onChange={(e) => setPreferredLanguage(e.target.value)}
          >
            <option value="en">English</option>
            <option value="hi">Hindi</option>
            <option value="mr">Marathi</option>
            <option value="ta">Tamil</option>
            <option value="te">Telugu</option>
            <option value="bn">Bengali</option>
          </select>

          {error && <div className="error-text">{error}</div>}
          {saved && <p className="helper-text">Profile saved.</p>}

          <button className="btn-primary" type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save profile"}
          </button>
        </form>
      </div>
    </div>
  );
}
