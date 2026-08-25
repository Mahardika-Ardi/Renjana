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
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { HabitService } from './habit.service';
import {
  CreateHabitTemplateDto,
  UpdateHabitTemplateDto,
  CreateHabitLogDto,
  UpdateHabitLogDto,
} from './dto';
import { CurrentUser } from '../../shared/decorators';

@ApiTags('Habit (Daily Layer)')
@ApiBearerAuth('access-token')
@Controller('habit')
export class HabitController {
  constructor(private readonly habitService: HabitService) {}

  @Post('template')
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @ApiOperation({ summary: 'Buat habit template baru' })
  @ApiResponse({ status: 201, description: 'Habit template berhasil dibuat' })
  async createTemplate(
    @CurrentUser() user: any,
    @Body() dto: CreateHabitTemplateDto,
  ) {
    const data = await this.habitService.createTemplate(user.id, dto);
    return { message: 'Habit template berhasil dibuat', data };
  }

  @Get('templates')
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  @ApiOperation({ summary: 'Ambil daftar habit template milik sendiri' })
  @ApiResponse({ status: 200, description: 'Daftar habit template' })
  async findAllTemplates(
    @CurrentUser() user: any,
    @Query() query: any,
  ) {
    return this.habitService.findAllTemplates(user.id, query.page, query.limit);
  }

  @Get('templates/active')
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @ApiOperation({ summary: 'Ambil habit template aktif' })
  @ApiResponse({ status: 200, description: 'Daftar habit template aktif' })
  async findActiveTemplates(@CurrentUser() user: any) {
    return this.habitService.findActiveTemplates(user.id);
  }

  @Get('templates/:id')
  @ApiOperation({ summary: 'Ambil 1 habit template' })
  @ApiResponse({ status: 200, description: 'Detail habit template' })
  @ApiResponse({ status: 404, description: 'Habit template tidak ditemukan' })
  async findOneTemplate(
    @CurrentUser() user: any,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.habitService.findOneTemplate(user.id, id);
  }

  @Patch('templates/:id')
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @ApiOperation({ summary: 'Update habit template' })
  @ApiResponse({ status: 200, description: 'Habit template berhasil diperbarui' })
  async updateTemplate(
    @CurrentUser() user: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateHabitTemplateDto,
  ) {
    const data = await this.habitService.updateTemplate(user.id, id, dto);
    return { message: 'Habit template berhasil diperbarui', data };
  }

  @Delete('templates/:id')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @ApiOperation({ summary: 'Non-aktifkan habit template' })
  @ApiResponse({ status: 200, description: 'Habit template berhasil dinon-aktifkan' })
  async deleteTemplate(
    @CurrentUser() user: any,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.habitService.deleteTemplate(user.id, id);
  }

  @Post('log')
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @ApiOperation({ summary: 'Buat log habit harian' })
  @ApiResponse({ status: 201, description: 'Log habit berhasil dibuat' })
  async createLog(
    @CurrentUser() user: any,
    @Body() dto: CreateHabitLogDto,
  ) {
    const data = await this.habitService.createLog(user.id, dto);
    return { message: 'Log habit berhasil dibuat', data };
  }

  @Get('logs')
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  @ApiOperation({ summary: 'Ambil daftar log habit milik sendiri' })
  @ApiResponse({ status: 200, description: 'Daftar log habit' })
  async findAllLogs(
    @CurrentUser() user: any,
    @Query()
    query: any,
  ) {
    return this.habitService.findAllLogs(
      user.id,
      query.page,
      query.limit,
      query.habitTemplateId,
      query.startDate,
      query.endDate,
    );
  }

  @Get('logs/:id')
  @ApiOperation({ summary: 'Ambil 1 log habit' })
  @ApiResponse({ status: 200, description: 'Detail log habit' })
  @ApiResponse({ status: 404, description: 'Log habit tidak ditemukan' })
  async findOneLog(@CurrentUser() user: any, @Param('id', ParseUUIDPipe) id: string) {
    return this.habitService.findOneLog(user.id, id);
  }

  @Patch('logs/:id')
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @ApiOperation({ summary: 'Toggle status log habit' })
  @ApiResponse({ status: 200, description: 'Log habit berhasil diperbarui' })
  async updateLog(
    @CurrentUser() user: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateHabitLogDto,
  ) {
    const data = await this.habitService.updateLog(user.id, id, dto);
    return { message: 'Log habit berhasil diperbarui', data };
  }

  @Delete('logs/:id')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @ApiOperation({ summary: 'Hapus log habit' })
  @ApiResponse({ status: 200, description: 'Log habit berhasil dihapus' })
  async removeLog(@CurrentUser() user: any, @Param('id', ParseUUIDPipe) id: string) {
    return this.habitService.deleteLog(user.id, id);
  }
}