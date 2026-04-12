import React, { useCallback, useState, useEffect } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import api from '../../lib/api';
import { Order } from '../../types';

const GREEN = '#2ECC71';
const DARK_GREEN = '#27AE60';

const STATUS: Record<Order['status'], { label: string; bg: string; color: string }> = {
  pending: { label: 'Menunggu', bg: '#FEF9C3', color: '#A16207' },
  accepted: { label: 'Diterima', bg: '#DBEAFE', color: '#1D4ED8' },
  on_progress: { label: 'Diproses', bg: '#EDE9FE', color: '#6D28D9' },
  completed: { label: 'Selesai', bg: '#DCFCE7', color: '#15803D' },
  cancelled: { label: 'Dibatalkan', bg: '#FEE2E2', color: '#B91C1C' },
};

function OrderCard({ item, onCancel }: { item: Order, onCancel: (id: string) => void }) {
  const router = useRouter();
  const [timeLeft, setTimeLeft] = useState(10);
  const [localStatus, setLocalStatus] = useState<Order['status']>(item.status);

  // Sync if item from server changes
  useEffect(() => {
    setLocalStatus(item.status);
    if (item.status === 'pending') {
      setTimeLeft(10);
    }
  }, [item.status]);

  // 10 second countdown for local 'pending'
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (localStatus === 'pending' && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (localStatus === 'pending' && timeLeft === 0) {
      // Auto-accept after 10s via API
      api.put(`/orders/${item.id}/confirm`).then(() => {
        setLocalStatus('accepted');
      }).catch((e) => {
        console.error('Failed to auto-confirm order', e);
        // fallback to accepted in UI anyway since it's demo simulating driver acceptance
        setLocalStatus('accepted');
      });
    }
    return () => clearInterval(timer);
  }, [localStatus, timeLeft]);

  const confirmCancel = () => {
    Alert.alert(
      'Konfirmasi Pembatalan',
      'Apakah Anda yakin ingin membatalkan pesanan ini?',
      [
        { text: 'Tidak', style: 'cancel' },
        { text: 'Ya, Batalkan', style: 'destructive', onPress: () => onCancel(item.id) }
      ]
    );
  };

  const st = STATUS[localStatus] || STATUS.pending;

  return (
    <Pressable style={styles.card} onPress={() => router.push(`/order/${item.id}` as any)}>
      <View style={styles.cardTop}>
        <View style={[styles.serviceIcon, { backgroundColor: '#F0FDF4' }]}>
          <Ionicons name="receipt-outline" size={20} color={DARK_GREEN} />
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.serviceName}>{item.service?.name ?? 'Layanan'}</Text>
          <Text style={styles.location} numberOfLines={1}>📍 {item.pickup_location}</Text>
          <Text style={styles.destination} numberOfLines={1}>🏁 {item.destination_location}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: st.bg }]}>
          <Text style={[styles.badgeText, { color: st.color }]}>
            {localStatus === 'pending' ? `${st.label} (${timeLeft}s)` : st.label}
          </Text>
        </View>
      </View>
      <View style={styles.cardBottom}>
        <Text style={styles.price}>Rp {Number(item.price).toLocaleString('id-ID')}</Text>
        {localStatus === 'pending' && (
          <Pressable onPress={confirmCancel} style={styles.cancelBtn}>
            <Text style={styles.cancelText}>Batalkan</Text>
          </Pressable>
        )}
      </View>
    </Pressable>
  );
}

export default function OrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async (isInitial = false) => {
    if (isInitial) setLoading(true);
    try {
      const res = await api.get('/orders');
      setOrders(res.data.data.orders ?? []);
    }
    catch { }
    finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchOrders(orders.length === 0); }, []));

  const handleCancel = async (id: string) => {
    try {
      await api.put(`/orders/${id}/cancel`);
      fetchOrders();
      Alert.alert('Berhasil', 'Pesanan telah dibatalkan');
    } catch { }
  };

  return (
    <SafeAreaView style={styles.flex}>
      <View style={styles.header}>
        <Text style={styles.title}>Pesanan Saya</Text>
      </View>

      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color={GREEN} />
          <Text style={styles.loadingText}>Memuat pesanan...</Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={o => o.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchOrders(); }} tintColor={GREEN} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={{ fontSize: 56 }}>📦</Text>
              <Text style={styles.emptyTitle}>Belum ada pesanan</Text>
              <Text style={styles.emptySubtitle}>Yuk pesan sesuatu!</Text>
            </View>
          }
          renderItem={({ item }) => <OrderCard item={item} onCancel={handleCancel} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#F8FFF8' },
  header: { paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  title: { fontSize: 20, fontWeight: '700', color: '#1F2937' },
  list: { padding: 16, gap: 12 },
  centerLoading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 12, color: '#9CA3AF', fontSize: 14 },
  empty: { alignItems: 'center', paddingVertical: 80 },
  emptyTitle: { color: '#374151', fontSize: 18, fontWeight: '700', marginTop: 12 },
  emptySubtitle: { color: '#9CA3AF', fontSize: 14, marginTop: 4 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#F3F4F6', elevation: 1 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  serviceIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cardInfo: { flex: 1 },
  serviceName: { fontWeight: '700', color: '#1F2937', fontSize: 14 },
  location: { color: '#6B7280', fontSize: 12, marginTop: 3 },
  destination: { color: '#9CA3AF', fontSize: 12, marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  price: { color: DARK_GREEN, fontWeight: '700', fontSize: 15 },
  cancelBtn: { backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 10 },
  cancelText: { color: '#DC2626', fontSize: 12, fontWeight: '600' },
});
