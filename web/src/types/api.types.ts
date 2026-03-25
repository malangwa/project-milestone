export interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  search?: string;
}
