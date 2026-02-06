
import { AnalysisResult } from "../types";


/**
 * This implementation calls an OpenAI-compatible API (e.g., vLLM, text-generation-webui, OpenRouter).
 * The API host and key must be provided in Vite env variables: VITE_API_HOST and VITE_API_KEY.
 */
const MODEL_NAME = "gwdg.mistral-large-instruct";
const API_HOST = (import.meta as any).env?.VITE_API_HOST as string | undefined;
const API_KEY = (import.meta as any).env?.VITE_API_KEY as string | undefined;

export async function analyzeMeshFeatures(modelInfo: string): Promise<AnalysisResult> {
  if (!API_KEY) throw new Error("Missing VITE_API_KEY in environment");
  if (!API_HOST) throw new Error("Missing VITE_API_HOST in environment");

  const endpoint = `${API_HOST.replace(/\/$/, '')}/chat/completions`;

  const systemPrompt = "You are a CAD feature extraction expert. Analyze mesh metadata and respond ONLY with valid JSON.";
  const userPrompt = `EXTRACT CAD FEATURES FROM MESH METADATA: ${modelInfo}.\n\nRespond with a single JSON object that matches this structure:\n{\n  "features": [ { "id": "", "name": "", "type": "", "confidence": 0.0, "parameters": {"diameter": 0.0, "depth": 0.0, "radius": 0.0, "width": 0.0, "height": 0.0 }, "status": "" } ],\n  "qualityScore": 0.0,\n  "summary": "",\n  "reconstructionSteps": ["step1", "step2"]\n}`;

  const payload = {
    model: MODEL_NAME,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ],
    temperature: 0,
    max_tokens: 1024,
    top_p: 0.1
  };

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
      Accept: "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const txt = await res.text();
    console.error("API error:", res.status, txt);
    throw new Error(`Model API error: ${res.status}`);
  }

  const data = await res.json();

  // Extract text from OpenAI-compatible response format
  let textOutput: string | undefined;
  if (data.choices && Array.isArray(data.choices) && data.choices[0]) {
    const choice = data.choices[0];
    if (choice.message && choice.message.content) {
      textOutput = choice.message.content;
    } else if (typeof choice === "string") {
      textOutput = choice;
    }
  } else if (typeof data === "string") {
    textOutput = data;
  }

  if (!textOutput) throw new Error("Empty response from model");

  // Try to parse JSON directly; if the model returned text, extract JSON substring and parse.
  const s = textOutput.trim();
  try {
    return JSON.parse(s) as AnalysisResult;
  } catch (err) {
    const match = s.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]) as AnalysisResult;
      } catch (e) {
        console.error("Failed to parse JSON from model output", e);
      }
    }
    console.error("Failed to parse model response as JSON", err);
    throw new Error("Failed to parse model response as JSON");
  }
}
