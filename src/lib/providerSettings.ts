export type ProviderId = "openai" | "gemini" | "anthropic";
export type ProviderSettings = {
  apiKey: string;
  modelMode: "auto" | "manual";
  model: string;
  updatedAt: number;
};
export type ProviderConfig = {
  selectedProvider: ProviderId | null;
  providers: Partial<Record<ProviderId, ProviderSettings>>;
};
const STORAGE_KEY = "iterate.provider-config";
const emptyConfig: ProviderConfig = { selectedProvider: null, providers: {} };

function extensionStorage(): typeof chrome.storage.local | null {
  return typeof chrome !== "undefined" && Boolean(chrome.storage?.local) ? chrome.storage.local : null;
}
export async function readProviderConfig(): Promise<ProviderConfig> {
  const storage = extensionStorage();
  if (!storage) {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? { ...emptyConfig, ...JSON.parse(raw) } : emptyConfig;
    } catch { return emptyConfig; }
  }
  const result = await storage.get(STORAGE_KEY);
  return result[STORAGE_KEY] ? { ...emptyConfig, ...result[STORAGE_KEY] } : emptyConfig;
}
export async function writeProviderConfig(config: ProviderConfig): Promise<void> {
  const storage = extensionStorage();
  if (!storage) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    return;
  }
  await storage.set({ [STORAGE_KEY]: config });
}
export async function testProviderConnection(provider: ProviderId, apiKey: string): Promise<string> {
  const headers: Record<string, string> = {};
  let url = "";
  if (provider === "openai") {
    url = "https://api.openai.com/v1/models";
    headers.Authorization = `Bearer ${apiKey}`;
  } else if (provider === "gemini") {
    url = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`;
  } else {
    url = "https://api.anthropic.com/v1/models";
    headers["x-api-key"] = apiKey;
    headers["anthropic-version"] = "2023-06-01";
  }
  let response: Response;
  try {
    response = await fetch(url, { method: "GET", headers, signal: AbortSignal.timeout(15000) });
  } catch (error) {
    if (error instanceof DOMException && error.name === "TimeoutError") throw new Error("The provider took too long to respond. Check your connection and try again.");
    throw new Error("Could not reach the provider. Check your internet connection and try again.");
  }
  if (response.ok) return "Connection successful. The API key was accepted.";
  if (response.status === 401 || response.status === 403) throw new Error("The provider rejected this API key. Check that it is correct and has permission to access the API.");
  if (response.status === 429) throw new Error("The provider rate-limited this request. Wait a moment and try again; check your provider quota if it continues.");
  if (response.status >= 500) throw new Error("The provider is currently having trouble. Try again later.");
  let detail = "";
  try {
    const data = await response.json();
    detail = provider === "openai" ? data?.error?.message : provider === "gemini" ? data?.error?.message : data?.error?.message;
  } catch { /* Do not expose raw response bodies. */ }
  throw new Error(detail ? `Provider error: ${String(detail).slice(0, 220)}` : `The provider returned HTTP ${response.status}. Check the key and provider settings.`);
}
