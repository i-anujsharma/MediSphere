// Red-flag keywords are checked with simple rules FIRST, separately from
// the AI call. Never rely on the AI alone for urgent-case detection --
// rules are fast and predictable, the AI adds richer summarization on top.
const RED_FLAG_KEYWORDS = [
  "chest pain",
  "breathless",
  "difficulty breathing",
  "unconscious",
  "severe bleeding",
  "heavy bleeding",
  "seizure",
  "stroke",
  "can't move",
  "cannot move",
  "suicidal",
  "poisoning",
];

export function checkRedFlag(text) {
  const lower = text.toLowerCase();
  const match = RED_FLAG_KEYWORDS.find((kw) => lower.includes(kw));
  return {
    redFlag: Boolean(match),
    reason: match || null,
  };
}

// Calls Gemini's free-tier API to turn raw patient answers into a
// doctor-ready summary. Falls back to a simple template if no API key
// is configured yet, so the app still works out of the box.
export async function generateSummary({ answers, ocrText }) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  const combinedAnswers = answers.map((a) => `${a.question}: ${a.answer}`).join("\n");
  const fullText = `${combinedAnswers}\n${ocrText || ""}`;

  const redFlagResult = checkRedFlag(fullText);

  if (!apiKey) {
    // Fallback: basic template summary, no external call.
    const fallbackSummary = `Patient-reported symptoms:\n${combinedAnswers}${
      ocrText ? `\n\nDocument text (OCR):\n${ocrText}` : ""
    }`;
    return { summary: fallbackSummary, ...redFlagResult };
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `You are a medical intake assistant. Turn the following patient-reported symptoms and any scanned document text into a short, structured, doctor-ready case summary (chief complaint, duration, relevant details). Do not diagnose. Keep it under 120 words.\n\n${fullText}`,
                },
              ],
            },
          ],
        }),
      }
    );
    const data = await response.json();
    const summary =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      `Patient-reported symptoms:\n${combinedAnswers}`;
    return { summary, ...redFlagResult };
  } catch (err) {
    // Network/API failure shouldn't block the patient -- fall back gracefully.
    return {
      summary: `Patient-reported symptoms:\n${combinedAnswers}`,
      ...redFlagResult,
    };
  }
}
