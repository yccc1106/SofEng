import { NextResponse } from 'next/server';

// ============ 统一 API 响应类型 ============

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  details?: unknown;
}

export interface PaginatedApiResponse<T> extends ApiResponse<T> {
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// ============ 响应工厂函数 ============

/**
 * 成功响应
 */
export function successResponse<T>(
  data: T,
  message: string = 'Success'
): NextResponse<ApiResponse<T>> {
  return NextResponse.json({
    success: true,
    message,
    data,
  });
}

/**
 * 成功响应（带分页）
 */
export function paginatedResponse<T>(
  data: T,
  page: number,
  pageSize: number,
  total: number
): NextResponse<PaginatedApiResponse<T>> {
  return NextResponse.json({
    success: true,
    message: 'Success',
    data,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  });
}

/**
 * 错误响应
 */
export function errorResponse(
  message: string,
  statusCode: number = 500,
  details?: unknown
): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      message,
      error: message,
      details,
    },
    { status: statusCode }
  );
}

// ============ HTTP 状态码快捷函数 ============

export function badRequestResponse(message: string = 'Bad Request'): NextResponse<ApiResponse> {
  return errorResponse(message, 400);
}

export function unauthorizedResponse(message: string = 'Unauthorized'): NextResponse<ApiResponse> {
  return errorResponse(message, 401);
}

export function forbiddenResponse(message: string = 'Forbidden'): NextResponse<ApiResponse> {
  return errorResponse(message, 403);
}

export function notFoundResponse(message: string = 'Resource not found'): NextResponse<ApiResponse> {
  return errorResponse(message, 404);
}

export function internalServerErrorResponse(
  message: string = 'Internal server error',
  details?: unknown
): NextResponse<ApiResponse> {
  return errorResponse(message, 500, details);
}
