export type ApiSuccess<T> = {
  data: T;
  error: null;
};

export type ApiError = {
  data: null;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

export type ApiResponse<T> = ApiSuccess<T> | ApiError;
