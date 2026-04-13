import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// Take the API URL from the environment variable (.env)
export const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://duniakarya.store/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
  timeout: 10000,
});

// Attach token to every request
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('auth_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Normalize error responses
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const data = error.response?.data;
    let message: string;

    if (data?.errors && typeof data.errors === 'object') {
      // Ambil pesan pertama dari errors object
      message = (Object.values(data.errors).flat() as string[])[0] || data.message || 'Terjadi kesalahan';
    } else {
      message = data?.message || error.message || 'Something went wrong';
    }

    return Promise.reject(new Error(message));
  }
);

export default api;
