import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient.js";
import ConsultationCard from "../components/ConsultationCard.jsx";
import Sidebar from "../components/Sidebar.jsx";
import TopBar from "../components/TopBar.jsx";

export default function DoctorDashboard() {
  const navigate = useNavigate();
  const [doctorId, setDoctorId] = useState(null);
  const [name, setName] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
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

      const { data: profile } = await supabase
        .from("profiles")
        .select("name")
        .eq("id", data.user.id)
        .single();
      setName(profile?.name || "Doctor");
    }
    init();

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

  async function handleAccept(consultation) {
    const { data, error } = await supabase
      .from("consultations")
      .update({
        doctor_id: doctorId,
        status: "accepted",
        accepted_at: new Date().toISOString(),
      })
      .eq("id", consultation.id)
      .eq("status", "waiting")
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

  const urgentCount = queue.filter((c) => c.red_flag).length;

  if (selected) {
    return (
      <div className="app-shell">
        <TopBar onMenuClick={() => setSidebarOpen(true)} title="Case review" />
        <Sidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          role="doctor"
          name={name}
          subtitle="Doctor account"
        />
        <div className="shell">
          <div className="card">
            <div className="top-bar" style={{ marginBottom: 8 }}>
              <h3 style={{ margin: 0 }}>
                {selected.red_flag ? "Urgent case" : "Case summary"}
              </h3>
              <button className="btn-secondary" onClick={() => setSelected(null)}>
                Back to queue
              </button>
            </div>
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
      </div>
    );
  }

  return (
    <div className="app-shell">
      <TopBar onMenuClick={() => setSidebarOpen(true)} title="Doctor dashboard" notifCount={urgentCount} />
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        role="doctor"
        name={name}
        subtitle="Doctor account"
      />

      <div className="shell">
        <div className="stat-row">
          <div className="stat-card">
            <div className="stat-value">{queue.length}</div>
            <div className="stat-label">Patients waiting</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: urgentCount > 0 ? "var(--coral)" : undefined }}>
              {urgentCount}
            </div>
            <div className="stat-label">Urgent cases</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{myCases.length}</div>
            <div className="stat-label">Your active cases</div>
          </div>
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
    </div>
  );
}
