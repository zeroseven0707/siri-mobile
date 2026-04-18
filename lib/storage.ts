const STORAGE_URL = process.env.EXPO_PUBLIC_STORAGE_URL;

export function storageUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith('http') || path.startsWith('file://')) return path;
  return STORAGE_URL + path;
}
