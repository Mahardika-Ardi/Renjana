import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { buildEmotionRefinePrompt } from './prompts/emotion-refine.prompt';
import {
  buildCounselorSystemPrompt,
  CoupleContext,
  ChatHistoryMessage,
} from './prompts/relationship-counselor.prompt';

export interface EmotionDumpItem {
  id: string;
  content: string;
}

export interface RefinedResultItem {
  id: string;
  refinedContent: string;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private openai: OpenAI | null = null;
  private readonly openaiModel: string;
  private readonly geminiApiKey: string | null = null;
  private readonly geminiModel: string;
  private readonly geminiTimeoutMs: number;

  constructor(private config: ConfigService) {
    const openaiKey = this.config.get<string>('openai.apiKey');
    this.openaiModel = this.config.get<string>('openai.model') || 'gpt-4o-mini';

    if (openaiKey && !openaiKey.includes('your-openai')) {
      this.openai = new OpenAI({ apiKey: openaiKey });
    }

    const geminiKey = this.config.get<string>('gemini.apiKey');
    this.geminiModel =
      this.config.get<string>('gemini.model') || 'gemini-3.1-flash-lite';
    this.geminiTimeoutMs =
      this.config.get<number>('gemini.timeoutMs') || 45000;

    if (geminiKey && !geminiKey.includes('your-gemini')) {
      this.geminiApiKey = geminiKey;
      this.logger.log(
        `AiService initialized with Gemini API model: ${this.geminiModel} (timeout: ${this.geminiTimeoutMs}ms)`,
      );
    } else if (this.openai) {
      this.logger.log(
        `AiService initialized with OpenAI model: ${this.openaiModel}`,
      );
    } else {
      this.logger.warn(
        'GEMINI_API_KEY / OPENAI_API_KEY belum dikonfigurasi. AI Service akan menggunakan mode Refinement lokal/fallback.',
      );
    }
  }

  /**
   * Refine a list of raw emotion dumps into non-accusatory, constructive communication
   */
  async refineEmotionDumps(
    items: EmotionDumpItem[],
  ): Promise<RefinedResultItem[]> {
    if (!items || items.length === 0) return [];

    const prompt = buildEmotionRefinePrompt(items);

    // 1. Try Google Gemini API if configured
    if (this.geminiApiKey) {
      try {
        const geminiResults = await this.callGemini(prompt);
        if (geminiResults && geminiResults.length > 0) {
          return geminiResults;
        }
      } catch (err: any) {
        this.logger.warn(
          `Gemini API refinement failed (${err.message}). Trying fallback refiner...`,
        );
      }
    }

    // 2. Try OpenAI if Gemini was not configured or failed
    if (this.openai) {
      try {
        const openaiResults = await this.callOpenAi(prompt);
        if (openaiResults && openaiResults.length > 0) {
          return openaiResults;
        }
      } catch (err: any) {
        this.logger.warn(
          `OpenAI API refinement failed (${err.message}). Using local fallback...`,
        );
      }
    }

    // 3. Fallback refiner for offline/dev/testing
    this.logger.log(
      `Using local fallback refinement for ${items.length} emotion dumps.`,
    );
    return items.map((item) => ({
      id: item.id,
      refinedContent: this.fallbackRefine(item.content),
    }));
  }

