import { Tabs } from 'expo-router';
import { Home, ClipboardList, Bell, UserCircle2 } from 'lucide-react-native';
import { Platform, View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNotificationStore } from '../../lib/notificationStore';

const GREEN = '#2ECC71';

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const { unreadCount } = useNotificationStore();
  const pb = Platform.OS === 'android' ? 10 : (insets.bottom > 0 ? insets.bottom : 8);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: GREEN,
        tabBarInactiveTintColor: '#B0B8C1',
        tabBarStyle: {
          borderTopWidth: 0,
          paddingBottom: pb,
          paddingTop: 10,
          height: 62 + pb,
          backgroundColor: '#fff',
          elevation: 20,
          shadowColor: '#000',
          shadowOpacity: 0.08,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: -4 },
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '700', marginTop: 2 },
        tabBarIconStyle: { marginTop: 2 },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Beranda',
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.activeTab : undefined}>
              <Home size={22} color={color} strokeWidth={focused ? 2.5 : 1.8} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Pesanan',
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.activeTab : undefined}>
              <ClipboardList size={22} color={color} strokeWidth={focused ? 2.5 : 1.8} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Notifikasi',
          tabBarIcon: ({ color, focused }) => (
            <Bell size={22} color={color} strokeWidth={focused ? 2.5 : 1.8} />
          ),
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
          tabBarBadgeStyle: { backgroundColor: '#EF4444', fontSize: 9, minWidth: 16, height: 16 },
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Akun',
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.activeTab : undefined}>
              <UserCircle2 size={22} color={color} strokeWidth={focused ? 2.5 : 1.8} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  activeTab: {
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 6,
    marginTop: -2,
  },
});
