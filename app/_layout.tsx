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
    // Gunakan font dari library langsung dengan berbagai alias nama
    ...Ionicons.font,
    ...MaterialIcons.font,
    ...MaterialCommunityIcons.font,
    ...FontAwesome.font,
    'Ionicons': Ionicons.font.ionicons,
    'MaterialIcons': MaterialIcons.font.material,
    'Material Community Icons': MaterialCommunityIcons.font['material-community'],
    'MaterialCommunityIcons': MaterialCommunityIcons.font['material-community'],
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
    const inAuth = segments[0] === '(auth)';
    if (user && inAuth) router.replace('/(tabs)/home');
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
      </Stack>
    </>
  );
}
