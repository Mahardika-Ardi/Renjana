import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { EmotionDumpService } from './emotion-dump.service';
import { CreateEmotionDumpDto, UpdateEmotionDumpDto } from './dto';
import { CurrentUser } from '../../shared/decorators';
import { EmotionDumpStatus } from '@prisma/client';

@ApiTags('Emotion Dump (Daily Layer)')
@ApiBearerAuth('access-token')
@Controller('emotion-dumps')
export class EmotionDumpController {
  constructor(private readonly emotionDumpService: EmotionDumpService) {}

  @Post()
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @ApiOperation({ summary: 'Buat Emotion Dump (curahan emosi mentah) baru' })
  @ApiResponse({ status: 201, description: 'Emotion Dump berhasil dibuat' })
  async create(@CurrentUser() user: any, @Body() dto: CreateEmotionDumpDto) {
    const data = await this.emotionDumpService.create(user.id, dto);
    return { message: 'Emotion Dump berhasil dibuat (Status: PRIVATE)', data };
  }

  @Get()
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  @ApiOperation({ summary: 'Ambil daftar Emotion Dump milik sendiri' })
  @ApiQuery({ name: 'weekNumber', required: false, example: 31 })
  @ApiQuery({ name: 'weekYear', required: false, example: 2026 })
  @ApiQuery({ name: 'status', required: false, enum: EmotionDumpStatus })
  async findAll(
    @CurrentUser() user: any,
    @Query('weekNumber') weekNumber?: number,
    @Query('weekYear') weekYear?: number,
    @Query('status') status?: EmotionDumpStatus,
  ) {
    return this.emotionDumpService.findAllForUser(
      user.id,
      weekNumber,
      weekYear,
      status,
    );
  }

  @Get('partner')
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @ApiOperation({ summary: 'Ambil daftar Emotion Dump pasangan yang berstatus SHARED' })
  @ApiResponse({ status: 200, description: 'Daftar emotion dump pasangan yang SHARED (paginated)' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  async findForPartner(
    @CurrentUser() user: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.emotionDumpService.findForPartner(
      user.id,
      page ? Number(page) : 1,
      limit ? Number(limit) : 20,
    );
  }

  @Get(':id')
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  @ApiOperation({ summary: 'Ambil detail 1 Emotion Dump milik sendiri' })
  @ApiResponse({ status: 200, description: 'Detail emotion dump' })
  @ApiResponse({ status: 404, description: 'Emotion dump tidak ditemukan' })
  async findOne(@CurrentUser() user: any, @Param('id', ParseUUIDPipe) id: string) {
    const data = await this.emotionDumpService.findOneForUser(user.id, id);
    return { data };
  }

  @Patch(':id')
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @ApiOperation({
    summary: 'Update status Emotion Dump (misal: REFINED -> SHARED atau REFINED -> PRIVATE)',
  })
  @ApiResponse({ status: 200, description: 'Status berhasil diperbarui' })
  @ApiResponse({ status: 400, description: 'Transisi status tidak valid' })
  async update(
    @CurrentUser() user: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateEmotionDumpDto,
  ) {
    const data = await this.emotionDumpService.updateForUser(user.id, id, dto);
    return { message: 'Status Emotion Dump berhasil diperbarui', data };
  }
}
