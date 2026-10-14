import type { ApiResponse } from '@/types/api';

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

export async function javaPage<T>(path: string): Promise<{ data: T[]; total: number }> {
  const response = await fetch(`/java${path}`);
  const result: ApiResponse<T[]> & { pagination?: { total: number } } = await response.json();
  if (!response.ok || !result.success || !Array.isArray(result.data) || !result.pagination) {
    throw new Error(result.message || 'Request failed');
  }
  return { data: result.data, total: result.pagination.total };
}
