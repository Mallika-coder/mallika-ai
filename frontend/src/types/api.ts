export interface ApiResponse<T> {
  data: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
}

export interface Model {
  id: string;
  name: string;
  provider: string;
  description: string;
}

export interface Space {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  created_at: string;
}

export interface FileUploadResponse {
  id: string;
  filename: string;
  mime_type: string;
  size: number;
  path: string;
}
