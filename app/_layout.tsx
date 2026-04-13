import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useFonts } from 'expo-font';
import { useAuthStore } from '../lib/authStore';
import SplashScreen from '../components/SplashScreen';
import DebugOverlay from '../components/DebugOverlay';
import { requestUserPermission, setupCloudMessaging } from '../lib/notificationService';
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
    // Provide capitalized aliases just in case some components expect them
    'Ionicons': Ionicons.font.ionicons,
    'MaterialIcons': MaterialIcons.font.material,
    'MaterialCommunityIcons': MaterialCommunityIcons.font['material-community'],
  });

  useEffect(() => {
    if (fontError) console.error('Font load error:', fontError);
  }, [fontError]);

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
