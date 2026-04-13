import { Tabs } from 'expo-router';
import { Home, Receipt, Bell, User } from 'lucide-react-native';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNotificationStore } from '../../lib/notificationStore';

const GREEN = '#2ECC71';

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const { unreadCount } = useNotificationStore();
  
  // Deteksi: Jika insets.bottom kecil (biasanya < 20), kemungkinan navigasi tombol di Android 
  // atau user pakai gesture tapi butuh sedikit extra space. 
  // Jika besar (seperti di iOS modern), kita pakai nilai safe area aslinya.
  const isButtonNav = Platform.OS === 'android' && insets.bottom <= 0;
  
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: GREEN,
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: '#F3F4F6',
          // Jika pakai tombol (bottom 0), beri padding manual 10. Jika gesture, pakai insets.bottom.
          paddingBottom: isButtonNav ? 10 : (insets.bottom > 0 ? insets.bottom : 8),
          paddingTop: 8,
          // Tinggi dinamis: Dasar 60 + bottom inset (atau 10 utk tombol)
          height: 60 + (isButtonNav ? 10 : insets.bottom),
          backgroundColor: '#fff',
          elevation: 8,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen name="home" options={{ title: 'Beranda', tabBarIcon: ({ color, size }) => <Home size={size} color={color} /> }} />
      <Tabs.Screen name="orders" options={{ title: 'Pesanan', tabBarIcon: ({ color, size }) => <Receipt size={size} color={color} /> }} />
      <Tabs.Screen 
        name="notifications" 
        options={{ 
          title: 'Notifikasi', 
          tabBarIcon: ({ color, size }) => <Bell size={size} color={color} />,
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
          tabBarBadgeStyle: { backgroundColor: '#EF4444', fontSize: 10, marginTop: Platform.OS === 'ios' ? -2 : 0 }
        }} 
      />
      <Tabs.Screen name="profile" options={{ title: 'Akun', tabBarIcon: ({ color, size }) => <User size={size} color={color} /> }} />
    </Tabs>
  );
}
