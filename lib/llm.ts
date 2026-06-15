import type { LlmModel, LlmProvider } from "@/types";

export const providerLabels: Record<LlmProvider, string> = {
  deepseek: "DeepSeek",
  openai: "OpenAI",
  openrouter: "OpenRouter",
  groq: "Groq",
  siliconflow: "SiliconFlow",
  together: "Together",
  fireworks: "Fireworks",
  "aliyun-bailian": "阿里云百炼",
  "volcengine-ark": "火山方舟",
  xai: "xAI",
  "openai-compatible": "OpenAI Compatible",
};

export const providerModelOptions: Record<LlmProvider, LlmModel[]> = {
  deepseek: ["deepseek-v4-flash", "deepseek-v4-pro"],
  openai: ["gpt-4.1-mini", "gpt-4.1", "gpt-4o-mini"],
  openrouter: ["openai/gpt-4.1-mini", "anthropic/claude-3.5-sonnet", "google/gemini-2.5-flash"],
  groq: ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "deepseek-r1-distill-llama-70b"],
  siliconflow: ["deepseek-ai/DeepSeek-V3", "Qwen/Qwen2.5-72B-Instruct", "THUDM/glm-4-9b-chat"],
  together: ["meta-llama/Llama-3.3-70B-Instruct-Turbo", "Qwen/Qwen2.5-72B-Instruct-Turbo", "deepseek-ai/DeepSeek-V3"],
  fireworks: ["accounts/fireworks/models/llama-v3p3-70b-instruct", "accounts/fireworks/models/qwen3-235b-a22b", "accounts/fireworks/models/deepseek-v3"],
  "aliyun-bailian": ["qwen-plus", "qwen-turbo", "deepseek-v3"],
  "volcengine-ark": ["doubao-seed-1-6-thinking", "doubao-pro-32k", "deepseek-v3-250324"],
  xai: ["grok-3-mini", "grok-3", "grok-2-1212"],
  "openai-compatible": ["gpt-4.1-mini", "gpt-4.1", "deepseek-v4-flash"],
};

export function getDefaultModel(provider: LlmProvider): LlmModel {
  return providerModelOptions[provider][0] ?? "gpt-4.1-mini";
}

export function getDefaultBaseUrl(provider: LlmProvider) {
  switch (provider) {
    case "openai":
      return "https://api.openai.com/v1";
    case "openrouter":
      return "https://openrouter.ai/api/v1";
    case "groq":
      return "https://api.groq.com/openai/v1";
    case "siliconflow":
      return "https://api.siliconflow.cn/v1";
    case "together":
      return "https://api.together.xyz/v1";
    case "fireworks":
      return "https://api.fireworks.ai/inference/v1";
    case "aliyun-bailian":
      return "https://dashscope.aliyuncs.com/compatible-mode/v1";
    case "volcengine-ark":
      return "https://ark.cn-beijing.volces.com/api/v3";
    case "xai":
      return "https://api.x.ai/v1";
    case "openai-compatible":
      return "https://api.openai.com/v1";
    case "deepseek":
    default:
      return "";
  }
}

export function isBaseUrlEditable(provider: LlmProvider) {
  return provider !== "deepseek";
}

export function normalizeProvider(value?: string): LlmProvider {
  if (value && value in providerLabels) {
    return value as LlmProvider;
  }

  return "deepseek";
}

export function normalizeModel(provider: LlmProvider, value?: string) {
  if (!value || !value.trim()) {
    return getDefaultModel(provider);
  }

  if (value === "deepseek-chat") {
    return "deepseek-v4-flash";
  }

  return value;
}
