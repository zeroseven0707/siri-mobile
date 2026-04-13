import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useFonts } from 'expo-font';
import { useAuthStore } from '../lib/authStore';
import SplashScreen from '../components/SplashScreen';
import DebugOverlay from '../components/DebugOverlay';
import { requestUserPermission, setupCloudMessaging, syncFCMTokenToBackend } from '../lib/notificationService';
import { Ionicons, MaterialIcons, MaterialCommunityIcons, FontAwesome } from '@expo/vector-icons';

export default function RootLayout() {
  const { user, isLoading, loadSession } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();
  
  const [fontsLoaded, fontError] = useFonts({
    // Load explicitly with both names to ensure compatibility
    'ionicons': require('@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Ionicons.ttf'),
    'Ionicons': require('@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Ionicons.ttf'),
    'material': require('@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/MaterialIcons.ttf'),
    'MaterialIcons': require('@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/MaterialIcons.ttf'),
    'material-community': require('@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/MaterialCommunityIcons.ttf'),
    'MaterialCommunityIcons': require('@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/MaterialCommunityIcons.ttf'),
  });

  useEffect(() => {
    if (fontError) console.warn('Peringatan Font:', fontError);
  }, [fontError]);

  useEffect(() => { loadSession(); }, []);

  useEffect(() => {
    if (fontsLoaded || fontError) {
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
      <DebugOverlay />
    </>
  );
}
