import React, { useState } from "react";
import Tesseract from "tesseract.js";

// Runs OCR entirely in the browser using Tesseract.js.
// For messier handwriting/production accuracy, swap this for a
// cloud OCR + medical NLP pipeline later.
export default function OcrUpload({ onExtracted }) {
  const [progress, setProgress] = useState(0);
  const [running, setRunning] = useState(false);
  const [extractedText, setExtractedText] = useState("");

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setRunning(true);
    setProgress(0);
    setExtractedText("");

    const result = await Tesseract.recognize(file, "eng", {
      logger: (m) => {
        if (m.status === "recognizing text") {
          setProgress(Math.round(m.progress * 100));
        }
      },
    });

    const text = result.data.text.trim();
    setExtractedText(text);
    setRunning(false);
    onExtracted(text, file);
  }

  return (
    <div>
      <input type="file" accept="image/*" onChange={handleFile} />
      {running && <p className="helper-text">Scanning document... {progress}%</p>}
      {extractedText && (
        <div className="summary-box" style={{ marginTop: 10 }}>
          {extractedText}
        </div>
      )}
    </div>
  );
}
