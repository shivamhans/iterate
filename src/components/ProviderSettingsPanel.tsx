import { useEffect, useState } from "react";
import { CheckCircle2, Eye, EyeOff, LoaderCircle, Save, ShieldCheck, Trash2, Wifi } from "lucide-react";
import { readProviderConfig, testProviderConnection, writeProviderConfig, type ProviderConfig, type ProviderId, type ProviderSettings } from "../lib/providerSettings";

const providers: { id: ProviderId; name: string; subtitle: string; placeholder: string; models: string[] }[] = [
  { id: "openai", name: "OpenAI", subtitle: "GPT models", placeholder: "sk-…", models: ["gpt-4.1", "gpt-4.1-mini", "gpt-4.1-nano", "o4-mini"] },
  { id: "gemini", name: "Google Gemini", subtitle: "Gemini models", placeholder: "AIza…", models: ["gemini-2.5-pro", "gemini-3.8-flash", "gemini-3.8-flash-lite"] },
  { id: "anthropic", name: "Anthropic Claude", subtitle: "Claude models", placeholder: "sk-ant-…", models: ["claude-sonnet-4-5", "claude-haiku-4-5", "claude-opus-4-1"] }
];
const blank: ProviderSettings = { apiKey: "", modelMode: "auto", model: "", updatedAt: 0 };

