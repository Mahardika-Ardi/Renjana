import { Test, TestingModule } from '@nestjs/testing';
import { AiService, EmotionDumpItem, RefinedResultItem } from './ai.service';
import { ConfigService } from '@nestjs/config';

describe('AiService', () => {
  let service: AiService;
  let config: any;

  const mockItems: EmotionDumpItem[] = [
    { id: 'dump-1', content: 'Aku merasa sedih karena pasangan tidak mendengarkan aku' },
    { id: 'dump-2', content: 'Kamu selalu menyalahkan aku untuk segalanya' },
  ];

  const mockRefinedResults: RefinedResultItem[] = [
    { id: 'dump-1', refinedContent: 'Aku merasa sedih ketika aku tidak terdengar. Aku butuh ruang untuk berbagi perasaan.' },
    { id: 'dump-2', refinedContent: 'Aku merasa tersiksa ketika aku selalu mendapat tuduhan. Aku berharap kita bisa saling memahami.' },
  ];

  const createModule = (apiKey: string | null = 'sk-test-key') => {
    config = {
      get: jest.fn((key: string) => {
        if (key === 'openai.apiKey') return apiKey;
        if (key === 'openai.model') return 'gpt-4o-mini';
        return null;
      }),
    };

    return Test.createTestingModule({
      providers: [
        AiService,
        { provide: ConfigService, useValue: config },
      ],
    }).compile();
  };

  beforeEach(async () => {
    jest.clearAllMocks();
  });

  describe('refineEmotionDumps', () => {
    it('should return fallback when OpenAI not configured', async () => {
      const module = await createModule(null);
      const fallbackService = module.get<AiService>(AiService);
      const results = await fallbackService.refineEmotionDumps(mockItems);

      expect(results).toHaveLength(2);
      expect(results[0].id).toBe('dump-1');
      expect(results[0].refinedContent).toContain('Aku merasa perlu mengungkapkan');
    });

    it('should return fallback for empty input', async () => {
      const module = await createModule();
      const service = module.get<AiService>(AiService);
      const results = await service.refineEmotionDumps([]);
      expect(results).toEqual([]);
    });

    it('should call OpenAI and parse results when configured', async () => {
      const module = await createModule();
      const service = module.get<AiService>(AiService);

      // Mock OpenAI client
      const mockCreate = jest.fn().mockResolvedValue({
        choices: [{ message: { content: JSON.stringify({ results: mockRefinedResults }) } }],
      });
      (service as any).openai = {
        chat: { completions: { create: mockCreate } },
      };

      const results = await service.refineEmotionDumps(mockItems);

      expect(results).toEqual(mockRefinedResults);
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gpt-4o-mini',
          temperature: 0.7,
          response_format: { type: 'json_object' },
        }),
      );
    });

    it('should fallback on OpenAI error', async () => {
      const module = await createModule();
      const service = module.get<AiService>(AiService);

      const mockCreate = jest.fn().mockRejectedValue(new Error('API Error'));
      (service as any).openai = {
        chat: { completions: { create: mockCreate } },
      };

      const results = await service.refineEmotionDumps(mockItems);

      expect(results).toHaveLength(2);
      expect(results[0].refinedContent).toContain('Aku merasa perlu mengungkapkan');
    });

    it('should fallback on invalid JSON response', async () => {
      const module = await createModule();
      const service = module.get<AiService>(AiService);

      const mockCreate = jest.fn().mockResolvedValue({
        choices: [{ message: { content: 'not valid json' } }],
      });
      (service as any).openai = {
        chat: { completions: { create: mockCreate } },
      };

      const results = await service.refineEmotionDumps(mockItems);

      expect(results).toHaveLength(2);
      expect(results[0].refinedContent).toContain('Aku merasa perlu mengungkapkan');
    });

    it('should fallback when results array is empty', async () => {
      const module = await createModule();
      const service = module.get<AiService>(AiService);

      const mockCreate = jest.fn().mockResolvedValue({
        choices: [{ message: { content: JSON.stringify({ results: [] }) } }],
      });
      (service as any).openai = {
        chat: { completions: { create: mockCreate } },
      };

      const results = await service.refineEmotionDumps(mockItems);

      expect(results).toHaveLength(2);
      expect(results[0].refinedContent).toContain('Aku merasa perlu mengungkapkan');
    });
  });

  describe('fallbackRefine', () => {
    it('should transform raw content to I-statement format', async () => {
      const module = await createModule();
      const service = module.get<AiService>(AiService);

      const raw = 'Kamu tidak pernah mendengarkan aku';
      const result = (service as any).fallbackRefine(raw);

      expect(result).toContain('Aku merasa perlu mengungkapkan');
      expect(result).toContain(raw);
      expect(result).toContain('berharap kita bisa membicarakan');
    });
  });
});