import {
  ApiResponse,
  CreateJournalDto,
  DeletedResponse,
  JournalQueryParams,
  JournalResponse,
  ObjectJournalResponse,
  UpdateJournalDto,
} from '@renjana/types';
import { api } from './client';
import { JOURNAL_BASE_URL } from '../constants/url';

export const journalApi = {
  create(dto: CreateJournalDto) {
    return api.post<ApiResponse<JournalResponse>>(`${JOURNAL_BASE_URL}`, dto);
  },

  getAll(query?: JournalQueryParams) {
    const params = new URLSearchParams();

    if (query?.page) params.append('page', String(query.page));
    if (query?.limit) params.append('limit', String(query.limit));
    if (query?.startDate) params.append('startDate', query.startDate);
    if (query?.endDate) params.append('endDate', query.endDate);

    const queryString = params.toString();
    const url = queryString
      ? `${JOURNAL_BASE_URL}?${queryString}`
      : JOURNAL_BASE_URL;

    return api.get<ApiResponse<ObjectJournalResponse>>(url);
  },

  getAllPartner(query: JournalQueryParams) {
    const params = new URLSearchParams();

    if (query?.page) params.append('page', String(query.page));
    if (query?.limit) params.append('limit', String(query.limit));

    const queryString = params.toString();
    const url = queryString
      ? `${JOURNAL_BASE_URL}?${queryString}`
      : JOURNAL_BASE_URL;

    return api.get<ApiResponse<ObjectJournalResponse>>(url);
  },

  getById(id: string) {
    return api.get<ApiResponse<JournalResponse>>(`${JOURNAL_BASE_URL}/${id}`);
  },

  update(dto: UpdateJournalDto, id: string) {
    return api.patch<ApiResponse<JournalResponse>>(
      `${JOURNAL_BASE_URL}/${id}`,
      dto,
    );
  },

  delete(id: string) {
    return api.delete<ApiResponse<DeletedResponse>>(
      `${JOURNAL_BASE_URL}/${id}`,
    );
  },
};
