import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient.js";
import ThemeToggle from "../components/ThemeToggle.jsx";

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

  const [familyMembers, setFamilyMembers] = useState([]);
  const [newMember, setNewMember] = useState({ name: "", relation: "", dob: "", gender: "" });
  const [addingMember, setAddingMember] = useState(false);

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

      loadFamilyMembers(data.user.id);
      setLoading(false);
    }
    load();
  }, [navigate]);

  async function loadFamilyMembers(id) {
    const { data } = await supabase
      .from("family_members")
      .select("*")
      .eq("patient_id", id)
      .order("created_at", { ascending: true });
    setFamilyMembers(data || []);
  }

  async function handleAddMember(e) {
    e.preventDefault();
    if (!newMember.name.trim()) return;
    setAddingMember(true);
    const { error: memberError } = await supabase.from("family_members").insert({
      patient_id: userId,
      name: newMember.name,
      relation: newMember.relation || null,
      dob: newMember.dob || null,
      gender: newMember.gender || null,
    });
    setAddingMember(false);
    if (memberError) {
      alert("Could not add family member: " + memberError.message);
      return;
    }
    setNewMember({ name: "", relation: "", dob: "", gender: "" });
    loadFamilyMembers(userId);
  }

  async function handleRemoveMember(id) {
    await supabase.from("family_members").delete().eq("id", id);
    loadFamilyMembers(userId);
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError("");

    const { error: profileError } = await supabase
      .from("profiles")
      .upsert({
        id: userId,
        role: "patient",
        name,
        preferred_language: preferredLanguage,
      });

    const { error: patientError } = await supabase
      .from("patients")
      .upsert({
        id: userId,
        abha_id: abhaId || null,
        dob: dob || null,
        gender: gender || null,
        emergency_contact_number: emergencyContact || null,
      });

    setSaving(false);

    if (profileError || patientError) {
      const err = profileError || patientError;
      alert("SAVE FAILED:\n" + JSON.stringify(err, null, 2));
      setError(err.message);
      return;
    }
    alert("SAVE SUCCEEDED for userId: " + userId);
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
        <div className="brand">MediSphere</div>
        <div className="topbar-actions">
          <ThemeToggle />
          <button className="btn-secondary" onClick={() => navigate("/patient/dashboard")}>
            Back to dashboard
          </button>
        </div>
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
            MediSphere.
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

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Family members</h3>
        <p className="helper-text">
          Add family members you look after — you can submit a case on their behalf and
          keep their history separate from your own.
        </p>

        {familyMembers.length === 0 && (
          <p className="helper-text">No family members added yet.</p>
        )}
        {familyMembers.map((m) => (
          <div className="reminder-row" key={m.id}>
            <div style={{ flex: 1 }}>
              <strong>{m.name}</strong>
              {m.relation ? ` — ${m.relation}` : ""}
              {m.dob ? ` — b. ${m.dob}` : ""}
            </div>
            <button className="link-btn" onClick={() => handleRemoveMember(m.id)}>
              Remove
            </button>
          </div>
        ))}

        <form onSubmit={handleAddMember} style={{ marginTop: 16 }}>
          <label>Name</label>
          <input
            type="text"
            value={newMember.name}
            onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
          />
          <label>Relation</label>
          <input
            type="text"
            placeholder="e.g. Mother, Son"
            value={newMember.relation}
            onChange={(e) => setNewMember({ ...newMember, relation: e.target.value })}
          />
          <label>Date of birth</label>
          <input
            type="date"
            value={newMember.dob}
            onChange={(e) => setNewMember({ ...newMember, dob: e.target.value })}
          />
          <label>Gender</label>
          <select
            value={newMember.gender}
            onChange={(e) => setNewMember({ ...newMember, gender: e.target.value })}
          >
            <option value="">Prefer not to say</option>
            <option value="female">Female</option>
            <option value="male">Male</option>
            <option value="other">Other</option>
          </select>
          <button className="btn-primary" type="submit" disabled={addingMember}>
            {addingMember ? "Adding..." : "Add family member"}
          </button>
        </form>
      </div>
    </div>
  );
}
