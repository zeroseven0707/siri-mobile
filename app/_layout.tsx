import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useAuthStore } from '../lib/authStore';
import SplashScreen from '../components/SplashScreen';

export default function RootLayout() {
  const { user, isLoading, loadSession } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => { loadSession(); }, []);

  useEffect(() => {
    if (isLoading) return;
    const inAuth = segments[0] === '(auth)';
    if (!user && !inAuth) router.replace('/(auth)/login');
    if (user && inAuth) router.replace('/(tabs)/home');
  }, [user, isLoading]);

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
