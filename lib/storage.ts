const STORAGE_URL = 'https://duniakarya.store/storage/';

export function storageUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return STORAGE_URL + path;
}
