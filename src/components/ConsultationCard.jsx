import React from "react";

export default function ConsultationCard({ consultation, onOpen }) {
  return (
    <div
      className={`queue-item ${consultation.red_flag ? "flagged" : ""}`}
      onClick={() => onOpen(consultation)}
      style={{ cursor: "pointer" }}
    >
      <div>
        {consultation.red_flag && <span className="badge flag">Urgent</span>}{" "}
        <span className="badge">{consultation.status}</span>
        <div className="helper-text" style={{ marginTop: 6 }}>
          {consultation.ai_summary?.slice(0, 90)}...
        </div>
      </div>
      <button className="btn-secondary">Open</button>
    </div>
  );
}
