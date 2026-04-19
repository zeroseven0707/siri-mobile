import { Tabs } from 'expo-router';
import { Home, UserCircle2 } from 'lucide-react-native';
import { Platform, View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const GREEN = '#16a34a';

export default function DriverTabsLayout() {
  const insets = useSafeAreaInsets();
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
      {/* Sembunyikan dari tab bar */}
      <Tabs.Screen name="orders"        options={{ href: null }} />
      <Tabs.Screen name="history"       options={{ href: null }} />
      <Tabs.Screen name="notifications" options={{ href: null }} />
      <Tabs.Screen name="order"         options={{ href: null }} />
      <Tabs.Screen name="map"           options={{ href: null }} />
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
