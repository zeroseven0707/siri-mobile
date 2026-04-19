import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  ActivityIndicator, Alert, Linking, Modal,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Phone, Navigation, User, Package,
  ArrowLeft, QrCode, X,
} from 'lucide-react-native';
import QRCode from 'react-native-qrcode-svg';
import api from '../../../lib/api';

const GREEN = '#16a34a';
const DARK_GREEN = '#15803d';

type OrderStatus = 'pending' | 'accepted' | 'on_progress' | 'completed' | 'cancelled';

const STATUS_CFG: Record<OrderStatus, { label: string; bg: string; color: string; desc: string }> = {
  pending:     { label: 'Menunggu',         bg: '#FEF9C3', color: '#A16207', desc: 'Pesanan menunggu konfirmasi driver' },
  accepted:    { label: 'Diterima',         bg: '#DBEAFE', color: '#1D4ED8', desc: 'Segera jemput pelanggan' },
  on_progress: { label: 'Dalam Perjalanan', bg: '#EDE9FE', color: '#6D28D9', desc: 'Sedang mengantar ke tujuan' },
  completed:   { label: 'Selesai',          bg: '#DCFCE7', color: '#15803D', desc: 'Pesanan telah selesai' },
  cancelled:   { label: 'Dibatalkan',       bg: '#FEE2E2', color: '#B91C1C', desc: 'Pesanan telah dibatalkan' },
};

// Next action for each status — complete dihapus, sekarang via QR scan user
const NEXT_ACTION: Partial<Record<OrderStatus, { label: string; endpoint: string; color: string }>> = {
  accepted: { label: 'Mulai Perjalanan', endpoint: 'process', color: '#3B82F6' },
};

