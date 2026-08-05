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

  return `Kamu adalah konselor hubungan pasangan yang hangat, empatik, dan bijaksana.
Tugas kamu adalah mentransformasi catatatan emosi mentah (Emotion Dump) berikut menjadi bahasa reflektif yang clear, non-accusatory, berbasis "I-statement" (perasaan & kebutuhan diri), tanpa menyalahkan pasangan.

PRINSIP REFINEMENT:
1. Pertahankan inti emosi dan masalah yang dirasakan user.
2. Ubah tuduhan atau tudikan "Kamu selalu..." / "Kamu tidak pernah..." menjadi ungkapan perasaan "Aku merasa..." dan "Aku membutuhkan...".
3. Gunakan bahasa Indonesia yang hangat, dewasa, dan membangun dialog positif.
4. Jawab dalam format JSON object persis seperti ini:
{
  "results": [
    { "id": "ID_ENTRY", "refinedContent": "Hasil refleksi emosi..." }
  ]
}

DATA EMOTION DUMP MENTAH:
${formattedDumps}`;
}
