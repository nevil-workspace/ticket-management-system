import axios, { AxiosResponse, AxiosError } from 'axios';
import { io as socketio } from 'socket.io-client';

// Create axios instance with default config
const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Handle unauthorized - redirect to login
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

// Generic API response type (unused but kept for future use)
// interface ApiResponse<T = any> {
//   data: T;
//   message?: string;
// }

// Error response type
interface ApiError {
  message: string;
  status?: number;
}

// API service class
class ApiService {
  // Generic request method
  private async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
    url: string,
    data?: any,
  ): Promise<T> {
    try {
      const response = await api.request({
        method,
        url,
        data,
      });
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<ApiError>;
      const errorMessage =
        axiosError.response?.data?.message || axiosError.message || 'An error occurred';
      throw new Error(errorMessage);
    }
  }

  // GET request
  async get<T>(url: string): Promise<T> {
    return this.request<T>('GET', url);
  }

  // POST request
  async post<T>(url: string, data?: any): Promise<T> {
    return this.request<T>('POST', url, data);
  }

  // PUT request
  async put<T>(url: string, data?: any): Promise<T> {
    return this.request<T>('PUT', url, data);
  }

  // DELETE request
  async delete<T>(url: string): Promise<T> {
    return this.request<T>('DELETE', url);
  }

  // PATCH request
  async patch<T>(url: string, data?: any): Promise<T> {
    return this.request<T>('PATCH', url, data);
  }
}

// Create singleton instance
export const apiService = new ApiService();

// Specific API methods for better type safety
export const authAPI = {
  register: (data: { email: string; password: string; name: string }) =>
    apiService.post<{ token: string; user: any }>('/auth/register', data),

  login: (data: { email: string; password: string }) =>
    apiService.post<{ token: string; user: any }>('/auth/login', data),

  getCurrentUser: () => apiService.get<any>('/auth/me'),

  googleAuth: (data: { credential: string }) =>
    apiService.post<{ token: string; user: any }>('/auth/google', data),
};

export const boardAPI = {
  getBoards: () => apiService.get<any[]>('/boards'),

  getBoard: (id: string) => apiService.get<any>(`/boards/${id}`),

  createBoard: (data: { name: string; description?: string; memberIds?: string[] }) =>
    apiService.post<any>('/boards', data),

  updateBoard: (id: string, data: { name?: string; description?: string; memberIds?: string[] }) =>
    apiService.put<any>(`/boards/${id}`, data),

  deleteBoard: (id: string) => apiService.delete<{ message: string }>(`/boards/${id}`),

  // Column management
  createColumn: (boardId: string, data: { name: string }) =>
    apiService.post<any>(`/boards/${boardId}/columns`, data),

  updateColumn: (boardId: string, columnId: string, data: { name?: string; order?: number }) =>
    apiService.put<any>(`/boards/${boardId}/columns/${columnId}`, data),

  deleteColumn: (boardId: string, columnId: string) =>
    apiService.delete<{ message: string }>(`/boards/${boardId}/columns/${columnId}`),

  reorderColumns: (boardId: string, data: { columnIds: string[] }) =>
    apiService.put<{ message: string }>(`/boards/${boardId}/columns/reorder`, data),
};

export const ticketAPI = {
  getTickets: (
    boardId: string,
    filters?: {
      q?: string;
      priority?: string;
      status?: string;
      assigneeId?: string;
    },
  ) => {
    let url = `/tickets/board/${boardId}`;
    if (filters) {
      const params = new URLSearchParams();
      if (filters.q) params.append('q', filters.q);
      if (filters.priority) params.append('priority', filters.priority);
      if (filters.status) params.append('status', filters.status);
      if (filters.assigneeId) params.append('assigneeId', filters.assigneeId);
      const qs = params.toString();
      if (qs) url += `?${qs}`;
    }
    return apiService.get<any[]>(url);
  },

  getTicket: (id: string) => apiService.get<any>(`/tickets/${id}`),

  createTicket: (data: {
    title: string;
    description?: string;
    priority?: string;
    boardId: string;
    assigneeId?: string;
  }) => apiService.post<any>('/tickets', data),

  updateTicket: (
    id: string,
    data: {
      title?: string;
      description?: string;
      priority?: string;
      columnId?: string;
      assigneeId?: string;
    },
  ) => apiService.put<any>(`/tickets/${id}`, data),

  deleteTicket: (id: string) => apiService.delete<{ message: string }>(`/tickets/${id}`),

  addComment: (ticketId: string, data: { content: string }) =>
    apiService.post<any>(`/tickets/${ticketId}/comments`, data),
  editComment: (ticketId: string, commentId: string, data: { content: string }) =>
    apiService.put<any>(`/tickets/${ticketId}/comments/${commentId}`, data),
  deleteComment: (ticketId: string, commentId: string) =>
    apiService.delete<{ message: string }>(`/tickets/${ticketId}/comments/${commentId}`),
  searchTickets: (q: string) => apiService.get<any[]>(`/tickets/search?q=${encodeURIComponent(q)}`),
  addWatcher: (ticketId: string) => apiService.post<any>(`/tickets/${ticketId}/watchers`),
  removeWatcher: (ticketId: string) => apiService.delete<any>(`/tickets/${ticketId}/watchers`),
};

export const userAPI = {
  listUsers: () => apiService.get<any[]>('/auth/users'),
  editUser: (data: FormData) =>
    api.put<any>('/auth/me', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

export const notificationAPI = {
  getNotifications: (page = 1, pageSize = 20) =>
    apiService.get<any[]>(`/auth/notifications?page=${page}&pageSize=${pageSize}`),
  markAllRead: () => apiService.patch<{ message: string }>(`/auth/notifications/read`),
  markRead: (id: string) => apiService.patch<{ message: string }>(`/auth/notifications/${id}/read`),
};

const getSocketUrl = () => {
  const socketUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  return socketUrl;
};

export const socket = socketio(getSocketUrl(), {
  autoConnect: false,
  transports: ['websocket'],
});

export default apiService;
