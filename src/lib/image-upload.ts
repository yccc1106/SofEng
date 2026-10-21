import type { ApiResponse } from '@/types/api';

export type ImageUploadScope = 'chat' | 'post' | 'team';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const SUPPORTED_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']);

export function validateImageFile(file: File): string | null {
  if (!SUPPORTED_TYPES.has(file.type.toLowerCase())) {
    return 'Only image files are supported';
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return 'Image must be smaller than 5MB';
  }
  return null;
}

/** Upload a local image through the Java backend and return its persisted access URL. */
export async function uploadImage(file: File, scope: ImageUploadScope): Promise<string> {
  const validationError = validateImageFile(file);
  if (validationError) throw new Error(validationError);

  const form = new FormData();
  form.append('file', file);
  const response = await fetch(`/java/uploads/${scope}-image`, {
    method: 'POST',
    body: form,
  });
  const result: ApiResponse<{ url: string }> = await response.json();
  if (!response.ok || !result.success || !result.data?.url) {
    throw new Error(result.message || 'Image upload failed');
  }
  return result.data.url;
}
