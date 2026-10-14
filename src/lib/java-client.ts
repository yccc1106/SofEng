import type { ApiResponse } from '@/types/api';

/** 统一读取 Java API 的 data 字段，失败时交给页面处理错误提示。 */
export async function javaRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/java${path}`, init);
  const result: ApiResponse<T> = await response.json();
  if (!response.ok || !result.success || result.data === undefined) {
    throw new Error(result.message || 'Request failed');
  }
  return result.data;
}

export async function javaAction(path: string, init?: RequestInit): Promise<void> {
  const response = await fetch(`/java${path}`, init);
  const result: ApiResponse<unknown> = await response.json();
  if (!response.ok || !result.success) throw new Error(result.message || 'Request failed');
}

/** 将 Java 分页响应转换为后台表格需要的数据和总数。 */
export async function javaPage<T>(path: string): Promise<{ data: T[]; total: number }> {
  const response = await fetch(`/java${path}`);
  const result: ApiResponse<T[]> & { pagination?: { total: number } } = await response.json();
  if (!response.ok || !result.success || !Array.isArray(result.data) || !result.pagination) {
    throw new Error(result.message || 'Request failed');
  }
  return { data: result.data, total: result.pagination.total };
}
