import 'server-only';

export type JavaCategory = {
  id: string;
  name: string;
  parentId: string | null;
  description: string | null;
  usageCount: number;
};

const backend = process.env.JAVA_BACKEND_URL || 'http://localhost:8080';

export async function getCategories(): Promise<JavaCategory[]> {
  const response = await fetch(`${backend}/api/category`, { cache: 'no-store' });
  if (!response.ok) throw new Error('Failed to load categories');
  const result = await response.json();
  if (!result.success || !Array.isArray(result.data)) throw new Error('Invalid category response');
  return result.data;
}

export async function getCategory(id: string): Promise<JavaCategory | null> {
  const response = await fetch(`${backend}/api/category/${encodeURIComponent(id)}`, { cache: 'no-store' });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error('Failed to load category');
  const result = await response.json();
  if (!result.success) throw new Error('Invalid category response');
  return result.data;
}
