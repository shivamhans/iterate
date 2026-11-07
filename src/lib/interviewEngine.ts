import { readProviderConfig } from "./providerSettings";

export type InterviewOption = { id: string; label: string; description?: string };
export type InterviewQuestion = {
  id: string;
  section: string;
  title: string;
  explanation: string;
  options: InterviewOption[];
  allowMultiple: boolean;
  essential: boolean;
  customAnswerEnabled: boolean;
};
export type InterviewTurn = { question: InterviewQuestion; answer: string[]; customAnswer?: string };
export type InterviewContext = {
  idea: string;
  turns: InterviewTurn[];
  specification: Record<string, unknown>;
  knowledgeLevel: "beginner" | "intermediate" | "advanced" | "unknown";
};
export type InterviewDecision = {
  kind: "question" | "ready";
  question?: InterviewQuestion;
  completionSummary?: string;
  sections?: { name: string; status: "complete" | "in_progress" | "upcoming" }[];
  specification?: Record<string, unknown>;
};
const SYSTEM_INSTRUCTIONS = `You are Iterate, an adaptive requirements interviewer. Your job is to turn a rough idea into a complete, actionable specification by asking exactly ONE useful question per turn.

Rules:
- Classify the idea yourself, but include the inferred category in the evolving specification.
- Ask contextual clarification questions and discovery questions. Prioritize decisions with the greatest impact.
- Adapt vocabulary and technical depth to the user's demonstrated knowledge. Never force a beginner to choose technical tools prematurely; offer sensible defaults.
- Detect contradictions in prior answers and resolve them explicitly before proceeding.
- Every question must have 3-5 concise, distinct options and customAnswerEnabled=true. allowMultiple must be true where combinations make sense; otherwise false.
- Do not ask for information already supplied. Do not repeat a question. Explain why a question matters in one short sentence.
- Track requirements in a structured, dynamic specification. Identify risks and dependencies when relevant.
- Decide dynamically how many questions are needed. Do not pad the interview to hit a target count.
- Return kind="ready" only when major requirements, users, goals, scope, constraints, success criteria and relevant risks are sufficiently clear for this idea. Otherwise ask the next highest-value question.
- The user must approve completion; never claim the project is finished merely because you recommend it.
- Return valid JSON only, matching this shape:
For a question: {"kind":"question","question":{"id":"unique-short-id","section":"section name","title":"one clear question","explanation":"why this matters","options":[{"id":"a","label":"option","description":"optional short detail"}],"allowMultiple":true,"essential":true,"customAnswerEnabled":true},"specification":{},"sections":[{"name":"Goals","status":"complete|in_progress|upcoming"}]}
For ready: {"kind":"ready","completionSummary":"brief reason it is ready for review","specification":{},"sections":[...]}
- Never invent user answers. Mark unknowns as unknown or proposed defaults, not confirmed facts.`;

function cleanJson(text: string): InterviewDecision {
  const cleaned = text.trim().replace(/^\u0060\u0060\u0060(?:json)?\s*/i, "").replace(/\s*\u0060\u0060\u0060$/, "");
  const parsed = JSON.parse(cleaned) as InterviewDecision;
  if (parsed.kind !== "question" && parsed.kind !== "ready") throw new Error("The AI returned an unsupported interview response. Please try again.");
  if (parsed.kind === "question") {
    const q = parsed.question;
    if (!q || !q.title || !Array.isArray(q.options) || q.options.length < 2) throw new Error("The AI returned an incomplete question. Please try again.");
    q.customAnswerEnabled = true;
  }
  return parsed;
}
async function requestOpenAI(key: string, model: string, prompt: string): Promise<string> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model: model || "gpt-4.1-mini", temperature: 0.3, response_format: { type: "json_object" }, messages: [{ role: "system", content: SYSTEM_INSTRUCTIONS }, { role: "user", content: prompt }] })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.error?.message || `OpenAI request failed (HTTP ${response.status}).`);
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error("OpenAI returned an empty response.");
  return content;
}
async function requestGemini(key: string, model: string, prompt: string): Promise<string> {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model || "gemini-2.5-flash")}:generateContent?key=${encodeURIComponent(key)}`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTIONS }] }, contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json", temperature: 0.3 } })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.error?.message || `Gemini request failed (HTTP ${response.status}).`);
  const content = data?.candidates?.[0]?.content?.parts?.map((part: { text?: string }) => part.text || "").join("");
  if (!content) throw new Error("Gemini returned an empty response.");
  return content;
}
async function requestAnthropic(key: string, model: string, prompt: string): Promise<string> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST", headers: { "Content-Type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
    body: JSON.stringify({ model: model || "claude-sonnet-4-5", max_tokens: 1800, temperature: 0.3, system: SYSTEM_INSTRUCTIONS, messages: [{ role: "user", content: prompt }] })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.error?.message || `Claude request failed (HTTP ${response.status}).`);
  const content = data?.content?.filter((part: { type: string }) => part.type === "text").map((part: { text: string }) => part.text).join("");
  if (!content) throw new Error("Claude returned an empty response.");
  return content;
}
export async function generateInterviewDecision(context: InterviewContext): Promise<InterviewDecision> {
  const config = await readProviderConfig();
  const provider = config.selectedProvider;
  if (!provider) throw new Error("Choose and save an AI provider in AI providers before starting an interview.");
  const settings = config.providers[provider];
  if (!settings?.apiKey) throw new Error("The selected provider has no saved API key. Reconnect it in AI providers.");
  const prompt = `Project idea:\n${context.idea}\n\nKnown knowledge level: ${context.knowledgeLevel}\n\nAnswers so far (oldest first):\n${JSON.stringify(context.turns, null, 2)}\n\nCurrent specification (update this, preserving confirmed facts):\n${JSON.stringify(context.specification, null, 2)}\n\nDecide whether to ask the next highest-value question or recommend that the user review completion. Return only the required JSON.`;
  let raw: string;
  try {
    if (provider === "openai") raw = await requestOpenAI(settings.apiKey, settings.modelMode === "manual" ? settings.model : "", prompt);
    else if (provider === "gemini") raw = await requestGemini(settings.apiKey, settings.modelMode === "manual" ? settings.model : "", prompt);
    else raw = await requestAnthropic(settings.apiKey, settings.modelMode === "manual" ? settings.model : "", prompt);
  } catch (error) {
    if (error instanceof TypeError) throw new Error("Could not reach the selected provider. Check your connection, provider API access, and extension host permissions.");
    throw error;
  }
  return cleanJson(raw);
}