export default function DriverOrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    try {
      // Gunakan endpoint order umum karena driver belum punya endpoint show sendiri
      const res = await api.get(`/orders/${id}`);
      setOrder(res.data.data);
    } catch {
      Alert.alert('Error', 'Gagal memuat detail pesanan');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (endpoint: string) => {
    const labels: Record<string, string> = {
      process: 'Proses pesanan ini sekarang?',
    };
    Alert.alert('Konfirmasi', labels[endpoint] ?? 'Update status?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Ya',
        onPress: async () => {
          setUpdating(true);
          try {
            await api.put(`/driver/orders/${id}/${endpoint}`);
            await fetchOrder();
          } catch (e: any) {
            Alert.alert('Gagal', e.message || 'Tidak dapat update status');
          } finally {
            setUpdating(false);
          }
        },
      },
    ]);
  };

  const openMaps = (address: string) => {
    const encoded = encodeURIComponent(address);
    const url = `https://maps.google.com/?q=${encoded}`;
    Linking.openURL(url).catch(() =>
      Alert.alert('Error', 'Tidak dapat membuka Maps')
    );
  };

  const callCustomer = (phone: string) => {
    Linking.openURL(`tel:${phone}`).catch(() =>
      Alert.alert('Error', 'Tidak dapat melakukan panggilan')
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color={GREEN} />
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={{ color: '#6B7280' }}>Pesanan tidak ditemukan</Text>
      </SafeAreaView>
    );
  }

  const st = STATUS_CFG[order.status as OrderStatus] ?? STATUS_CFG.pending;
  const nextAction = NEXT_ACTION[order.status as OrderStatus];

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Detail Pesanan',
          headerStyle: { backgroundColor: GREEN },
          headerTintColor: '#fff',
          headerLeft: () => (
            <Pressable onPress={() => router.back()} style={{ marginLeft: 4 }}>
              <ArrowLeft size={22} color="#fff" />
            </Pressable>
          ),
        }}
      />
      <SafeAreaView edges={['bottom']} style={styles.container}>
        <ScrollView contentContainerStyle={styles.scroll}>

          {/* Status */}
          <View style={[styles.statusBox, { backgroundColor: st.bg, borderColor: st.color + '30' }]}>
            <View style={styles.statusRow}>
              <View style={[styles.statusDot, { backgroundColor: st.color }]} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.statusLabel, { color: st.color }]}>{st.label}</Text>
                <Text style={[styles.statusDesc, { color: st.color }]}>{st.desc}</Text>
              </View>
            </View>
          </View>

          {/* Customer Info */}
          {order.user && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Informasi Pelanggan</Text>
              <View style={styles.personRow}>
                <View style={styles.personAvatar}>
                  <User size={24} color="#D1D5DB" />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.personName}>{order.user.name}</Text>
                  <Text style={styles.personSub}>{order.user.phone}</Text>
                </View>
                {order.user.phone && (
                  <Pressable
                    style={styles.callBtn}
                    onPress={() => callCustomer(order.user.phone)}
                  >
                    <Phone size={18} color={GREEN} />
                    <Text style={styles.callBtnText}>Hubungi</Text>
                  </Pressable>
                )}
              </View>
            </View>
          )}

          {/* Route */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Rute Pengiriman</Text>
            <View style={styles.routeContainer}>
              <View style={styles.routeDotLine}>
                <View style={[styles.dot, { borderColor: GREEN }]} />
                <View style={styles.line} />
                <View style={[styles.dot, { borderColor: '#F59E0B' }]} />
              </View>
              <View style={styles.routeTexts}>
                <View style={styles.routeItem}>
                  <Text style={styles.routeLabel}>Lokasi Jemput</Text>
                  <Text style={styles.routeValue}>{order.pickup_location}</Text>
                  <Pressable
                    style={styles.navBtn}
                    onPress={() => openMaps(order.pickup_location)}
                  >
                    <Navigation size={13} color={GREEN} />
                    <Text style={styles.navBtnText}>Navigasi</Text>
                  </Pressable>
                </View>
                <View style={[styles.routeItem, { marginTop: 16 }]}>
                  <Text style={styles.routeLabel}>Tujuan Pengiriman</Text>
                  <Text style={styles.routeValue}>{order.destination_location}</Text>
                  <Pressable
                    style={styles.navBtn}
                    onPress={() => openMaps(order.destination_location)}
                  >
                    <Navigation size={13} color="#F59E0B" />
                    <Text style={[styles.navBtnText, { color: '#D97706' }]}>Navigasi</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </View>

          {/* Order Items */}
          {order.food_items && order.food_items.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Rincian Pesanan</Text>
              {order.food_items.map((fi: any) => (
                <View key={fi.id} style={styles.foodItem}>
                  <View style={styles.qtyBox}>
                    <Text style={styles.qtyText}>{fi.qty}x</Text>
                  </View>
                  <View style={{ flex: 1, paddingHorizontal: 12 }}>
                    <Text style={styles.foodName}>{fi.food_item?.name}</Text>
                  </View>
                  <Text style={styles.foodPrice}>
                    Rp {Number(fi.price).toLocaleString('id-ID')}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Payment */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Ringkasan Pembayaran</Text>
            {order.notes && (
              <View style={styles.notesBox}>
                <Text style={styles.notesText}>📝 Catatan: "{order.notes}"</Text>
              </View>
            )}
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Pembayaran</Text>
              <Text style={styles.summaryValue}>
                Rp {Number(order.price).toLocaleString('id-ID')}
              </Text>
            </View>
          </View>

          {/* QR Code card — tampil saat on_progress */}
          {order.status === 'on_progress' && order.completion_token && (
            <View style={styles.qrCard}>
              <Text style={styles.qrTitle}>QR Code Penyelesaian</Text>
              <Text style={styles.qrDesc}>Tunjukkan QR ini ke pelanggan untuk scan dan menyelesaikan pesanan</Text>
              <Pressable style={styles.qrBox} onPress={() => setShowQR(true)}>
                <QRCode value={order.completion_token} size={160} />
              </Pressable>
              <Pressable style={styles.qrExpandBtn} onPress={() => setShowQR(true)}>
                <QrCode size={16} color={GREEN} />
                <Text style={styles.qrExpandText}>Perbesar QR Code</Text>
              </Pressable>
            </View>
          )}

        </ScrollView>

        {/* Action Button */}
        {nextAction && (
          <View style={styles.actionBar}>
            <Pressable
              style={[styles.actionBtn, { backgroundColor: nextAction.color }, updating && styles.actionBtnDisabled]}
              onPress={() => handleUpdateStatus(nextAction.endpoint)}
              disabled={updating}
            >
              {updating ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Package size={20} color="#fff" />
                  <Text style={styles.actionBtnText}>{nextAction.label}</Text>
                </>
              )}
            </Pressable>
          </View>
        )}

        {/* QR Fullscreen Modal */}
        <Modal visible={showQR} transparent animationType="fade" onRequestClose={() => setShowQR(false)}>
          <Pressable style={styles.qrOverlay} onPress={() => setShowQR(false)}>
            <View style={styles.qrFullCard}>
              <Text style={styles.qrFullTitle}>Scan untuk Selesaikan Pesanan</Text>
              {order?.completion_token && <QRCode value={order.completion_token} size={240} />}
              <Text style={styles.qrFullHint}>Minta pelanggan scan QR ini</Text>
              <Pressable style={styles.qrCloseBtn} onPress={() => setShowQR(false)}>
                <X size={20} color="#374151" />
              </Pressable>
            </View>
          </Pressable>
        </Modal>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F9FAFB' },
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  scroll: { padding: 16, paddingBottom: 24 },

  statusBox: {
    padding: 14,
    borderRadius: 16,
    marginBottom: 14,
    borderWidth: 1,
  },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  statusLabel: { fontSize: 15, fontWeight: '700' },
  statusDesc: { fontSize: 12, marginTop: 2, opacity: 0.8 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 14 },

  personRow: { flexDirection: 'row', alignItems: 'center' },
  personAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  personName: { fontSize: 15, fontWeight: '700', color: '#1F2937' },
  personSub: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  callBtnText: { color: GREEN, fontWeight: '700', fontSize: 13 },

  routeContainer: { flexDirection: 'row' },
  routeDotLine: { alignItems: 'center', marginRight: 14, paddingTop: 4 },
  dot: { width: 13, height: 13, borderRadius: 7, borderWidth: 2.5, backgroundColor: '#fff' },
  line: { width: 2, height: 40, backgroundColor: '#E5E7EB', marginVertical: 4 },
  routeTexts: { flex: 1 },
  routeItem: {},
  routeLabel: { fontSize: 11, color: '#9CA3AF', fontWeight: '600', marginBottom: 3 },
  routeValue: { fontSize: 13, fontWeight: '600', color: '#374151', lineHeight: 18 },
  navBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
    alignSelf: 'flex-start',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  navBtnText: { color: GREEN, fontSize: 12, fontWeight: '700' },

  foodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  qtyBox: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#F0FDF4',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  qtyText: { fontWeight: '700', color: DARK_GREEN, fontSize: 12 },
  foodName: { fontSize: 13, fontWeight: '600', color: '#1F2937' },
  foodPrice: { fontSize: 13, fontWeight: '700', color: '#111827' },

  notesBox: {
    backgroundColor: '#F9FAFB',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  notesText: { fontSize: 13, color: '#4B5563', fontStyle: 'italic' },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  summaryLabel: { fontSize: 14, fontWeight: '600', color: '#374151' },
  summaryValue: { fontSize: 18, fontWeight: '800', color: DARK_GREEN },

  actionBar: {
    padding: 16,
    paddingBottom: 24,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: GREEN,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  actionBtnDisabled: { opacity: 0.6 },
  actionBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },

  // QR
  qrCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 14,
    alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
    borderWidth: 2, borderColor: '#BBF7D0',
  },
  qrTitle: { fontSize: 15, fontWeight: '800', color: '#111827', marginBottom: 6 },
  qrDesc: { fontSize: 12, color: '#6B7280', textAlign: 'center', marginBottom: 16, lineHeight: 18 },
  qrBox: { padding: 12, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB' },
  qrExpandBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14 },
  qrExpandText: { color: GREEN, fontWeight: '700', fontSize: 13 },
  qrOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center' },
  qrFullCard: {
    backgroundColor: '#fff', borderRadius: 24, padding: 32,
    alignItems: 'center', gap: 16, width: 300,
  },
  qrFullTitle: { fontSize: 16, fontWeight: '800', color: '#111827', textAlign: 'center' },
  qrFullHint: { fontSize: 13, color: '#6B7280', textAlign: 'center' },
  qrCloseBtn: {
    position: 'absolute', top: 12, right: 12,
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center',
  },
});
