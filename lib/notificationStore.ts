import { create } from 'zustand';

interface NotificationState {
  unreadCount: number;
  setUnreadCount: (count: number) => void;
  decrementCount: () => void;
  clearCount: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  unreadCount: 0,
  setUnreadCount: (count) => set({ unreadCount: count }),
  decrementCount: () => set((state) => ({ unreadCount: Math.max(0, state.unreadCount - 1) })),
  clearCount: () => set({ unreadCount: 0 }),
}));
