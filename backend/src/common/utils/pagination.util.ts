export interface PaginationQuery {
  page?: number;
  limit?: number;
}

export function paginate(query: PaginationQuery) {
  const page = Math.max(1, query.page || 1);
  const limit = Math.min(100, query.limit || 20);
  const skip = (page - 1) * limit;
  return { skip, take: limit, page, limit };
}

export function paginatedResponse<T>(data: T[], total: number, page: number, limit: number) {
  return {
    items: data,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}
