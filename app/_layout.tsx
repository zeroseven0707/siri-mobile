import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useFonts } from 'expo-font';
import { Linking } from 'react-native';
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

  // Handle deep link — pushapp://post/{id} atau Push://post/{id}
  useEffect(() => {
    const handleUrl = ({ url }: { url: string }) => {
      const match = url.match(/\/post\/([a-zA-Z0-9-]+)/);
      if (match?.[1]) {
        router.push(`/post/${match[1]}` as any);
      }
    };

    // App sudah buka, dapat link baru
    const sub = Linking.addEventListener('url', handleUrl);

    // App dibuka dari link (cold start)
    Linking.getInitialURL().then(url => {
      if (url) handleUrl({ url });
    });

    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (isLoading || (!fontsLoaded && !fontError)) return;

    const inAuth   = segments[0] === '(auth)';
    const inDriver = segments[0] === 'driver';
    const inUser   = segments[0] === '(tabs)';
    const inRoot   = !segments[0] || segments[0] === 'index';

    if (!user) {
      if (!inAuth) {
        router.replace('/(auth)/login');
      }
      return;
    }

    // Driver — harus selalu di halaman driver
    if (user.role === 'driver') {
      if (!inDriver) {
        router.replace('/driver/home' as any);
      }
      return;
    }

    // User/admin — harus selalu di halaman user
    if (inAuth || inDriver || inRoot) {
      router.replace('/(tabs)/home');
    }
  }, [user, isLoading, fontsLoaded, fontError, segments]);

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
        <Stack.Screen name="post/[id]" />
        <Stack.Screen name="user-profile/[id]" />
      </Stack>
    </>
  );
}
