import React from "react";

export default function AlarmModal({ reminder, onDismiss }) {
  if (!reminder) return null;

  return (
    <div className="alarm-overlay">
      <div className="alarm-modal">
        <div className="alarm-icon">⏰</div>
        <h3>Time for your medicine</h3>
        <p className="alarm-medicine">
          {reminder.medicine_name}
          {reminder.dosage ? ` — ${reminder.dosage}` : ""}
        </p>
        {reminder.frequency && <p className="helper-text">{reminder.frequency}</p>}
        <button className="btn-primary" onClick={onDismiss}>
          Got it, mark as seen
        </button>
      </div>
    </div>
  );
}
