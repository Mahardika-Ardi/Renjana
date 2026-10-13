/**
 * Prompt template for AI Emotion Refinement
 * Transforms raw, potentially emotional or accusatory thoughts into clear,
 * non-accusatory, constructive communication ("I-statements").
 */
export function buildEmotionRefinePrompt(
  dumps: { id: string; content: string }[],
): string {
  const formattedDumps = dumps
    .map((d, index) => `[Entry ${index + 1} | ID: ${d.id}]\n${d.content}`)
    .join('\n\n');

  return `Act as a warm, empathetic, and wise relationship counselor. 

Your task is to transform raw "Emotion Dump" entries from a user into clear, reflective, non-accusatory "I-statements" (focusing on feelings and needs) to foster healthy communication.

CORE RULES:
1. Core Meaning: Preserve the emotional intent and underlying issue of the raw input.
2. Reframing: Convert any accusatory phrases (e.g., "You always...", "You never...") into "I feel..." and "I need..." statements.
3. Language & Tone: Output the refined content in warm, mature, and constructive Indonesian (Bahasa Indonesia).
4. Strict JSON Output: Respond ONLY with a valid JSON object matching this exact schema:

{
  "results": [
    { 
      "id": "ENTRY_ID", 
      "refinedContent": "Hasil refleksi emosi..." 
    }
  ]
}

RAW EMOTION DUMP DATA:
${formattedDumps}`;
}
