import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Sse,
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
import { Observable } from 'rxjs';
import { TodoService } from './todo.service';
import { AuthService } from '../auth/auth.service';
import { SseService } from '../../infrastructure/sse';
import { CreateTodoDto, UpdateTodoDto } from './dto';
import { CurrentUser, Public } from '../../shared/decorators';

@ApiTags('To-do List (Daily Layer)')
@ApiBearerAuth('access-token')
@Controller('todos')
export class TodoController {
  constructor(
    private readonly todoService: TodoService,
    private readonly authService: AuthService,
    private readonly sseService: SseService,
  ) {}

  @Public()
  @Sse('events')
  @ApiOperation({ summary: 'Stream SSE realtime event untuk tugas & aktivitas couple' })
  @ApiQuery({ name: 'ticket', description: 'Single-use SSE ticket dari POST /auth/sse-ticket' })
  sseEvents(@Query('ticket') ticket: string): Observable<any> {
    const { coupleId } = this.authService.validateAndConsumeSseTicket(ticket);
    return this.sseService.subscribe(coupleId);
  }

  @Post()
  @ApiOperation({ summary: 'Buat tugas bersama baru' })
  @ApiResponse({ status: 201, description: 'Tugas berhasil dibuat' })
  async create(@CurrentUser() user: any, @Body() dto: CreateTodoDto) {
    const data = await this.todoService.create(user.id, dto);
    return { message: 'Tugas bersama berhasil dibuat', data };
  }

  @Get()
  @ApiOperation({ summary: 'Ambil seluruh tugas bersama pasangan' })
  async findAll(@CurrentUser() user: any) {
    return this.todoService.findAllForCouple(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Ambil detail 1 tugas bersama' })
  async findOne(@CurrentUser() user: any, @Param('id', ParseUUIDPipe) id: string) {
    const data = await this.todoService.findOneForCouple(user.id, id);
    return { data };
  }

  @Patch(':id/toggle')
  @ApiOperation({ summary: 'Toggle status tugas (PENDING <-> COMPLETED)' })
  async toggleStatus(@CurrentUser() user: any, @Param('id', ParseUUIDPipe) id: string) {
    const data = await this.todoService.toggleStatus(user.id, id);
    return { message: 'Status tugas berhasil diperbarui', data };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update detail tugas bersama' })
  async update(
    @CurrentUser() user: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTodoDto,
  ) {
    const data = await this.todoService.update(user.id, id, dto);
    return { message: 'Tugas berhasil diperbarui', data };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Hapus tugas bersama' })
  async remove(@CurrentUser() user: any, @Param('id', ParseUUIDPipe) id: string) {
    return this.todoService.delete(user.id, id);
  }
}
