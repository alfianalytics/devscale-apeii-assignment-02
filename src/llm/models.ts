import { OpenAIClient } from "@anvia/openai";
import { generateCompletion } from "@anvia/core";
import "dotenv/config";

const client = new OpenAIClient({
  baseUrl: process.env.BASE_URL,
  apiKey: process.env.OPEN_AI_API_KEY!,
});

export const model = client.completionModel({
  modelId: process.env.MODEL_NAME || "gemini-3.7-flash",
  api: "chat",
});

export function getModel(modelId: string) {
  return client.completionModel({
    modelId,
    api: "chat",
  });
}

const SUMMARIZE_INSTRUCTION = `
You are an expert AI editor and researcher.
Your task is to summarize the provided article clearly and extract the most impactful key takeaways.
You MUST reply ONLY with valid JSON without markdown fences, using this structure:
{
  "summary": "Concise summary string",
  "keyTakeaways": ["point 1", "point 2"]
}
`;

function cleanJsonOutput(text: string): string {
  let cleaned = text.trim();
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith("```")) {
    cleaned = cleaned.slice(0, -3);
  }
  return cleaned.trim();
}

export async function summarizeArticle(content: string, title?: string) {
  const result = await generateCompletion({
    model,
    instructions: SUMMARIZE_INSTRUCTION,
    prompt: `Title: ${title ?? "Untitled"}\n\nContent:\n${content}`,
  });

  const rawText = typeof result.output === "string" ? result.output : JSON.stringify(result.output);
  const cleaned = cleanJsonOutput(rawText);

  try {
    const parsed = JSON.parse(cleaned);
    return JSON.stringify(parsed);
  } catch {
    return JSON.stringify({
      summary: cleaned,
      keyTakeaways: [],
    });
  }
}
