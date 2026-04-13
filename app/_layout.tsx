import { useEffect, useState } from 'react';
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

  // Fallback: paksa isLoading false setelah 5 detik
  const [forceReady, setForceReady] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setForceReady(true), 5000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => { loadSession(); }, []);

  useEffect(() => {
    if (!fontsLoaded) return;
    // Fire and forget — jangan block rendering
    requestUserPermission().catch(() => {});
    setupCloudMessaging().catch(() => {});
  }, [fontsLoaded]);

  useEffect(() => {
    if (isLoading || !fontsLoaded) return;
    const inAuth = segments[0] === '(auth)';
    if (user && inAuth) router.replace('/(tabs)/home');
  }, [user, isLoading, fontsLoaded]);

  const ready = (!isLoading && fontsLoaded) || forceReady;

  if (!ready) {
    return <SplashScreen />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
