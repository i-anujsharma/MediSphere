import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient.js";
import Sidebar from "../components/Sidebar.jsx";
import TopBar from "../components/TopBar.jsx";
import StarRating from "../components/StarRating.jsx";
import { downloadConsultationPdf } from "../lib/pdfExport.js";

export default function PatientHistory() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState(null);
  const [name, setName] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [consultations, setConsultations] = useState([]);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    async function init() {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        navigate("/patient/login");
        return;
      }
      setUserId(data.user.id);

      const { data: profile } = await supabase
        .from("profiles")
        .select("name")
        .eq("id", data.user.id)
        .single();
      setName(profile?.name || "Patient");

      const { data: members } = await supabase
        .from("family_members")
        .select("id, name")
        .eq("patient_id", data.user.id);
      setFamilyMembers(members || []);

      const { data: rows } = await supabase
        .from("consultations")
        .select("*")
        .eq("patient_id", data.user.id)
        .order("created_at", { ascending: false });
      setConsultations(rows || []);
      setLoading(false);
    }
    init();
  }, [navigate]);

  async function submitRating(consultationId, rating) {
    setConsultations((prev) =>
      prev.map((c) => (c.id === consultationId ? { ...c, rating } : c))
    );
    await supabase.from("consultations").update({ rating }).eq("id", consultationId);
  }

  function memberName(id) {
    return familyMembers.find((m) => m.id === id)?.name;
  }

  const filtered =
    filter === "all" ? consultations : consultations.filter((c) => c.status === filter);

  return (
    <div className="app-shell">
      <TopBar onMenuClick={() => setSidebarOpen(true)} title="Case history" />
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        role="patient"
        name={name}
        subtitle="Patient account"
      />

      <div className="shell">
        <h2 style={{ marginTop: 0, marginBottom: 4 }}>Case history</h2>
        <p className="helper-text" style={{ marginBottom: 20 }}>
          Every case you've submitted, in one timeline.
        </p>

        <div className="chip-row" style={{ marginBottom: 20 }}>
          {["all", "waiting", "accepted", "completed"].map((f) => (
            <button
              key={f}
              className={`chip ${filter === f ? "active" : ""}`}
              onClick={() => setFilter(f)}
            >
              {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {loading && <p className="helper-text">Loading history...</p>}

        {!loading && filtered.length === 0 && (
          <div className="card">
            <p className="helper-text" style={{ margin: 0 }}>
              No cases here yet. Submit a case from the dashboard to see it show up here.
            </p>
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <div className="card">
            <div className="timeline">
              {filtered.map((c) => (
                <div className="timeline-item" key={c.id}>
                  <div className="timeline-date">
                    {new Date(c.created_at).toLocaleString()}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: 6 }}>
                    <span className="badge">{c.status}</span>
                    {c.severity && c.severity !== "routine" && (
                      <span className={`badge ${c.severity === "urgent" ? "flag" : "warning"}`}>
                        {c.severity}
                      </span>
                    )}
                    {c.for_family_member_id && (
                      <span className="badge outline">for {memberName(c.for_family_member_id) || "family member"}</span>
                    )}
                  </div>

                  <div className="summary-box">{c.ai_summary}</div>

                  {c.doctor_notes && (
                    <div className="helper-text" style={{ marginTop: 8 }}>
                      <strong>Doctor's note:</strong> {c.doctor_notes}
                    </div>
                  )}

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginTop: 12 }}>
                    {c.status === "completed" ? (
                      <div>
                        <div className="helper-text" style={{ marginTop: 0 }}>
                          Rate this consultation
                        </div>
                        <StarRating
                          value={c.rating || 0}
                          onChange={(r) => submitRating(c.id, r)}
                        />
                      </div>
                    ) : (
                      <div />
                    )}
                    <button
                      className="btn-secondary"
                      onClick={() =>
                        downloadConsultationPdf(c, {
                          patientName: name,
                          familyMemberName: memberName(c.for_family_member_id),
                        })
                      }
                    >
                      Download PDF
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
