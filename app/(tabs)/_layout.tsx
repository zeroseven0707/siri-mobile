import { Tabs, useRouter } from 'expo-router';
import { Home, ClipboardList, UserCircle2, LayoutGrid, ScanLine } from 'lucide-react-native';
import {
  Platform, View, StyleSheet, TouchableOpacity, Modal,
  Text, Alert, ActivityIndicator, Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNotificationStore } from '../../lib/notificationStore';
import { useState } from 'react';
import { CameraView, useCameraPermissions } from 'expo-camera';
import api from '../../lib/api';

const GREEN = '#2ECC71';

function ScanQRModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const router = useRouter();
  const [scanning, setScanning] = useState(false);

  const handleScan = async (data: string) => {
    if (scanning) return;
    setScanning(true);
    try {
      // Coba complete order via token
      const res = await api.post('/orders/complete-by-token', { token: data });
      onClose();
      const orderId = res.data.data?.id;
      Alert.alert(
        '✅ Pesanan Selesai',
        'Pesanan kamu telah berhasil diselesaikan!',
        [{ text: 'Lihat Detail', onPress: () => orderId && router.push(`/order/${orderId}` as any) },
         { text: 'OK' }]
      );
    } catch (e: any) {
      Alert.alert('QR Tidak Valid', e.message || 'QR code tidak dikenali atau sudah tidak berlaku', [
        { text: 'Coba Lagi', onPress: () => setScanning(false) },
        { text: 'Tutup', onPress: onClose },
      ]);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={ms.container}>
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={({ data }) => handleScan(data)}
        />

        {/* Dark overlay top & bottom */}
        <View style={ms.overlayTop} />
        <View style={ms.overlayBottom} />
        <View style={ms.overlaySideLeft} />
        <View style={ms.overlaySideRight} />

        {/* Header */}
        <View style={ms.header}>
          <TouchableOpacity onPress={onClose} style={ms.closeBtn}>
            <Text style={ms.closeBtnText}>✕</Text>
          </TouchableOpacity>
          <Text style={ms.headerTitle}>Scan QR Code</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Frame */}
        <View style={ms.frameWrap}>
          <View style={ms.frame}>
            <View style={[ms.corner, { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3 }]} />
            <View style={[ms.corner, { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3 }]} />
            <View style={[ms.corner, { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3 }]} />
            <View style={[ms.corner, { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3 }]} />
            {scanning && (
              <View style={ms.scanningOverlay}>
                <ActivityIndicator size="large" color="#fff" />
              </View>
            )}
          </View>
        </View>

        {/* Info card */}
        <View style={ms.infoCard}>
          <View style={ms.infoIcon}>
            <ScanLine size={20} color={GREEN} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={ms.infoTitle}>Scan untuk Selesaikan Pesanan</Text>
            <Text style={ms.infoDesc}>
              Arahkan kamera ke QR code yang ditunjukkan driver untuk menyelesaikan pesanan kamu
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const { unreadCount } = useNotificationStore();
  const [showScanner, setShowScanner] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const pb = Platform.OS === 'android' ? 10 : (insets.bottom > 0 ? insets.bottom : 8);

  const openScanner = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert('Izin Kamera', 'Izinkan akses kamera untuk scan QR code pesanan');
        return;
      }
    }
    setShowScanner(true);
  };

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: GREEN,
          tabBarInactiveTintColor: '#B0B8C1',
          tabBarStyle: {
            borderTopWidth: 0,
            paddingBottom: pb,
            paddingTop: 10,
            height: 62 + pb,
            backgroundColor: '#fff',
            elevation: 20,
            shadowColor: '#000',
            shadowOpacity: 0.08,
            shadowRadius: 16,
            shadowOffset: { width: 0, height: -4 },
          },
          tabBarLabelStyle: { fontSize: 10, fontWeight: '700', marginTop: 2 },
          tabBarIconStyle: { marginTop: 2 },
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: 'Beranda',
            tabBarIcon: ({ color, focused }) => (
              <View style={focused ? styles.activeTab : undefined}>
                <Home size={22} color={color} strokeWidth={focused ? 2.5 : 1.8} />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="feed"
          options={{
            title: 'Feed',
            tabBarIcon: ({ color, focused }) => (
              <View style={focused ? styles.activeTab : undefined}>
                <LayoutGrid size={22} color={color} strokeWidth={focused ? 2.5 : 1.8} />
              </View>
            ),
          }}
        />

        {/* Tombol Scan — tengah, custom */}
        <Tabs.Screen
          name="scan"
          options={{
            title: '',
            tabBarButton: () => (
              <TouchableOpacity style={styles.scanTabBtn} onPress={openScanner} activeOpacity={0.85}>
                <View style={styles.scanBtnInner}>
                  <ScanLine size={26} color="#fff" strokeWidth={2} />
                </View>
              </TouchableOpacity>
            ),
          }}
        />

        <Tabs.Screen
          name="orders"
          options={{
            title: 'Pesanan',
            tabBarIcon: ({ color, focused }) => (
              <View style={focused ? styles.activeTab : undefined}>
                <ClipboardList size={22} color={color} strokeWidth={focused ? 2.5 : 1.8} />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Akun',
            tabBarIcon: ({ color, focused }) => (
              <View style={focused ? styles.activeTab : undefined}>
                <UserCircle2 size={22} color={color} strokeWidth={focused ? 2.5 : 1.8} />
              </View>
            ),
          }}
        />
        <Tabs.Screen name="notifications" options={{ href: null }} />
      </Tabs>

      <ScanQRModal visible={showScanner} onClose={() => setShowScanner(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  activeTab: {
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 6,
    marginTop: -2,
  },
  scanTabBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -16,
  },
  scanBtnInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: GREEN,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: GREEN,
    shadowOpacity: 0.45,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
    borderWidth: 3,
    borderColor: '#fff',
  },
});

const FRAME = 240;
const ms = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },

  // Overlay gelap di luar frame
  overlayTop: { position: 'absolute', top: 0, left: 0, right: 0, height: '30%', backgroundColor: 'rgba(0,0,0,0.6)' },
  overlayBottom: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '30%', backgroundColor: 'rgba(0,0,0,0.6)' },
  overlaySideLeft: { position: 'absolute', top: '30%', bottom: '30%', left: 0, width: `calc(50% - ${FRAME / 2}px)` as any, backgroundColor: 'rgba(0,0,0,0.6)' },
  overlaySideRight: { position: 'absolute', top: '30%', bottom: '30%', right: 0, width: `calc(50% - ${FRAME / 2}px)` as any, backgroundColor: 'rgba(0,0,0,0.6)' },

  header: {
    position: 'absolute', top: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 56, paddingHorizontal: 20, paddingBottom: 16,
  },
  closeBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center',
  },
  closeBtnText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  headerTitle: { color: '#fff', fontSize: 17, fontWeight: '700' },

  frameWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  frame: {
    width: FRAME, height: FRAME,
    position: 'relative',
  },
  corner: {
    position: 'absolute', width: 32, height: 32,
    borderColor: GREEN,
  },
  scanningOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center', justifyContent: 'center', borderRadius: 4,
  },

  infoCard: {
    position: 'absolute', bottom: 60, left: 20, right: 20,
    backgroundColor: '#fff', borderRadius: 16, padding: 16,
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 12, elevation: 8,
  },
  infoIcon: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: '#F0FDF4', alignItems: 'center', justifyContent: 'center',
  },
  infoTitle: { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 4 },
  infoDesc: { fontSize: 12, color: '#6B7280', lineHeight: 17 },
});
