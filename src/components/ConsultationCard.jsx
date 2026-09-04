import React from "react";

export default function ConsultationCard({ consultation, onOpen, familyMemberName }) {
  const severity = consultation.severity || (consultation.red_flag ? "urgent" : "routine");
  const rowClass =
    severity === "urgent" ? "flagged" : severity === "moderate" ? "moderate" : "";

  return (
    <div
      className={`queue-item ${rowClass}`}
      onClick={() => onOpen(consultation)}
      style={{ cursor: "pointer" }}
    >
      <div>
        <span className={`severity-dot ${severity}`} />
        {severity === "urgent" && <span className="badge flag">Urgent</span>}{" "}
        {severity === "moderate" && <span className="badge warning">Priority</span>}{" "}
        <span className="badge">{consultation.status}</span>{" "}
        {familyMemberName && <span className="badge outline">for {familyMemberName}</span>}
        <div className="helper-text" style={{ marginTop: 6 }}>
          {consultation.ai_summary?.slice(0, 90)}...
        </div>
      </div>
      <button className="btn-secondary">Open</button>
    </div>
  );
}
