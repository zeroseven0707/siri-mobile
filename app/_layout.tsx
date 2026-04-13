import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as Font from 'expo-font';
import { useAuthStore } from '../lib/authStore';
import SplashScreen from '../components/SplashScreen';
import DebugOverlay from '../components/DebugOverlay';
import { requestUserPermission, setupCloudMessaging } from '../lib/notificationService';

export default function RootLayout() {
  const { user, isLoading, loadSession } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    Font.loadAsync({
      'Ionicons': require('@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Ionicons.ttf'),
      'MaterialIcons': require('@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/MaterialIcons.ttf'),
      'MaterialCommunityIcons': require('@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/MaterialCommunityIcons.ttf'),
    }).then(() => setFontsLoaded(true)).catch((e) => {
      console.error('Font load error:', e);
      setFontsLoaded(true); // tetap lanjut meski gagal
    });
  }, []);

  useEffect(() => { loadSession(); }, []);

  useEffect(() => {
    if (!fontsLoaded) return;
    requestUserPermission().catch(() => {});
    setupCloudMessaging().catch(() => {});
  }, [fontsLoaded]);

  useEffect(() => {
    if (isLoading || !fontsLoaded) return;
    const inAuth = segments[0] === '(auth)';
    if (user && inAuth) router.replace('/(tabs)/home');
  }, [user, isLoading, fontsLoaded]);

  if (isLoading || !fontsLoaded) {
    return <SplashScreen />;
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
      </Stack>
      <DebugOverlay />
    </>
  );
}
