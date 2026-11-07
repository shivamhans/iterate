import { useState } from "react";
import { ArrowRight, Check, ChevronLeft, LoaderCircle, Sparkles } from "lucide-react";
import { generateInterviewDecision, type InterviewDecision, type InterviewTurn } from "../lib/interviewEngine";
import { readProviderConfig, type ProviderConfig, type ProviderId } from "../lib/providerSettings";

const modelChoices: Record<ProviderId, { label: string; models: string[] }> = { openai: { label: "OpenAI", models: ["gpt-4.1-mini", "gpt-4.1", "gpt-4.1-nano", "o4-mini"] }, gemini: { label: "Google Gemini", models: ["gemini-3.8-flash", "gemini-2.5-pro", "gemini-3.8-flash-lite", "gemini-3-flash-preview"] }, anthropic: { label: "Anthropic Claude", models: ["claude-sonnet-4-5", "claude-haiku-4-5", "claude-opus-4-1"] } };
const defaultModel: Record<ProviderId, string> = { openai: "gpt-4.1-mini", gemini: "gemini-3.8-flash", anthropic: "claude-sonnet-4-5" };

export default function InterviewWorkspace({ idea, onExit }: { idea: string; onExit: () => void }) {
  const [turns, setTurns] = useState<InterviewTurn[]>([]);
  const [decision, setDecision] = useState<InterviewDecision | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [custom, setCustom] = useState("");
  const [specification, setSpecification] = useState<Record<string, unknown>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [approved, setApproved] = useState(false);
  const [providerConfig, setProviderConfig] = useState<ProviderConfig | null>(null);
  const [changeModelOpen, setChangeModelOpen] = useState(false);
  const [modelChoice, setModelChoice] = useState("");

  async function requestNext(nextTurns: InterviewTurn[], override?: { provider: ProviderId; model: string }) {
    setBusy(true); setError("");
    try {
      const result = await generateInterviewDecision({ idea, turns: nextTurns, specification, knowledgeLevel: "unknown" }, override);
      setDecision(result);
      if (result.specification) setSpecification(result.specification);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong while contacting your AI provider.");
    } finally { setBusy(false); }
  }
  function begin() { void requestNext([]); }
  function submitAnswer() {
    if (!decision?.question || (!selected.length && !custom.trim())) return;
    const next = [...turns, { question: decision.question, answer: selected, customAnswer: custom.trim() || undefined }];
    setTurns(next); setSelected([]); setCustom(""); void requestNext(next);
  }
  const question = decision?.question;
  return <section className="interview-workspace">
    <div className="interview-topline"><button className="text-button" onClick={onExit}><ChevronLeft size={15}/> Back to projects</button><span><span className="interview-live-dot"/> PRIVATE SESSION · LOCAL PROJECT</span></div>
    <div className="interview-layout">
      <main className="interview-main glass-card">
        <div className="eyebrow"><Sparkles size={13}/> THE ITERATE INTERVIEW</div>
        <h2>{approved ? "Your review is approved." : "Let's explore your idea."}</h2>
        <p className="interview-idea">“{idea}”</p>
        {!decision && !busy && !error && <div className="interview-start"><p>Iterate will ask one thoughtful question at a time, adapting as your idea becomes clearer.</p><button className="primary-button" onClick={begin}>Start AI interview <ArrowRight size={15}/></button></div>}
        {busy && <div className="interview-thinking"><LoaderCircle className="spin" size={22}/><strong>Thinking through your idea…</strong><span>Finding the most useful next question.</span></div>}
        {error && <div className="interview-error" role="alert">
          <strong>Couldn't continue the interview</strong><p>{error}</p>
          <div className="interview-error-actions">
            <button className="secondary-button" onClick={()=>requestNext(turns)}>Try again</button>
            <button className="secondary-button" onClick={async()=>{const config=await readProviderConfig();setProviderConfig(config);const ids=(Object.keys(modelChoices) as ProviderId[]).filter(id=>config.providers[id]?.apiKey);const first=ids[0];if(first){const saved=config.providers[first];const model=saved?.modelMode==="manual"&&saved.model?saved.model:defaultModel[first];setModelChoice(first+"|"+model);}setChangeModelOpen(value=>!value);}}>Change model</button>
          </div>
          {changeModelOpen && <div className="interview-model-picker">
            <label htmlFor="interview-model-choice">Choose a connected provider and model</label>
            <select id="interview-model-choice" value={modelChoice} onChange={event=>setModelChoice(event.target.value)}>
              {(Object.keys(modelChoices) as ProviderId[]).flatMap(id=>{const saved=providerConfig?.providers[id];if(!saved?.apiKey)return [];const preferred=saved.modelMode==="manual"&&saved.model?saved.model:defaultModel[id];return [...new Set([preferred,...modelChoices[id].models])].map(model=><option key={id+"|"+model} value={id+"|"+model}>{modelChoices[id].label+" · "+model}</option>);})}
            </select>
            <button className="primary-button" disabled={!modelChoice} onClick={()=>{const parts=modelChoice.split("|");setChangeModelOpen(false);void requestNext(turns,{provider:parts[0] as ProviderId,model:parts.slice(1).join("|")});}}>Retry with this model <ArrowRight size={14}/></button>
            <small>Only providers with saved API keys are shown. This changes the model for this retry, not your default settings.</small>
          </div>}
        </div>}
        {question && !busy && <div className="interview-question">
          <div className="interview-section-label">{question.section || "DISCOVERY"} · {question.essential ? "IMPORTANT" : "OPTIONAL"}</div>
          <h3>{question.title}</h3><p>{question.explanation}</p>
          <div className="interview-options">{question.options.map(option=><button key={option.id} className={selected.includes(option.id)?"interview-option chosen":"interview-option"} onClick={()=>setSelected(current=>question.allowMultiple?(current.includes(option.id)?current.filter(x=>x!==option.id):[...current,option.id]):[option.id])}><span className="option-check">{selected.includes(option.id)&&<Check size={13}/>}</span><span><strong>{option.label}</strong>{option.description&&<small>{option.description}</small>}</span></button>)}</div>
          {question.customAnswerEnabled && <textarea className="interview-custom-answer" rows={2} value={custom} onChange={e=>setCustom(e.target.value)} placeholder="Or add your own answer…"/>}
          <div className="interview-question-actions"><span>{question.allowMultiple?"Choose all that apply":"Choose one, or add your own"}</span><button className="primary-button" disabled={!selected.length&&!custom.trim()} onClick={submitAnswer}>Continue <ArrowRight size={15}/></button></div>
        </div>}
        {decision?.kind==="ready"&&!busy&&!approved&&<div className="interview-ready"><div className="ready-mark"><Check size={22}/></div><h3>Ready for your review</h3><p>{decision.completionSummary}</p><button className="primary-button" onClick={()=>setApproved(true)}>Review and approve specification <ArrowRight size={15}/></button></div>}
        {approved&&<div className="interview-ready"><p>Your interview engine recommends the requirements are ready for review. The specification review and editing screen is the next milestone.</p><button className="secondary-button" onClick={onExit}>Return to projects</button></div>}
      </main>
      <aside className="interview-side glass-card"><div className="section-kicker">YOUR PROGRESS</div><h3>{turns.length} {turns.length===1?"answer":"answers"}</h3><p>Adaptive interview · no fixed question limit</p><div className="interview-progress-list">{(decision?.sections||[]).map(section=><div key={section.name} className={`interview-progress-item ${section.status}`}><span/>{section.name}</div>)}</div><div className="interview-side-note">You can take your time. Your answers shape the specification as we go.</div></aside>
    </div>
  </section>;
}
