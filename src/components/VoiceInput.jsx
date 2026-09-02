import React, { useRef, useState } from "react";

// Uses the browser's built-in Web Speech API (Chrome/Edge).
// For production, swap this out for Bhashini's ASR API to support
// more Indian languages reliably.
export default function VoiceInput({ onResult, language = "en-IN" }) {
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);

  function startListening() {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Voice input isn't supported in this browser. Try Chrome or Edge.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = language;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      onResult(transcript);
    };

    recognitionRef.current = recognition;
    recognition.start();
  }

  function stopListening() {
    recognitionRef.current?.stop();
    setListening(false);
  }

  return (
    <button
      type="button"
      className={`btn-mic ${listening ? "active" : ""}`}
      onClick={listening ? stopListening : startListening}
    >
      {listening ? "Listening... tap to stop" : "Tap to speak"}
    </button>
  );
}
