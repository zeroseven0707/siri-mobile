import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useFonts } from 'expo-font';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../lib/authStore';
import SplashScreen from '../components/SplashScreen';
import { requestUserPermission, setupCloudMessaging } from '../lib/notificationService';

export default function RootLayout() {
  const { user, isLoading, loadSession } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  const [fontsLoaded] = useFonts({
    ...Ionicons.font,
  });

  useEffect(() => { loadSession(); }, []);

  useEffect(() => {
    let unsub: (() => void) | undefined;

    if (fontsLoaded) {
      // Inisialisasi Notifikasi
      requestUserPermission();
      setupCloudMessaging().then(u => {
        unsub = u;
      });
      
      return () => {
        if (unsub) unsub();
      };
    }
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
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
