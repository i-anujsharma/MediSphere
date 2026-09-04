import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../supabaseClient.js";
import VoiceInput from "../components/VoiceInput.jsx";
import OcrUpload from "../components/OcrUpload.jsx";
import Sidebar from "../components/Sidebar.jsx";
import TopBar from "../components/TopBar.jsx";
import AlarmModal from "../components/AlarmModal.jsx";
import ChatbotWidget from "../components/ChatbotWidget.jsx";
import ToastStack from "../components/ToastStack.jsx";
import { generateSummary } from "../lib/aiSummary.js";
import { useMedicineAlarm } from "../lib/useMedicineAlarm.js";
import { usePatientRealtimeNotifications } from "../lib/useRealtimeNotifications.js";

const QUESTIONS = [
  "What symptoms are you experiencing?",
  "How long have you had these symptoms?",
  "How severe would you say it is (mild / moderate / severe)?",
  "Any other relevant details (allergies, ongoing medication, etc.)?",
];

export default function PatientDashboard() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState(null);
  const [name, setName] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [answers, setAnswers] = useState(QUESTIONS.map(() => ""));
  const [ocrText, setOcrText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(null);
  const [consultations, setConsultations] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [newReminder, setNewReminder] = useState({
    medicine_name: "",
    dosage: "",
    frequency: "",
    reminder_time: "",
  });

  const { dueReminder, dismiss } = useMedicineAlarm(reminders);
  const { toasts, dismissToast } = usePatientRealtimeNotifications(userId, () =>
    loadConsultations(userId)
  );

  useEffect(() => {
    async function init() {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        navigate("/patient/login");
        return;
      }
      setUserId(data.user.id);
      loadConsultations(data.user.id);
      loadReminders(data.user.id);
      loadFamilyMembers(data.user.id);

      const { data: profile } = await supabase
        .from("profiles")
        .select("name")
        .eq("id", data.user.id)
        .single();
      setName(profile?.name || "Patient");
    }
    init();
  }, [navigate]);

  async function loadConsultations(id) {
    const { data } = await supabase
      .from("consultations")
      .select("*")
      .eq("patient_id", id)
      .order("created_at", { ascending: false });
    setConsultations(data || []);
  }

  async function loadFamilyMembers(id) {
    const { data } = await supabase
      .from("family_members")
      .select("id, name, relation")
      .eq("patient_id", id)
      .order("created_at", { ascending: true });
    setFamilyMembers(data || []);
  }

  async function loadReminders(id) {
    const { data } = await supabase
      .from("medicine_reminders")
      .select("*")
      .eq("patient_id", id)
      .eq("active", true)
      .order("created_at", { ascending: false });
    setReminders(data || []);
  }

  function updateAnswer(index, value) {
    const next = [...answers];
    next[index] = value;
    setAnswers(next);
  }

  async function handleSubmit() {
    setSubmitting(true);

    const answerPairs = QUESTIONS.map((q, i) => ({
      question: q,
      answer: answers[i],
    }));

    const { summary, redFlag, reason, severity } = await generateSummary({
      answers: answerPairs,
      ocrText,
    });

    const { data: consultation, error } = await supabase
      .from("consultations")
      .insert({
        patient_id: userId,
        status: "waiting",
        ai_summary: summary,
        red_flag: redFlag,
        red_flag_reason: reason,
        severity,
        for_family_member_id: selectedMember,
      })
      .select()
      .single();

    if (!error && consultation) {
      const rows = answerPairs.map((a) => ({
        consultation_id: consultation.id,
        question: a.question,
        answer: a.answer,
        input_type: "text",
      }));
      await supabase.from("symptom_interview").insert(rows);

      if (ocrText) {
        await supabase.from("documents").insert({
          patient_id: userId,
          consultation_id: consultation.id,
          ocr_extracted_text: ocrText,
        });
      }

      setSubmitted({ summary, redFlag });
      setAnswers(QUESTIONS.map(() => ""));
      setOcrText("");
      setSelectedMember(null);
      loadConsultations(userId);
    }

    setSubmitting(false);
  }

  async function handleAddReminder(e) {
    e.preventDefault();
    if (!newReminder.medicine_name) return;
    await supabase.from("medicine_reminders").insert({
      patient_id: userId,
      ...newReminder,
    });
    setNewReminder({ medicine_name: "", dosage: "", frequency: "", reminder_time: "" });
    loadReminders(userId);
  }

  async function removeReminder(id) {
    await supabase.from("medicine_reminders").update({ active: false }).eq("id", id);
    loadReminders(userId);
  }

  const activeCase = consultations.find((c) => c.status !== "completed");
  const repliesCount = consultations.filter((c) => c.doctor_notes).length;

  return (
    <div className="app-shell">
      <TopBar onMenuClick={() => setSidebarOpen(true)} title="Patient dashboard" notifCount={repliesCount} />
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        role="patient"
        name={name}
        subtitle="Patient account"
      />

      <div className="shell">
        <div className="stat-row">
          <div className="stat-card">
            <div className="stat-value">{consultations.length}</div>
            <div className="stat-label">Cases submitted</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{reminders.length}</div>
            <div className="stat-label">Active reminders</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{activeCase ? activeCase.status : "\u2014"}</div>
            <div className="stat-label">Latest case status</div>
          </div>
        </div>

        {!submitted && (
          <div className="card">
            <h3 style={{ marginTop: 0 }}>Tell us what's going on</h3>

            {familyMembers.length > 0 && (
              <>
                <label style={{ marginTop: 0 }}>Who is this for?</label>
                <div className="chip-row">
                  <button
                    type="button"
                    className={`chip ${selectedMember === null ? "active" : ""}`}
                    onClick={() => setSelectedMember(null)}
                  >
                    Myself
                  </button>
                  {familyMembers.map((m) => (
                    <button
                      type="button"
                      key={m.id}
                      className={`chip ${selectedMember === m.id ? "active" : ""}`}
                      onClick={() => setSelectedMember(m.id)}
                    >
                      {m.name}
                    </button>
                  ))}
                </div>
              </>
            )}

            {QUESTIONS.map((q, i) => (
              <div key={q}>
                <label>{q}</label>
                <textarea
                  value={answers[i]}
                  onChange={(e) => updateAnswer(i, e.target.value)}
                />
                <VoiceInput onResult={(text) => updateAnswer(i, text)} />
              </div>
            ))}

            <label>Upload a prescription or report (optional)</label>
            <OcrUpload onExtracted={(text) => setOcrText(text)} />

            <button className="btn-primary" onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Submitting..." : "Submit to doctor"}
            </button>
          </div>
        )}

        {submitted && (
          <div className="card">
            <h3 style={{ marginTop: 0 }}>
              {submitted.redFlag ? "Marked as urgent" : "Submitted"}
            </h3>
            {submitted.redFlag && (
              <p className="error-text">
                Your case has been flagged as potentially urgent and prioritized for a
                doctor. If your symptoms feel severe, please go to the nearest hospital
                or call 108 immediately.
              </p>
            )}
            <div className="summary-box">{submitted.summary}</div>
            <button className="btn-secondary" onClick={() => setSubmitted(null)} style={{ marginTop: 16 }}>
              Submit another case
            </button>
          </div>
        )}

        <div className="card" id="reminders">
          <h3 style={{ marginTop: 0 }}>Medicine reminders</h3>
          {reminders.length === 0 && <p className="helper-text">No active reminders.</p>}
          {reminders.map((r) => (
            <div className="reminder-row" key={r.id}>
              <div style={{ flex: 1 }}>
                <strong>{r.medicine_name}</strong> — {r.dosage} — {r.frequency}
                {r.reminder_time ? ` at ${r.reminder_time}` : ""}
              </div>
              <button className="link-btn" onClick={() => removeReminder(r.id)}>
                Remove
              </button>
            </div>
          ))}

          <form onSubmit={handleAddReminder} style={{ marginTop: 16 }}>
            <label>Medicine name</label>
            <input
              type="text"
              value={newReminder.medicine_name}
              onChange={(e) =>
                setNewReminder({ ...newReminder, medicine_name: e.target.value })
              }
            />
            <label>Dosage</label>
            <input
              type="text"
              placeholder="e.g. 500mg"
              value={newReminder.dosage}
              onChange={(e) => setNewReminder({ ...newReminder, dosage: e.target.value })}
            />
            <label>Frequency</label>
            <input
              type="text"
              placeholder="e.g. Twice daily"
              value={newReminder.frequency}
              onChange={(e) =>
                setNewReminder({ ...newReminder, frequency: e.target.value })
              }
            />
            <label>Reminder time</label>
            <input
              type="time"
              value={newReminder.reminder_time}
              onChange={(e) =>
                setNewReminder({ ...newReminder, reminder_time: e.target.value })
              }
            />
            <button className="btn-primary" type="submit">
              Add reminder
            </button>
          </form>
        </div>

        <div className="card" id="history">
          <div className="top-bar" style={{ marginBottom: 12 }}>
            <h3 style={{ margin: 0 }}>Recent cases</h3>
            <Link to="/patient/history" className="link-btn">
              View full history
            </Link>
          </div>
          {consultations.length === 0 && (
            <p className="helper-text">No cases submitted yet.</p>
          )}
          {consultations.slice(0, 3).map((c) => (
            <div
              key={c.id}
              className={`queue-item ${
                c.severity === "urgent" ? "flagged" : c.severity === "moderate" ? "moderate" : ""
              }`}
              onClick={() => navigate("/patient/history")}
            >
              <div>
                <span className={`severity-dot ${c.severity || "routine"}`} />
                <span className="badge">{c.status}</span>
                {c.doctor_notes && (
                  <div className="helper-text" style={{ marginTop: 6 }}>
                    Doctor's note: {c.doctor_notes}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <ToastStack toasts={toasts} onDismiss={dismissToast} />
      <AlarmModal reminder={dueReminder} onDismiss={dismiss} />
      <ChatbotWidget />
    </div>
  );
}
