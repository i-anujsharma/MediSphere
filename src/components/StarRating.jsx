import React from "react";

export default function StarRating({ value = 0, onChange, readOnly = false }) {
  return (
    <div className="star-row">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          className={`star-btn ${n <= value ? "filled" : ""}`}
          disabled={readOnly}
          onClick={() => onChange?.(n)}
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill={n <= value ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.6">
            <path d="M12 2.5l2.9 6.1 6.6.7-4.9 4.5 1.3 6.6L12 17.3l-5.9 3.1 1.3-6.6-4.9-4.5 6.6-.7z" strokeLinejoin="round" />
          </svg>
        </button>
      ))}
    </div>
  );
}
