import { Platform, NativeModules } from 'react-native';

// Fungsi bantuan untuk cek apakah modul Firebase terpasang (Native)
const isFirebaseAvailable = () => {
  return !!NativeModules.RNFBAppModule;
};

export async function requestUserPermission() {
  if (!isFirebaseAvailable()) {
    console.log('Firebase Native Module not found. Skip requestPermission');
    return false;
  }

  // Import dinamis agar tidak crash di Expo Go saat booting
  const messaging = require('@react-native-firebase/messaging').default;
  const notifee = require('@notifee/react-native').default;

  if (Platform.OS === 'ios') {
    const authStatus = await messaging().requestPermission();
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

  // Import dinamis
  const messaging = require('@react-native-firebase/messaging').default;
  const notifee = require('@notifee/react-native').default;
  const { AndroidImportance } = require('@notifee/react-native');

  // Buat channel notifikasi (Wajib untuk Android)
  const channelId = await notifee.createChannel({
    id: 'siri-orders',
    name: 'Pesanan Siri',
    importance: AndroidImportance.HIGH,
  });

  // Mendengarkan pesan saat aplikasi di FOREGROUND
  const unsubscribe = messaging().onMessage(async (remoteMessage: any) => {
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
    const messaging = require('@react-native-firebase/messaging').default;
    const token = await messaging().getToken();
    return token;
  } catch (err) {
    return null;
  }
}
