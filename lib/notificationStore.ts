import { create } from 'zustand';

interface NotificationState {
  unreadCount: number;
  refreshKey: number; // Kunci untuk memicu refresh di halaman notifikasi
  setUnreadCount: (count: number) => void;
  incrementCount: () => void;
  decrementCount: () => void;
  clearCount: () => void;
  triggerRefresh: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  unreadCount: 0,
  refreshKey: 0,
  setUnreadCount: (count) => set({ unreadCount: count }),
  incrementCount: () => set((state) => ({ unreadCount: state.unreadCount + 1 })),
  decrementCount: () => set((state) => ({ unreadCount: Math.max(0, state.unreadCount - 1) })),
  clearCount: () => set({ unreadCount: 0 }),
  triggerRefresh: () => set((state) => ({ refreshKey: state.refreshKey + 1 })),
}));
