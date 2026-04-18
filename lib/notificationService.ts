import { Platform, NativeModules } from 'react-native';
import api from './api';
import { useNotificationStore } from './notificationStore';

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
    id: 'Push-orders',
    name: 'Pesanan Push',
    importance: AndroidImportance.HIGH,
  });

  // Handle tap notifikasi saat app di background/quit
  notifee.onBackgroundEvent(async ({ type, detail }: any) => {
    const { EventType } = require('@notifee/react-native');
    if (type === EventType.PRESS) {
      handleNotificationNavigation(detail.notification?.data);
    }
  });

  // Mendengarkan pesan saat aplikasi di FOREGROUND
  const unsubscribe = onMessage(getMessaging(), async (remoteMessage: any) => {
    console.log('A new FCM message arrived!', JSON.stringify(remoteMessage));

    const { title, body } = remoteMessage.notification || {};
    const data = remoteMessage.data || {};

    if (title || body || data) {
      // Pemicu refresh data di UI secara otomatis
      useNotificationStore.getState().triggerRefresh();
      useNotificationStore.getState().incrementCount();

      await notifee.displayNotification({
        title: title || String(data?.title || 'Notifikasi Baru'),
        body: body || String(data?.body || 'Cek aplikasi Push kamu'),
        data,
        android: {
          channelId,
          smallIcon: 'ic_launcher',
          color: '#2ECC71',
          importance: AndroidImportance.HIGH,
          pressAction: { id: 'default' },
        },
      });
    }
  });

  // Handle tap notifikasi saat app di foreground
  notifee.onForegroundEvent(({ type, detail }: any) => {
    const { EventType } = require('@notifee/react-native');
    if (type === EventType.PRESS) {
      handleNotificationNavigation(detail.notification?.data);
    }
  });

  return unsubscribe;
}

let _router: any = null;

export function setNotificationRouter(router: any) {
  _router = router;
}

export function handleNotificationNavigation(data: any) {
  if (!_router) return;

  if (data?.navigate === 'orders') {
    _router.push('/(tabs)/orders');
  } else {
    // Default navigasi ke halaman notifikasi
    _router.push('/(tabs)/notifications');
  }
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
    
    const response = await api.post('/profile/fcm-token', { fcm_token: fcmToken });
    console.log('FCM token synced to backend. Status:', response.status);
    
    // Sekaligus ambil jumlah notifikasi belum dibaca saat sinkronisasi token
    fetchUnreadCount();
  } catch (err: any) {
    console.log('Failed to sync FCM token:', err.response?.data?.message || err.message);
  }
}

export async function fetchUnreadCount() {
  try {
    const res = await api.get('/notifications');
    const count = res.data.data.unread_count || 0;
    useNotificationStore.getState().setUnreadCount(count);
  } catch (err) {
    console.log('Gagal ambil jumlah notifikasi:', err);
  }
}
