import OpenAI from "openai";

export function deepseekClient(apiKey?: string) {
  const resolvedApiKey = apiKey ?? process.env.DEEPSEEK_API_KEY;

  if (!resolvedApiKey) {
    return null;
  }

  return new OpenAI({
    apiKey: resolvedApiKey,
    baseURL: "https://api.deepseek.com",
  });
}
