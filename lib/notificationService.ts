import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance } from '@notifee/react-native';
import { Platform } from 'react-native';

export async function requestUserPermission() {
  if (Platform.OS === 'ios') {
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (enabled) {
      console.log('Authorization status:', authStatus);
    }
  } else {
    // Android: Notifee handles permission for Android 13+
    await notifee.requestPermission();
  }
}

export async function setupCloudMessaging() {
  // Buat channel notifikasi (Wajib untuk Android)
  const channelId = await notifee.createChannel({
    id: 'siri-orders',
    name: 'Pesanan Siri',
    importance: AndroidImportance.HIGH,
  });

  // Mendengarkan pesan saat aplikasi di FOREGROUND
  const unsubscribe = messaging().onMessage(async remoteMessage => {
    console.log('A new FCM message arrived!', JSON.stringify(remoteMessage));

    // Ekstrak data
    const { title, body } = remoteMessage.notification || {};
    
    // Tampilkan notifikasi via Notifee
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

// Mendapatkan Token FCM (Untuk dikirim ke Backend nantinya)
export async function getFCMToken() {
  try {
    const token = await messaging().getToken();
    console.log('FCM Token:', token);
    return token;
  } catch (err) {
    console.log('Gagal ambil FCM Token:', err);
    return null;
  }
}
