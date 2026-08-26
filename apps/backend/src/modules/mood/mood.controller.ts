import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { MoodService } from './mood.service';
import { CreateMoodDto, UpdateMoodDto } from './dto';
import { CurrentUser } from '../../shared/decorators';

@ApiTags('Mood (Daily Layer)')
@ApiBearerAuth('access-token')
@Controller('mood')
export class MoodController {
  constructor(private readonly moodService: MoodService) {}

  @Post()
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @ApiOperation({ summary: 'Buat log mood harian baru' })
  @ApiResponse({ status: 201, description: 'Log mood berhasil dibuat' })
  async create(
    @CurrentUser() user: any,
    @Body() dto: CreateMoodDto,
  ) {
    const data = await this.moodService.create(user.id, dto);
    return { message: 'Log mood berhasil dibuat', data };
  }

  @Get()
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  @ApiOperation({ summary: 'Ambil daftar log mood milik sendiri' })
  @ApiResponse({ status: 200, description: 'Daftar log mood' })
  async findAll(@CurrentUser() user: any, @Query() query: any) {
    return this.moodService.findAllForUser(user.id, query.page, query.limit, query.startDate, query.endDate);
  }

  @Get('partner')
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @ApiOperation({ summary: 'Ambil daftar log mood pasangan' })
  @ApiResponse({ status: 200, description: 'Daftar log mood pasangan' })
  async findForPartner(@CurrentUser() user: any, @Query() query: any) {
    return this.moodService.findForPartner(user.id, query.page, query.limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Ambil detail 1 log mood' })
  @ApiResponse({ status: 200, description: 'Detail log mood' })
  @ApiResponse({ status: 404, description: 'Log mood tidak ditemukan' })
  async findOne(@CurrentUser() user: any, @Param('id', ParseUUIDPipe) id: string) {
    return this.moodService.findOneForUser(user.id, id);
  }

  @Patch(':id')
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @ApiOperation({ summary: 'Update log mood' })
  @ApiResponse({ status: 200, description: 'Log mood berhasil diperbarui' })
  async update(
    @CurrentUser() user: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMoodDto,
  ) {
    const data = await this.moodService.updateForUser(user.id, id, dto);
    return { message: 'Log mood berhasil diperbarui', data };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @ApiOperation({ summary: 'Hapus log mood' })
  @ApiResponse({ status: 200, description: 'Log mood berhasil dihapus' })
  async remove(@CurrentUser() user: any, @Param('id', ParseUUIDPipe) id: string) {
    return this.moodService.deleteForUser(user.id, id);
  }
}