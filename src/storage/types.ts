export type ProjectStatus = "draft" | "interview" | "review" | "ready";

export interface ProjectRecord {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  status: ProjectStatus;
  schemaVersion: 1;
}

export interface ProviderPreferences {
  activeProvider: "openai" | "gemini" | "anthropic";
  modelMode: "automatic" | "manual";
  selectedModels: Partial<Record<ProviderPreferences["activeProvider"], string>>;
}

export const DEFAULT_PROVIDER_PREFERENCES: ProviderPreferences = {
  activeProvider: "openai",
  modelMode: "automatic",
  selectedModels: {}
};