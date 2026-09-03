const SYSTEM_CONTEXT = `You are MediSphere's assistant chatbot, embedded in a patient's dashboard.
You can have normal, friendly conversation and answer general health/wellness questions at a basic,
educational level (e.g. what a symptom might commonly relate to, general hygiene, when to see a
doctor). You must NOT diagnose, prescribe medication, or give dosage instructions. For anything
serious, urgent, or specific to the person's condition, tell them to use the "Submit to doctor"
feature on this app or consult a doctor directly. Keep replies short (2-4 sentences) and warm.`;

export async function sendChatMessage(history, newMessage) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    return "Chatbot isn't fully set up yet (missing Gemini API key), but you can still submit your symptoms above and a doctor will review them.";
  }

  const contents = [
    {
      role: "user",
      parts: [{ text: SYSTEM_CONTEXT }],
    },
    {
      role: "model",
      parts: [{ text: "Understood, I'll keep things general, friendly, and safe." }],
    },
    ...history.map((m) => ({
      role: m.sender === "user" ? "user" : "model",
      parts: [{ text: m.text }],
    })),
    {
      role: "user",
      parts: [{ text: newMessage }],
    },
  ];

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents }),
      }
    );
    const data = await response.json();
    return (
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Sorry, I couldn't process that. Could you rephrase?"
    );
  } catch (err) {
    return "I'm having trouble connecting right now. Please try again in a moment.";
  }
}
