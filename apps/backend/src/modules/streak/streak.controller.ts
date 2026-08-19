import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { StreakService } from './streak.service';
import { CurrentUser } from '../../shared/decorators';

@ApiTags('Streak (Daily Layer)')
@ApiBearerAuth('access-token')
@Controller('streak')
export class StreakController {
  constructor(private readonly streakService: StreakService) {}

  @Get()
  @ApiOperation({ summary: 'Ambil streak terkini & riwayat 14 hari pasangan' })
  @ApiResponse({ status: 200, description: 'Data streak berhasil diambil' })
  async getStreak(@CurrentUser() user: any) {
    const data = await this.streakService.getStreak(user.id);
    return { message: 'Data streak berhasil diambil', data };
  }
}
