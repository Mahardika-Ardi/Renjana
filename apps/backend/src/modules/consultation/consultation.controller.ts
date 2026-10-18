import {
  Controller,
  Post,
  Get,
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
import { ConsultationService } from './consultation.service';
import { CreateConsultationDto, SendMessageDto } from './dto';
import { CurrentUser } from '../../shared/decorators';

@ApiTags('Consultation (Relationship AI Counselor)')
@ApiBearerAuth('access-token')
@Controller('consultations')
export class ConsultationController {
  constructor(private readonly consultationService: ConsultationService) {}

  @Post()
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @ApiOperation({
    summary: 'Mulai sesi konsultasi AI baru & kirimkan pesan curhat awal',
    description:
      'Konselor AI Renjana akan mendengarkan, memvalidasi emosi, menganalisis kemungkinan sudut pandang pasangan, dan memberikan saran komunikasi konkret.',
  })
  @ApiResponse({
    status: 201,
    description: 'Sesi konsultasi berhasil dibuat dan direspon oleh AI',
  })
  async createSession(
    @CurrentUser() user: any,
    @Body() dto: CreateConsultationDto,
  ) {
    const data = await this.consultationService.createSession(user.id, dto);
    return {
      message: 'Sesi konsultasi berhasil dibuat',
      data,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Ambil daftar riwayat sesi konsultasi user aktif' })
  @ApiQuery({
    name: 'page',
    required: false,
    example: 1,
    description: 'Nomor halaman',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    example: 20,
    description: 'Jumlah data per halaman',
  })
  @ApiResponse({
    status: 200,
    description: 'Daftar sesi konsultasi berhasil diambil',
  })
  async getUserSessions(
    @CurrentUser() user: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = Math.max(1, parseInt(page || '1', 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit || '20', 10) || 20));
    const result = await this.consultationService.getUserSessions(
      user.id,
      pageNum,
      limitNum,
    );
    return {
      message: 'Daftar sesi konsultasi berhasil diambil',
      ...result,
    };
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Ambil detail percakapan dalam suatu sesi konsultasi',
  })
  @ApiResponse({
    status: 200,
    description: 'Detail sesi konsultasi berhasil diambil',
  })
  @ApiResponse({ status: 404, description: 'Sesi konsultasi tidak ditemukan' })
  @ApiResponse({ status: 403, description: 'Akses ditolak (bukan pemilik sesi)' })
  async getSessionDetail(
    @CurrentUser() user: any,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const data = await this.consultationService.getSessionDetail(user.id, id);
    return {
      message: 'Detail sesi konsultasi berhasil diambil',
      data,
    };
  }

  @Post(':id/messages')
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @ApiOperation({
    summary: 'Kirim pesan balasan / tanggapan ke konselor AI dalam sesi aktif',
  })
  @ApiResponse({
    status: 201,
    description: 'Pesan berhasil dikirim dan direspon oleh konselor AI',
  })
  @ApiResponse({ status: 404, description: 'Sesi konsultasi tidak ditemukan' })
  @ApiResponse({ status: 403, description: 'Akses ditolak (bukan pemilik sesi)' })
  async sendMessage(
    @CurrentUser() user: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SendMessageDto,
  ) {
    const data = await this.consultationService.sendMessage(user.id, id, dto);
    return {
      message: 'Pesan berhasil dikirim dan direspon oleh AI',
      data,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Hapus sesi percakapan konsultasi' })
  @ApiResponse({ status: 200, description: 'Sesi konsultasi berhasil dihapus' })
  @ApiResponse({ status: 404, description: 'Sesi konsultasi tidak ditemukan' })
  @ApiResponse({ status: 403, description: 'Akses ditolak (bukan pemilik sesi)' })
  async deleteSession(
    @CurrentUser() user: any,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const data = await this.consultationService.deleteSession(user.id, id);
    return data;
  }
}
