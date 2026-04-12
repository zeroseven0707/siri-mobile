import { create } from 'zustand';

type OrderStatus = 'pending' | 'accepted' | 'on_progress' | 'completed' | 'cancelled';

interface OrderState {
  activeTab: OrderStatus;
  setActiveTab: (tab: OrderStatus) => void;
}

export const useOrderStore = create<OrderState>((set) => ({
  activeTab: 'accepted', // Default
  setActiveTab: (tab) => set({ activeTab: tab }),
}));
