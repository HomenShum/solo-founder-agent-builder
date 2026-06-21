// SoloMemory — optional embedding provider (portable template).
// Memory works WITHOUT this (FTS5 is the default recall path). Wire it only for semantic recall.
import type { EmbeddingProvider } from "./types";

export class OllamaEmbeddingProvider implements EmbeddingProvider {
  readonly model: string;
  readonly dim: number;

  constructor(args?: { model?: string; dim?: number }) {
    this.model = args?.model ?? process.env.MEMORY_EMBED_MODEL ?? "bge-m3";
    this.dim = args?.dim ?? Number(process.env.MEMORY_EMBED_DIMS ?? 1024);
  }

  async embed(text: string): Promise<number[]> {
    const res = await fetch(process.env.OLLAMA_URL ?? "http://localhost:11434/api/embeddings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: this.model, prompt: text }),
    });

    if (!res.ok) {
      throw new Error(`Ollama embedding failed: ${res.status} ${await res.text()}`);
    }

    const json = await res.json();
    const embedding = json.embedding as number[];

    if (!Array.isArray(embedding)) {
      throw new Error("Ollama returned no embedding array.");
    }

    return embedding;
  }
}

export function cosineSimilarity(a: number[], b: number[]) {
  if (a.length !== b.length || a.length === 0) return 0;

  let dot = 0;
  let a2 = 0;
  let b2 = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    a2 += a[i] * a[i];
    b2 += b[i] * b[i];
  }

  if (a2 === 0 || b2 === 0) return 0;
  return dot / (Math.sqrt(a2) * Math.sqrt(b2));
}
