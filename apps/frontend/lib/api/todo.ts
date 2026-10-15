import { api } from './client';
import { TODO_BASE_URL } from '../constants/url';

import type {
  ApiResponse,
  CreateTodoDto,
  DeletedResponse,
  TodoListResponse,
  TodoResponse,
  UpdateTodoDto,
} from '@renjana/types';

export const todoApi = {
  create(dto: CreateTodoDto) {
    return api.post<ApiResponse<TodoResponse>>(`${TODO_BASE_URL}`, dto);
  },

  getAll() {
    return api.get<ApiResponse<TodoListResponse>>(`${TODO_BASE_URL}`);
  },

  getById(id: string) {
    return api.get<ApiResponse<TodoResponse>>(`${TODO_BASE_URL}/${id}`);
  },

  toggle(id: string) {
    return api.patch<ApiResponse<TodoResponse>>(
      `${TODO_BASE_URL}/${id}/toggle`,
    );
  },

  update(dto: UpdateTodoDto, id: string) {
    return api.patch<ApiResponse<TodoResponse>>(
      `${TODO_BASE_URL}/${id}`,
      dto,
    );
  },

  delete(id: string) {
    return api.delete<ApiResponse<DeletedResponse>>(
      `${TODO_BASE_URL}/${id}`,
    );
  },
};
