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
  private readonly modelName: string;

  constructor(private config: ConfigService) {
    const apiKey = this.config.get<string>('openai.apiKey');
    this.modelName = this.config.get<string>('openai.model') || 'gpt-4o-mini';

    if (apiKey && apiKey.startsWith('sk-') && !apiKey.includes('your-openai')) {
      this.openai = new OpenAI({ apiKey });
      this.logger.log(`AiService initialized with OpenAI model: ${this.modelName}`);
    } else {
      this.logger.warn(
        'OPENAI_API_KEY belum dikonfigurasi di .env. AI Service akan menggunakan mode Refinement lokal/fallback.',
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

    // Fallback if OpenAI client is not configured
    if (!this.openai) {
      this.logger.log(`Using fallback refinement for ${items.length} emotion dumps.`);
      return items.map((item) => ({
        id: item.id,
        refinedContent: this.fallbackRefine(item.content),
      }));
    }

    try {
      const prompt = buildEmotionRefinePrompt(items);

      const completion = await this.openai.chat.completions.create({
        model: this.modelName,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        response_format: { type: 'json_object' },
      });

      const responseText = completion.choices[0]?.message?.content || '{}';
      const parsed = JSON.parse(responseText);

      // Expected format: { "results": [{ "id": "...", "refinedContent": "..." }] }
      const results: RefinedResultItem[] = parsed.results || [];

      if (results.length > 0) {
        return results;
      }

      // Fallback if parsing failed
      this.logger.warn('OpenAI returned unexpected format, using fallback');
      return items.map((item) => ({
        id: item.id,
        refinedContent: this.fallbackRefine(item.content),
      }));
    } catch (err: any) {
      this.logger.error(`Error calling OpenAI API for emotion refinement: ${err.message}`, err.stack);
      return items.map((item) => ({
        id: item.id,
        refinedContent: this.fallbackRefine(item.content),
      }));
    }
  }

  /**
   * Fallback refiner for dev/testing when API key is unconfigured
   */
  private fallbackRefine(raw: string): string {
    return (
      'Aku merasa perlu mengungkapkan apa yang aku rasakan: "' +
      raw.trim() +
      '". Aku berharap kita bisa membicarakan ini dengan tenang demi kebaikan hubungan kita.'
    );
  }
}
