import api from './api';
import type {
  ApiResponse, AuthResult, User, Conversation, PaginatedMessages, Message,
} from '../types';

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
  register: (data: { username: string; email: string; password: string }) =>
    api.post<ApiResponse<AuthResult>>('/auth/register', data),

  login: (data: { email: string; password: string }) =>
    api.post<ApiResponse<AuthResult>>('/auth/login', data),

  logout: (refreshToken: string) =>
    api.post<ApiResponse>('/auth/logout', { refreshToken }),

  me: () => api.get<ApiResponse<User>>('/auth/me'),
};

// ── Users ─────────────────────────────────────────────────────────────────────
export const usersApi = {
  getProfile: (userId?: string) =>
    api.get<ApiResponse<User>>(userId ? `/users/${userId}` : '/users/profile'),

  updateProfile: (formData: FormData) =>
    api.patch<ApiResponse<User>>('/users/profile', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  search: (q: string) =>
    api.get<ApiResponse<User[]>>('/users/search', { params: { q } }),

  blockUser: (userId: string) => api.post<ApiResponse>(`/users/${userId}/block`),
  unblockUser: (userId: string) => api.delete<ApiResponse>(`/users/${userId}/block`),
};

// ── Conversations ─────────────────────────────────────────────────────────────
export const conversationsApi = {
  getAll: () => api.get<ApiResponse<Conversation[]>>('/conversations'),

  getOrCreateDirect: (userId: string) =>
    api.get<ApiResponse<Conversation>>(`/conversations/direct/${userId}`),

  createGroup: (data: { name: string; participantIds: string[] }) =>
    api.post<ApiResponse<Conversation>>('/conversations/group', data),

  getById: (id: string) =>
    api.get<ApiResponse<Conversation>>(`/conversations/${id}`),

  updateGroup: (id: string, data: { groupName?: string }) =>
    api.patch<ApiResponse<Conversation>>(`/conversations/${id}`, data),

  addParticipants: (id: string, userIds: string[]) =>
    api.post<ApiResponse<Conversation>>(`/conversations/${id}/participants`, { userIds }),

  removeParticipant: (id: string, userId: string) =>
    api.delete<ApiResponse<Conversation>>(`/conversations/${id}/participants/${userId}`),

  leave: (id: string) =>
    api.delete<ApiResponse>(`/conversations/${id}/leave`),
};

// ── Messages ──────────────────────────────────────────────────────────────────
export const messagesApi = {
  getMessages: (conversationId: string, cursor?: string) =>
    api.get<ApiResponse<PaginatedMessages>>(
      `/conversations/${conversationId}/messages`,
      { params: cursor ? { cursor } : {} }
    ),

  sendMessage: (conversationId: string, formData: FormData) =>
    api.post<ApiResponse<Message>>(
      `/conversations/${conversationId}/messages`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    ),

  markRead: (conversationId: string) =>
    api.post<ApiResponse>(`/conversations/${conversationId}/messages/read`),

  editMessage: (conversationId: string, messageId: string, content: string) =>
    api.patch<ApiResponse<Message>>(
      `/conversations/${conversationId}/messages/${messageId}`,
      { content }
    ),

  deleteForMe: (conversationId: string, messageId: string) =>
    api.delete(`/conversations/${conversationId}/messages/${messageId}/me`),

  deleteForEveryone: (conversationId: string, messageId: string) =>
    api.delete(`/conversations/${conversationId}/messages/${messageId}/all`),

  searchMessages: (conversationId: string, q: string) =>
    api.get<ApiResponse<Message[]>>(
      `/conversations/${conversationId}/messages/search`,
      { params: { q } }
    ),
};
