import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { buildEmotionRefinePrompt } from './prompts/emotion-refine.prompt';

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

  constructor(private config: ConfigService) {
    const openaiKey = this.config.get<string>('openai.apiKey');
    this.openaiModel = this.config.get<string>('openai.model') || 'gpt-4o-mini';

    if (openaiKey && !openaiKey.includes('your-openai')) {
      this.openai = new OpenAI({ apiKey: openaiKey });
    }

    const geminiKey = this.config.get<string>('gemini.apiKey');
    this.geminiModel =
      this.config.get<string>('gemini.model') || 'gemini-1.5-flash';

    if (geminiKey && !geminiKey.includes('your-gemini')) {
      this.geminiApiKey = geminiKey;
      this.logger.log(
        `AiService initialized with Gemini API model: ${this.geminiModel}`,
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
      signal: AbortSignal.timeout(5000),
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
}