  /**
   * Google Gemini REST API caller
   */
  private async callGemini(prompt: string): Promise<RefinedResultItem[]> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.geminiModel}:generateContent?key=${this.geminiApiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          responseMimeType: 'application/json',
        },
      }),
      signal: AbortSignal.timeout(this.geminiTimeoutMs),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini HTTP ${response.status}: ${errorText}`);
    }

    const data = (await response.json()) as any;
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    const parsed = JSON.parse(rawText);

    return parsed.results || [];
  }

  /**
   * OpenAI API caller
   */
  private async callOpenAi(prompt: string): Promise<RefinedResultItem[]> {
    if (!this.openai) return [];

    const completion = await this.openai.chat.completions.create({
      model: this.openaiModel,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    });

    const responseText = completion.choices[0]?.message?.content || '{}';
    const parsed = JSON.parse(responseText);

    return parsed.results || [];
  }

  /**
   * Fallback refiner for dev/testing when API key is unconfigured or rate limited
   */
  private fallbackRefine(raw: string): string {
    return (
      'Aku merasa perlu mengungkapkan apa yang aku rasakan: "' +
      raw.trim() +
      '". Aku berharap kita bisa membicarakan ini dengan tenang demi kebaikan hubungan kita.'
    );
  }

  /**
   * Memberikan respon konsultasi hubungan interaktif
   */
  async generateCounselingAdvice(
    history: ChatHistoryMessage[],
    context: CoupleContext,
  ): Promise<string> {
    const systemPrompt = buildCounselorSystemPrompt(context);

    // 1. Coba Google Gemini API
    if (this.geminiApiKey) {
      try {
        const geminiAdvice = await this.callGeminiCounselor(
          systemPrompt,
          history,
        );
        if (geminiAdvice) return geminiAdvice;
      } catch (err: any) {
        this.logger.warn(
          `Gemini counseling advice failed (${err.message}). Trying fallback...`,
        );
      }
    }

    // 2. Coba OpenAI jika Gemini gagal atau tidak ada key
    if (this.openai) {
      try {
        const openaiAdvice = await this.callOpenAiCounselor(
          systemPrompt,
          history,
        );
        if (openaiAdvice) return openaiAdvice;
      } catch (err: any) {
        this.logger.warn(
          `OpenAI counseling advice failed (${err.message}). Using local fallback...`,
        );
      }
    }

    // 3. Fallback konselor hubungan lokal
    return this.fallbackCounselorAdvice(history, context);
  }

  /**
   * Pemanggil Google Gemini untuk konsultasi hubungan dengan timeout 45s dan auto-retry 1x
   */
  private async callGeminiCounselor(
    systemPrompt: string,
    history: ChatHistoryMessage[],
  ): Promise<string | null> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.geminiModel}:generateContent?key=${this.geminiApiKey}`;

    // Format percakapan multi-turn untuk Gemini API
    const contents: any[] = [];
    const effectiveHistory = history.slice(-10); // Ambil maksimal 10 pesan terakhir untuk efisiensi
    for (const msg of effectiveHistory) {
      contents.push({
        role: msg.sender === 'USER' ? 'user' : 'model',
        parts: [{ text: msg.content }],
      });
    }

    if (contents.length === 0) return null;

    const payload = {
      system_instruction: {
        parts: [{ text: systemPrompt }],
      },
      contents,
      generationConfig: {
        temperature: 0.7,
      },
    };

    let lastError: any = null;
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(this.geminiTimeoutMs),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Gemini HTTP ${response.status}: ${errorText}`);
        }

        const data = (await response.json()) as any;
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          return text.trim();
        }
      } catch (err: any) {
        lastError = err;
        this.logger.warn(
          `Gemini counselor attempt ${attempt}/2 failed (${err.message}).` +
            (attempt < 2 ? ' Retrying in 1s...' : ''),
        );
        if (attempt < 2) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }
    }

    throw lastError || new Error('Gemini counselor call failed after 2 attempts');
  }

  /**
   * Pemanggil OpenAI untuk konsultasi hubungan
   */
  private async callOpenAiCounselor(
    systemPrompt: string,
    history: ChatHistoryMessage[],
  ): Promise<string | null> {
    if (!this.openai) return null;

    const messages: any[] = [{ role: 'system', content: systemPrompt }];
    const effectiveHistory = history.slice(-10);
    for (const msg of effectiveHistory) {
      messages.push({
        role: msg.sender === 'USER' ? 'user' : 'assistant',
        content: msg.content,
      });
    }

    const completion = await this.openai.chat.completions.create({
      model: this.openaiModel,
      messages,
      temperature: 0.7,
    });

    const responseText = completion.choices[0]?.message?.content;
    return responseText ? responseText.trim() : null;
  }

  /**
   * Respon fallback darurat saat server AI offline/gangguan
   */
  private fallbackCounselorAdvice(
    history: ChatHistoryMessage[],
    context: CoupleContext,
  ): string {
    const partner = context.partnerName || 'pasanganmu';
    return (
      `Halo ${context.userName}, maaf saat ini konselor AI Renjana sedang mengalami kendala jaringan ke server AI. ` +
      `Aku tetap di sini mendengarkan ceritamu tentang ${partner}. Mohon berikan waktu sejenak dan coba kirimkan kembali pertanyaan atau curhatmu ya.`
    );
  }
}

