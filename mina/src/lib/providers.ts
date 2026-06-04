// Model council — three OpenAI-compatible providers, all free tier.
// Brain tries them in order; first successful response wins.
//
// Order: Groq (fastest) → NVIDIA (most capable free model) → OpenRouter (broad fallback)

import OpenAI from "openai";

export type Provider = {
  name: string;
  client: OpenAI;
  model: string;
};

function make(
  name: string,
  apiKey: string | undefined,
  baseURL: string,
  model: string,
): Provider | null {
  if (!apiKey) return null;
  return { name, client: new OpenAI({ apiKey, baseURL }), model };
}

export function getProviders(): Provider[] {
  return [
    make(
      "Groq",
      process.env.GROQ_API_KEY,
      "https://api.groq.com/openai/v1",
      "llama-3.3-70b-versatile",
    ),
    make(
      "NVIDIA",
      process.env.NVIDIA_API_KEY,
      "https://integrate.api.nvidia.com/v1",
      "meta/llama-3.1-405b-instruct",
    ),
    make(
      "OpenRouter",
      process.env.OPENROUTER_API_KEY,
      "https://openrouter.ai/api/v1",
      "nousresearch/hermes-3-llama-3.1-405b:free",
    ),
    make(
      "Gemini",
      process.env.GEMINI_API_KEY,
      "https://generativelanguage.googleapis.com/v1beta/openai/",
      "gemini-2.0-flash",
    ),
  ].filter(Boolean) as Provider[];
}
