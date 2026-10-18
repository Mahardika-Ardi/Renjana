import { Controller, Get, Post } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { StreakService } from './streak.service';
import { CurrentUser } from '../../shared/decorators';

@ApiTags('Streak (Daily Layer)')
@ApiBearerAuth('access-token')
@Controller('streak')
export class StreakController {
  constructor(private readonly streakService: StreakService) {}

  @Get()
  @ApiOperation({
    summary:
      'Ambil streak terkini, riwayat 14 hari, dan status senggol hari ini',
  })
  @ApiResponse({ status: 200, description: 'Data streak berhasil diambil' })
  async getStreak(@CurrentUser() user: any) {
    const data = await this.streakService.getStreak(user.id);
    return { message: 'Data streak berhasil diambil', data };
  }

  @Post()
  @ApiOperation({
    summary:
      'Aksi streak harian: kirim senggolan atau balas senggolan untuk menambah streak +1',
  })
  @ApiResponse({
    status: 200,
    description:
      'Senggolan dikirim (WAITING_PARTNER) atau streak berhasil +1 (COMPLETED)',
  })
  async triggerStreak(@CurrentUser() user: any) {
    const data = await this.streakService.triggerStreak(user.id);
    return { message: data.message, data };
  }

  @Post('nudge')
  @ApiOperation({
    summary:
      'Kirim senggolan / trigger ke pasangan untuk mengaktifkan streak harian',
  })
  @ApiResponse({ status: 200, description: 'Senggolan berhasil dikirim' })
  async sendNudge(@CurrentUser() user: any) {
    const data = await this.streakService.sendNudge(user.id);
    return { message: data.message, data };
  }

  @Post('nudge/reply')
  @ApiOperation({
    summary:
      'Balas senggolan dari pasangan agar streak resmi terhitung bertambah +1',
  })
  @ApiResponse({
    status: 200,
    description: 'Senggolan berhasil dibalas dan streak +1',
  })
  @ApiResponse({
    status: 400,
    description: 'Tidak ada senggolan yang menunggu balasan',
  })
  async replyNudge(@CurrentUser() user: any) {
    const data = await this.streakService.replyNudge(user.id);
    return { message: data.message, data };
  }
}
