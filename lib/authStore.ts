import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Application from 'expo-application';
import api from './api';
import { User } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  loadSession: () => Promise<void>;
  updateUser: (updatedData: Partial<User>) => Promise<void>;
}

interface RegisterData {
  name: string;
  email: string;
  phone: string;
  password: string;
  password_confirmation: string;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: true,

  loadSession: async () => {
    try {
      const token = await SecureStore.getItemAsync('auth_token');
      const userJson = await SecureStore.getItemAsync('auth_user');
      if (token && userJson) {
        set({ token, user: JSON.parse(userJson), isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },

  login: async (identifier, password) => {
    const res = await api.post('/login', { 
      identifier, 
      password,
      device: Device.modelName || 'Unknown Device',
      platform: Platform.OS,
      app_version: Application.nativeApplicationVersion || '1.0.0'
    });
    const { user, token } = res.data.data;
    await SecureStore.setItemAsync('auth_token', token);
    await SecureStore.setItemAsync('auth_user', JSON.stringify(user));
    set({ user, token });
  },

  register: async (data) => {
    const res = await api.post('/register', data);
    const { user, token } = res.data.data;
    await SecureStore.setItemAsync('auth_token', token);
    await SecureStore.setItemAsync('auth_user', JSON.stringify(user));
    set({ user, token });
  },

  updateUser: async (updatedData: Partial<User>) => {
    set((state) => {
      if (!state.user) return state;
      const newUser = { ...state.user, ...updatedData };
      SecureStore.setItem('auth_user', JSON.stringify(newUser));
      return { user: newUser };
    });
  },

  logout: async () => {
    try { await api.post('/logout'); } catch {}
    await SecureStore.deleteItemAsync('auth_token');
    await SecureStore.deleteItemAsync('auth_user');
    set({ user: null, token: null });
  },
}));
