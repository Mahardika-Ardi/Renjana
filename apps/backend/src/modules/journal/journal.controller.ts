import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpStatus,
  HttpCode,
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
import { JournalService } from './journal.service';
import { CreateJournalDto, UpdateJournalDto } from './dto';
import { CurrentUser } from '../../shared/decorators';

@ApiTags('Journal (Daily Layer)')
@ApiBearerAuth('access-token')
@Controller('journal')
export class JournalController {
  constructor(private readonly journalService: JournalService) {}

  @Post()
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @ApiOperation({ summary: 'Buat catatan jurnal pribadi baru' })
  @ApiResponse({ status: 201, description: 'Jurnal berhasil dibuat' })
  async create(@CurrentUser() user: any, @Body() dto: CreateJournalDto) {
    const data = await this.journalService.create(user.id, dto);
    return { message: 'Jurnal berhasil dibuat', data };
  }

  @Get()
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  @ApiOperation({ summary: 'Ambil daftar jurnal pribadi milik sendiri' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiQuery({ name: 'startDate', required: false, example: '2026-08-01' })
  @ApiQuery({ name: 'endDate', required: false, example: '2026-08-31' })
  async findAll(
    @CurrentUser() user: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.journalService.findAllForUser(
      user.id,
      page ? Number(page) : 1,
      limit ? Number(limit) : 20,
      startDate,
      endDate,
    );
  }

  @Get('partner')
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @ApiOperation({ summary: 'Ambil daftar jurnal pasangan yang dishare' })
  @ApiResponse({ status: 200, description: 'Daftar jurnal pasangan yang dishare (paginated)' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  async findForPartner(
    @CurrentUser() user: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.journalService.findForPartner(
      user.id,
      page ? Number(page) : 1,
      limit ? Number(limit) : 20,
    );
  }

  @Get(':id')
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  @ApiOperation({ summary: 'Ambil detail 1 jurnal pribadi' })
  @ApiResponse({ status: 200, description: 'Detail jurnal' })
  @ApiResponse({ status: 404, description: 'Jurnal tidak ditemukan' })
  async findOne(@CurrentUser() user: any, @Param('id', ParseUUIDPipe) id: string) {
    const data = await this.journalService.findOneForUser(user.id, id);
    return { data };
  }

  @Patch(':id')
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @ApiOperation({ summary: 'Update jurnal pribadi (termasuk toggle status shared)' })
  @ApiResponse({ status: 200, description: 'Jurnal berhasil diperbarui' })
  async update(
    @CurrentUser() user: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateJournalDto,
  ) {
    const data = await this.journalService.updateForUser(user.id, id, dto);
    return { message: 'Jurnal berhasil diperbarui', data };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @ApiOperation({ summary: 'Hapus jurnal pribadi' })
  @ApiResponse({ status: 200, description: 'Jurnal berhasil dihapus' })
  async remove(@CurrentUser() user: any, @Param('id', ParseUUIDPipe) id: string) {
    return this.journalService.deleteForUser(user.id, id);
  }
}
