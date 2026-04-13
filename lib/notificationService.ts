import { Platform, NativeModules } from 'react-native';
import api from './api';

// Fungsi bantuan untuk cek apakah modul Firebase terpasang (Native)
const isFirebaseAvailable = () => {
  return !!NativeModules.RNFBAppModule;
};

export async function requestUserPermission() {
  if (!isFirebaseAvailable()) {
    console.log('Firebase Native Module not found. Skip requestPermission');
    return false;
  }

  // Import modular API agar tidak crash di Expo Go saat booting
  const { getMessaging, requestPermission } = require('@react-native-firebase/messaging');
  const notifee = require('@notifee/react-native').default;

  if (Platform.OS === 'ios') {
    const authStatus = await requestPermission(getMessaging());
    const enabled =
      authStatus === 1 || // messaging.AuthorizationStatus.AUTHORIZED
      authStatus === 2;   // messaging.AuthorizationStatus.PROVISIONAL

    return enabled;
  } else {
    await notifee.requestPermission();
    return true;
  }
}

export async function setupCloudMessaging() {
  if (!isFirebaseAvailable()) {
    console.log('Firebase Native Module not found. Skip setupCloudMessaging');
    return () => {};
  }

  // Import modular API
  const { getMessaging, onMessage, setBackgroundMessageHandler, getToken } = require('@react-native-firebase/messaging');
  const notifee = require('@notifee/react-native').default;
  const { AndroidImportance } = require('@notifee/react-native');

  // Ambil token dan kirim ke backend
  try {
    const token = await getToken(getMessaging());
    console.log('--- FCM DEVICE TOKEN ---');
    console.log(token);
    console.log('------------------------');
    if (token) {
      await syncFCMTokenToBackend(token);
    }
  } catch (e) {
    console.log('Gagal mengambil token:', e);
  }

  // Registrasi background handler (Wajib untuk notifikasi saat aplikasi tertutup)
  setBackgroundMessageHandler(async (remoteMessage: any) => {
    console.log('Message handled in the background!', remoteMessage);
  });

  // Buat channel notifikasi (Wajib untuk Android)
  const channelId = await notifee.createChannel({
    id: 'siri-orders',
    name: 'Pesanan Siri',
    importance: AndroidImportance.HIGH,
  });

  // Mendengarkan pesan saat aplikasi di FOREGROUND
  const unsubscribe = onMessage(getMessaging(), async (remoteMessage: any) => {
    console.log('A new FCM message arrived!', JSON.stringify(remoteMessage));

    const { title, body } = remoteMessage.notification || {};
    
    if (title || body || remoteMessage.data) {
      await notifee.displayNotification({
        title: title || String(remoteMessage.data?.title || 'Notifikasi Baru'),
        body: body || String(remoteMessage.data?.body || 'Cek aplikasi Siri kamu'),
        android: {
          channelId,
          color: '#2ECC71',
          importance: AndroidImportance.HIGH,
          pressAction: {
            id: 'default',
          },
        },
      });
    }
  });

  return unsubscribe;
}

export async function getFCMToken() {
  if (!isFirebaseAvailable()) return null;
  try {
    const { getMessaging, getToken } = require('@react-native-firebase/messaging');
    const token = await getToken(getMessaging());
    return token;
  } catch (err) {
    return null;
  }
}

export async function syncFCMTokenToBackend(token?: string) {
  try {
    const fcmToken = token || await getFCMToken();
    if (!fcmToken) return;
    await api.post('/profile/fcm-token', { fcm_token: fcmToken });
    console.log('FCM token synced to backend');
  } catch (err) {
    console.log('Failed to sync FCM token:', err);
  }
}