export default function ProviderSettingsPanel() {
  const [config, setConfig] = useState<ProviderConfig>({ selectedProvider: null, providers: {} });
  const [drafts, setDrafts] = useState<Record<ProviderId, ProviderSettings>>({ openai: blank, gemini: blank, anthropic: blank });
  const [visible, setVisible] = useState<Partial<Record<ProviderId, boolean>>>({});
  const [busy, setBusy] = useState<Partial<Record<ProviderId, "save" | "test">>>({});
  const [messages, setMessages] = useState<Partial<Record<ProviderId, { kind: "success" | "error" | "info"; text: string }>>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    readProviderConfig().then(value => {
      if (!alive) return;
      setConfig(value);
      setDrafts({
        openai: { ...blank, ...value.providers.openai },
        gemini: { ...blank, ...value.providers.gemini },
        anthropic: { ...blank, ...value.providers.anthropic }
      });
    }).catch(() => setMessages({ openai: { kind: "error", text: "Could not read local provider settings." } }))
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  function updateDraft(id: ProviderId, patch: Partial<ProviderSettings>) {
    setDrafts(current => ({ ...current, [id]: { ...current[id], ...patch } }));
    setMessages(current => ({ ...current, [id]: undefined }));
  }
  async function persist(next: ProviderConfig) {
    await writeProviderConfig(next);
    setConfig(next);
  }
  async function save(id: ProviderId) {
    const draft = drafts[id];
    if (!draft.apiKey.trim()) {
      setMessages(current => ({ ...current, [id]: { kind: "error", text: "Enter an API key before saving." } }));
      return;
    }
    setBusy(current => ({ ...current, [id]: "save" }));
    try {
      const saved = { ...draft, apiKey: draft.apiKey.trim(), model: draft.model.trim(), updatedAt: Date.now() };
      const next = { ...config, providers: { ...config.providers, [id]: saved } };
      await persist(next);
      setDrafts(current => ({ ...current, [id]: saved }));
      setMessages(current => ({ ...current, [id]: { kind: "success", text: "API key saved in this browser." } }));
    } catch {
      setMessages(current => ({ ...current, [id]: { kind: "error", text: "Could not save settings. Check extension storage permissions." } }));
    } finally { setBusy(current => ({ ...current, [id]: undefined })); }
  }
  async function test(id: ProviderId) {
    const key = drafts[id].apiKey.trim();
    if (!key) {
      setMessages(current => ({ ...current, [id]: { kind: "error", text: "Enter an API key to test the connection." } }));
      return;
    }
    setBusy(current => ({ ...current, [id]: "test" }));
    setMessages(current => ({ ...current, [id]: { kind: "info", text: "Contacting provider directly…" } }));
    try {
      const result = await testProviderConnection(id, key);
      setMessages(current => ({ ...current, [id]: { kind: "success", text: result } }));
    } catch (error) {
      setMessages(current => ({ ...current, [id]: { kind: "error", text: error instanceof Error ? error.message : "Connection test failed." } }));
    } finally { setBusy(current => ({ ...current, [id]: undefined })); }
  }
  async function remove(id: ProviderId) {
    const nextProviders = { ...config.providers };
    delete nextProviders[id];
    const next = { ...config, providers: nextProviders, selectedProvider: config.selectedProvider === id ? null : config.selectedProvider };
    try {
      await persist(next);
      setDrafts(current => ({ ...current, [id]: blank }));
      setMessages(current => ({ ...current, [id]: { kind: "success", text: "Saved API key removed from this browser." } }));
    } catch {
      setMessages(current => ({ ...current, [id]: { kind: "error", text: "Could not remove the saved key." } }));
    }
  }
  async function selectProvider(id: ProviderId) {
    if (!config.providers[id]?.apiKey) {
      setMessages(current => ({ ...current, [id]: { kind: "error", text: "Save an API key before selecting this provider." } }));
      return;
    }
    try { await persist({ ...config, selectedProvider: id }); }
    catch { setMessages(current => ({ ...current, [id]: { kind: "error", text: "Could not save provider selection." } })); }
  }

  if (loading) return <div className="provider-loading">Loading provider settings…</div>;
  return <div className="provider-manager">
    <div className="provider-intro"><ShieldCheck size={17}/><span>Keys are stored locally in this browser. Requests are sent directly to the provider you choose.</span></div>
    {providers.map(provider => {
      const draft = drafts[provider.id];
      const saved = Boolean(config.providers[provider.id]?.apiKey);
      const isBusy = busy[provider.id];
      const message = messages[provider.id];
      return <article className="provider-config-card glass-card" key={provider.id}>
        <div className="provider-config-head">
          <div className={`provider-logo provider-${provider.id}`}>{provider.id === "openai" ? "◎" : provider.id === "gemini" ? "✦" : "◉"}</div>
          <div className="provider-info"><strong>{provider.name}</strong><span>{provider.subtitle} · Bring your own key</span></div>
          <span className={`provider-status ${saved ? "is-connected" : ""}`}>{saved ? "Key saved" : "Not configured"}</span>
        </div>
        <label className="provider-field-label" htmlFor={`${provider.id}-key`}>API key</label>
        <div className="provider-key-row">
          <input id={`${provider.id}-key`} type={visible[provider.id] ? "text" : "password"} autoComplete="off" spellCheck={false} value={draft.apiKey} placeholder={provider.placeholder} onChange={e => updateDraft(provider.id, { apiKey: e.target.value })}/>
          <button type="button" className="provider-visibility" onClick={() => setVisible(current => ({ ...current, [provider.id]: !current[provider.id] }))} aria-label={visible[provider.id] ? "Hide API key" : "Show API key"}>{visible[provider.id] ? <EyeOff size={16}/> : <Eye size={16}/>}</button>
        </div>
        <div className="provider-model-row">
          <label>Model selection</label>
          <div className="provider-model-controls">
            <select aria-label={`${provider.name} model selection mode`} value={draft.modelMode} onChange={e => updateDraft(provider.id, { modelMode: e.target.value as "auto" | "manual" })}><option value="auto">Automatic (recommended)</option><option value="manual">Choose manually</option></select>
            {draft.modelMode === "manual" && <input className="provider-model-input" aria-label={`${provider.name} model ID`} list={`${provider.id}-model-suggestions`} value={draft.model} placeholder="Enter model ID" onChange={e => updateDraft(provider.id, { model: e.target.value })}/>}<datalist id={`${provider.id}-model-suggestions`}>{provider.models.map(model => <option key={model} value={model}/>)}</datalist>
          </div>
        </div>
        {message && <p className={`provider-feedback feedback-${message.kind}`} role="status">{message.text}</p>}
        <div className="provider-config-actions">
          <button className="secondary-button" disabled={Boolean(isBusy)} onClick={() => test(provider.id)}>{isBusy === "test" ? <LoaderCircle className="spin" size={14}/> : <Wifi size={14}/>} Test connection</button>
          <button className="primary-button" disabled={Boolean(isBusy)} onClick={() => save(provider.id)}>{isBusy === "save" ? <LoaderCircle className="spin" size={14}/> : <Save size={14}/>} Save key</button>
          {saved && <button className="provider-remove" disabled={Boolean(isBusy)} onClick={() => remove(provider.id)} aria-label={`Remove ${provider.name} API key`}><Trash2 size={15}/></button>}
        </div>
        {saved && <button className={`provider-select ${config.selectedProvider === provider.id ? "selected" : ""}`} onClick={() => selectProvider(provider.id)}>{config.selectedProvider === provider.id ? <><CheckCircle2 size={14}/> Selected provider</> : "Use this provider"}</button>}
      </article>;
    })}
    <div className="privacy-note"><ShieldCheck size={17}/><div><strong>Important security note</strong><p>Chrome local storage is not a hardware-backed secrets vault. Anyone with access to this browser profile may be able to inspect extension data. Never share your API key, and remove it before handing this device to someone else. ChatGPT subscriptions do not include OpenAI API credits; provider API usage may be billed separately.</p></div></div>
  </div>;
}
