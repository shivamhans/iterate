import { DEFAULT_PROVIDER_PREFERENCES, type ProviderPreferences } from "./types";

const SETTINGS_KEY = "iterate.settings.v1";
export interface LocalSettings {
  providers: ProviderPreferences;
  appearance: "dark";
}

const DEFAULT_SETTINGS: LocalSettings = {
  providers: DEFAULT_PROVIDER_PREFERENCES,
  appearance: "dark"
};

export async function getLocalSettings(): Promise<LocalSettings> {
  if (typeof chrome === "undefined" || !chrome.storage?.local) return DEFAULT_SETTINGS;
  const stored = await chrome.storage.local.get(SETTINGS_KEY);
  return { ...DEFAULT_SETTINGS, ...(stored[SETTINGS_KEY] as Partial<LocalSettings> | undefined) };
}

export async function saveLocalSettings(settings: LocalSettings): Promise<void> {
  if (typeof chrome === "undefined" || !chrome.storage?.local) {
    throw new Error("Chrome extension storage is unavailable in this context.");
  }
  await chrome.storage.local.set({ [SETTINGS_KEY]: settings });
}