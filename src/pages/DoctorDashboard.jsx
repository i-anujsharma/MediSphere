import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient.js";
import ConsultationCard from "../components/ConsultationCard.jsx";

export default function DoctorDashboard() {
  const navigate = useNavigate();
  const [doctorId, setDoctorId] = useState(null);
  const [queue, setQueue] = useState([]);
  const [myCases, setMyCases] = useState([]);
  const [selected, setSelected] = useState(null);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    async function init() {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        navigate("/doctor/login");
        return;
      }
      setDoctorId(data.user.id);
      loadQueue();
      loadMyCases(data.user.id);
    }
    init();

    // Refresh the queue periodically so new patients show up without a manual reload.
    const interval = setInterval(() => {
      loadQueue();
    }, 8000);
    return () => clearInterval(interval);
  }, [navigate]);

  async function loadQueue() {
    const { data } = await supabase
      .from("consultations")
      .select("*")
      .eq("status", "waiting")
      .order("red_flag", { ascending: false })
      .order("created_at", { ascending: true });
    setQueue(data || []);
  }

  async function loadMyCases(id) {
    const { data } = await supabase
      .from("consultations")
      .select("*")
      .eq("doctor_id", id)
      .in("status", ["accepted", "in_progress"])
      .order("created_at", { ascending: false });
    setMyCases(data || []);
  }

  // "Accept" locks the case to this doctor so two doctors can't take the
  // same patient at once.
  async function handleAccept(consultation) {
    const { data, error } = await supabase
      .from("consultations")
      .update({
        doctor_id: doctorId,
        status: "accepted",
        accepted_at: new Date().toISOString(),
      })
      .eq("id", consultation.id)
      .eq("status", "waiting") // only succeeds if still unclaimed
      .select()
      .single();

    if (!error && data) {
      loadQueue();
      loadMyCases(doctorId);
      setSelected(data);
      setNotes("");
    } else {
      alert("This case was just taken by another doctor.");
      loadQueue();
    }
  }

  async function handleComplete() {
    if (!selected) return;
    await supabase
      .from("consultations")
      .update({
        status: "completed",
        doctor_notes: notes,
        completed_at: new Date().toISOString(),
      })
      .eq("id", selected.id);

    setSelected(null);
    setNotes("");
    loadMyCases(doctorId);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate("/");
  }

  if (selected) {
    return (
      <div className="shell">
        <div className="top-bar">
          <div className="brand">MediKiosk</div>
          <button className="btn-secondary" onClick={() => setSelected(null)}>
            Back to queue
          </button>
        </div>

        <div className="card">
          <h3 style={{ marginTop: 0 }}>
            {selected.red_flag ? "Urgent case" : "Case summary"}
          </h3>
          {selected.red_flag && (
            <p className="error-text">Red flag reason: {selected.red_flag_reason}</p>
          )}
          <div className="summary-box">{selected.ai_summary}</div>

          <label>Your notes / reply to patient</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} />

          <button className="btn-primary" onClick={handleComplete}>
            Approve &amp; send reply
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="shell">
      <div className="top-bar">
        <div>
          <div className="brand">MediKiosk</div>
          <div className="subtitle" style={{ marginBottom: 0 }}>
            Doctor dashboard
          </div>
        </div>
        <button className="btn-secondary" onClick={handleLogout}>
          Log out
        </button>
      </div>

      {myCases.length > 0 && (
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Your active cases</h3>
          {myCases.map((c) => (
            <ConsultationCard key={c.id} consultation={c} onOpen={setSelected} />
          ))}
        </div>
      )}

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Live queue</h3>
        {queue.length === 0 && <p className="helper-text">No patients waiting right now.</p>}
        {queue.map((c) => (
          <ConsultationCard key={c.id} consultation={c} onOpen={handleAccept} />
        ))}
      </div>
    </div>
  );
}
