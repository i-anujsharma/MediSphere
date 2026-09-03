import React, { useEffect, useRef, useState } from "react";
import { sendChatMessage } from "../lib/chatbot.js";

export default function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: "Hi! I'm here for general health questions or just to chat. For an actual case review, use the form above and a doctor will get back to you.",
    },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  async function handleSend(e) {
    e.preventDefault();
    if (!input.trim() || sending) return;

    const userMsg = { sender: "user", text: input };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput("");
    setSending(true);

    const reply = await sendChatMessage(messages, userMsg.text);
    setMessages([...nextMessages, { sender: "bot", text: reply }]);
    setSending(false);
  }

  return (
    <>
      <button className="chatbot-fab" onClick={() => setOpen(!open)} aria-label="Open chatbot">
        {open ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /></svg>
        )}
      </button>

      {open && (
        <div className="chatbot-panel">
          <div className="chatbot-header">
            <strong>MediSphere Assistant</strong>
            <span className="helper-text">General questions only, not a diagnosis</span>
          </div>

          <div className="chatbot-messages" ref={scrollRef}>
            {messages.map((m, i) => (
              <div key={i} className={`chat-bubble ${m.sender}`}>
                {m.text}
              </div>
            ))}
            {sending && <div className="chat-bubble bot typing">Typing...</div>}
          </div>

          <form className="chatbot-input-row" onSubmit={handleSend}>
            <input
              type="text"
              placeholder="Ask something..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button className="btn-primary" type="submit" style={{ marginTop: 0 }} disabled={sending}>
              Send
            </button>
          </form>
        </div>
      )}
    </>
  );
}
