export interface ApiErrorBody {
  error: {
    code: string; // stable machine-readable code, e.g. "MENU_PRICE_CHANGED"
    message: string; // safe text a person can read
    details?: unknown[];
    requestId?: string;
  };
}

export interface Paginated<T> {
  data: T[];
  pagination: { page: number; pageSize: number; total: number };
}