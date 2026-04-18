import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useFonts } from 'expo-font';
import { useAuthStore } from '../lib/authStore';
import SplashScreen from '../components/SplashScreen';
import { requestUserPermission, setupCloudMessaging, syncFCMTokenToBackend, setNotificationRouter } from '../lib/notificationService';
import { Ionicons, MaterialIcons, MaterialCommunityIcons, FontAwesome } from '@expo/vector-icons';

export default function RootLayout() {
  const { user, isLoading, loadSession } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();
  
  const [fontsLoaded, fontError] = useFonts({
    ...Ionicons.font,
    ...MaterialIcons.font,
    ...MaterialCommunityIcons.font,
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (fontError) console.warn('Peringatan Font:', fontError);
  }, [fontError]);

  useEffect(() => { loadSession(); }, []);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      setNotificationRouter(router);
      requestUserPermission().catch(() => {});
      setupCloudMessaging().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  // Sync FCM token setelah session loaded dan user sudah login
  useEffect(() => {
    if (user && !isLoading) {
      syncFCMTokenToBackend().catch(() => {});
    }
  }, [user, isLoading]);

  useEffect(() => {
    if (isLoading || (!fontsLoaded && !fontError)) return;

    const inAuth   = segments[0] === '(auth)';
    const inDriver = segments[0] === 'driver';
    const inUser   = segments[0] === '(tabs)';

    if (!user) {
      // Belum login — paksa ke halaman login
      if (!inAuth) {
        router.replace('/(auth)/login');
      }
      return;
    }

    // Sudah login — arahkan ke halaman yang sesuai role
    if (inAuth) {
      if (user.role === 'driver') {
        router.replace('/driver/home' as any);
      } else {
        router.replace('/(tabs)/home');
      }
      return;
    }

    // Driver mencoba akses halaman user
    if (user.role === 'driver' && inUser) {
      router.replace('/driver/home' as any);
      return;
    }

    // User/admin mencoba akses halaman driver
    if (user.role !== 'driver' && inDriver) {
      router.replace('/(tabs)/home');
      return;
    }
  }, [user, isLoading, fontsLoaded, fontError]);

  // Jika sudah tidak loading (auth) DAN (font sudah siap ATAU gagal)
  const isReady = !isLoading && (fontsLoaded || fontError);

  if (!isReady) {
    return <SplashScreen />;
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="driver" />
      </Stack>
    </>
  );
}
