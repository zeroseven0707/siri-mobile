import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator,
  RefreshControl, Alert, Switch, StatusBar, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  MapPin, Navigation, Package, CheckCircle2, Clock,
  TrendingUp, Bike, Car, ChevronRight, Zap,
} from 'lucide-react-native';
import api from '../../lib/api';
import { useAuthStore } from '../../lib/authStore';
import { Order } from '../../types';

const GREEN = '#16a34a';
const DARK_GREEN = '#15803d';
const LIGHT_GREEN = '#22c55e';

const STATUS_CFG: Record<string, { label: string; bg: string; color: string }> = {
  pending:     { label: 'Menunggu',       bg: '#FEF9C3', color: '#A16207' },
  accepted:    { label: 'Diterima',       bg: '#DBEAFE', color: '#1D4ED8' },
  on_progress: { label: 'Dalam Perjalanan', bg: '#EDE9FE', color: '#6D28D9' },
  completed:   { label: 'Selesai',        bg: '#DCFCE7', color: '#15803D' },
  cancelled:   { label: 'Dibatalkan',     bg: '#FEE2E2', color: '#B91C1C' },
};

interface DriverStats {
  today_orders: number;
  today_earnings: number;
  total_completed: number;
  rating: number;
}

export default function DriverHomeScreen() {
  const router = useRouter();
  const { user, updateUser } = useAuthStore();
  const [isOnline, setIsOnline] = useState(
    user?.driver_profile?.status === 'online'
  );
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [stats, setStats] = useState<DriverStats>({
    today_orders: 0,
    today_earnings: 0,
    total_completed: 0,
    rating: 5.0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isOnline) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.3, duration: 900, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
  }, [isOnline]);

  const fetchData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const ordersRes = await api.get('/driver/orders');
      console.log('driver/orders raw:', JSON.stringify(ordersRes.data));
      const allOrders: Order[] = ordersRes.data.data?.orders ?? ordersRes.data.data ?? [];

      // Order aktif: accepted atau on_progress (assign ke driver ini)
      const active = allOrders.find(
        (o) => o.status === 'accepted' || o.status === 'on_progress'
      ) ?? null;

      // Tersedia: pending saja
      const available = allOrders.filter((o) => o.status === 'pending');

      setActiveOrder(active);
      setPendingOrders(available);

      // Stats
      const completed = allOrders.filter((o) => o.status === 'completed');
      const todayStr = new Date().toDateString();
      const todayCompleted = completed.filter(
        (o) => new Date(o.created_at).toDateString() === todayStr
      );
      setStats({
        today_orders: todayCompleted.length,
        today_earnings: todayCompleted.reduce((sum, o) => sum + Number(o.price), 0),
        total_completed: completed.length,
        rating: 5.0,
      });
    } catch (e) {
      console.log('fetchData error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => {
    fetchData();
  }, []));

  const handleToggleStatus = async () => {
    // Backend belum punya endpoint toggle status driver
    // Simpan state lokal saja untuk UX
    const newStatus = isOnline ? 'offline' : 'online';
    setIsOnline(!isOnline);
    updateUser({
      driver_profile: {
        ...user?.driver_profile!,
        status: newStatus,
      },
    });
  };

  const handleAcceptOrder = async (orderId: string) => {
    try {
      await api.put(`/driver/orders/${orderId}/accept`);
      Alert.alert('Berhasil', 'Pesanan diterima! Segera jemput pelanggan.', [
        { text: 'Lihat Detail', onPress: () => router.push(`/driver/order/${orderId}` as any) },
        { text: 'OK', onPress: () => fetchData(true) },
      ]);
    } catch (e: any) {
      Alert.alert('Gagal', e.message || 'Tidak dapat menerima pesanan');
    }
  };

  const handleRejectOrder = async (orderId: string) => {
    Alert.alert('Tolak Pesanan', 'Yakin ingin menolak pesanan ini?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Tolak', style: 'destructive',
        onPress: async () => {
          try {
            await api.put(`/driver/orders/${orderId}/reject`);
            fetchData(true);
          } catch {}
        },
      },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color={GREEN} />
      </SafeAreaView>
    );
  }

  const vehicleIcon = user?.driver_profile?.vehicle_type === 'mobil' ? Car : Bike;
  const VehicleIcon = vehicleIcon;

  return (
    <SafeAreaView style={styles.flex} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={GREEN} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchData(true); }}
            tintColor={GREEN}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greeting}>
                Halo, {user?.name?.split(' ')[0]} 👋
              </Text>
              <View style={styles.vehicleRow}>
                <VehicleIcon size={13} color="rgba(255,255,255,0.85)" />
                <Text style={styles.vehicleText}>
                  {user?.driver_profile?.vehicle_type === 'mobil' ? 'Mobil' : 'Motor'} ·{' '}
                  {user?.driver_profile?.license_plate ?? '-'}
                </Text>
              </View>
            </View>

            {/* Online Toggle */}
            <View style={styles.toggleWrap}>
              <View style={styles.toggleRow}>
                {isOnline && (
                  <Animated.View
                    style={[styles.onlinePulse, { transform: [{ scale: pulseAnim }] }]}
                  />
                )}
                <View style={[styles.onlineDot, { backgroundColor: isOnline ? LIGHT_GREEN : '#9CA3AF' }]} />
              </View>
              <Text style={styles.toggleLabel}>{isOnline ? 'Online' : 'Offline'}</Text>
              <Switch
                value={isOnline}
                onValueChange={handleToggleStatus}
                trackColor={{ false: 'rgba(255,255,255,0.3)', true: 'rgba(255,255,255,0.5)' }}
                thumbColor={isOnline ? '#fff' : 'rgba(255,255,255,0.7)'}
                style={{ marginLeft: 6 }}
              />
            </View>
          </View>

          {/* Status Banner */}
          <View style={[styles.statusBanner, { backgroundColor: isOnline ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)' }]}>
            <Zap size={14} color={isOnline ? '#fff' : 'rgba(255,255,255,0.6)'} />
            <Text style={[styles.statusBannerText, { opacity: isOnline ? 1 : 0.7 }]}>
              {isOnline
                ? 'Kamu sedang online — siap menerima pesanan'
                : 'Kamu sedang offline — aktifkan untuk menerima pesanan'}
            </Text>
          </View>
        </View>

        <View style={styles.content}>
          {/* Stats */}
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: '#FFF7ED' }]}>
                <Package size={20} color="#F97316" />
              </View>
              <Text style={styles.statValue}>{stats.today_orders}</Text>
              <Text style={styles.statLabel}>Pesanan Hari Ini</Text>
            </View>
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: '#F0FDF4' }]}>
                <TrendingUp size={20} color={GREEN} />
              </View>
              <Text style={styles.statValue}>
                Rp {(stats.today_earnings / 1000).toFixed(0)}K
              </Text>
              <Text style={styles.statLabel}>Pendapatan Hari Ini</Text>
            </View>
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: '#EFF6FF' }]}>
                <CheckCircle2 size={20} color="#3B82F6" />
              </View>
              <Text style={styles.statValue}>{stats.total_completed}</Text>
              <Text style={styles.statLabel}>Total Selesai</Text>
            </View>
          </View>

          {/* Active Order — selalu tampil jika ada, terlepas status online */}
          {activeOrder && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Pesanan Aktif</Text>
              <Pressable
                style={styles.activeOrderCard}
                onPress={() => router.push(`/driver/order/${activeOrder.id}` as any)}
              >
                <View style={styles.activeOrderHeader}>
                  <View style={styles.activeOrderBadge}>
                    <View style={styles.activeDot} />
                    <Text style={styles.activeOrderBadgeText}>
                      {STATUS_CFG[activeOrder.status]?.label ?? activeOrder.status}
                    </Text>
                  </View>
                  <Text style={styles.activeOrderPrice}>
                    Rp {Number(activeOrder.price).toLocaleString('id-ID')}
                  </Text>
                </View>
                <View style={styles.routeRow}>
                  <View style={styles.routeDots}>
                    <View style={[styles.dot, { borderColor: GREEN }]} />
                    <View style={styles.dotLine} />
                    <View style={[styles.dot, { borderColor: '#F59E0B' }]} />
                  </View>
                  <View style={styles.routeTexts}>
                    <Text style={styles.routeLabel}>Jemput</Text>
                    <Text style={styles.routeValue} numberOfLines={1}>
                      {activeOrder.pickup_location}
                    </Text>
                    <Text style={[styles.routeLabel, { marginTop: 10 }]}>Antar</Text>
                    <Text style={styles.routeValue} numberOfLines={1}>
                      {activeOrder.destination_location}
                    </Text>
                  </View>
                </View>
                <View style={styles.activeOrderFooter}>
                  <Navigation size={14} color={GREEN} />
                  <Text style={styles.activeOrderFooterText}>Ketuk untuk lihat detail & navigasi</Text>
                  <ChevronRight size={14} color={GREEN} />
                </View>
              </Pressable>
            </View>
          )}

          {/* Available Orders */}
          {isOnline && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Pesanan Tersedia</Text>
                {pendingOrders.length > 0 && (
                  <View style={styles.countBadge}>
                    <Text style={styles.countBadgeText}>{pendingOrders.length}</Text>
                  </View>
                )}
              </View>

              {pendingOrders.length === 0 ? (
                <View style={styles.emptyOrders}>
                  <Clock size={40} color="#D1D5DB" />
                  <Text style={styles.emptyTitle}>Belum ada pesanan</Text>
                  <Text style={styles.emptyDesc}>
                    Pesanan baru akan muncul di sini secara otomatis
                  </Text>
                </View>
              ) : (
                pendingOrders.map((order) => (
                  <AvailableOrderCard
                    key={order.id}
                    order={order}
                    onAccept={() => handleAcceptOrder(order.id)}
                    onReject={() => handleRejectOrder(order.id)}
                  />
                ))
              )}
            </View>
          )}

          {!isOnline && (
            <View style={styles.offlineBanner}>
              <Text style={styles.offlineEmoji}>😴</Text>
              <Text style={styles.offlineTitle}>Kamu sedang offline</Text>
              <Text style={styles.offlineDesc}>
                Aktifkan status online untuk mulai menerima pesanan dari pelanggan
              </Text>
              <Pressable style={styles.goOnlineBtn} onPress={handleToggleStatus}>
                <Zap size={16} color="#fff" />
                <Text style={styles.goOnlineBtnText}>Mulai Online</Text>
              </Pressable>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function AvailableOrderCard({
  order,
  onAccept,
  onReject,
}: {
  order: Order;
  onAccept: () => void;
  onReject: () => void;
}) {
  const [countdown, setCountdown] = useState(30);

  useEffect(() => {
    if (countdown <= 0) {
      onReject();
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const progress = countdown / 30;

  return (
    <View style={styles.orderCard}>
      {/* Timer bar */}
      <View style={styles.timerBarBg}>
        <View style={[styles.timerBarFill, { width: `${progress * 100}%` }]} />
      </View>

      <View style={styles.orderCardBody}>
        <View style={styles.orderCardTop}>
          <View style={styles.orderServiceBadge}>
            <Text style={styles.orderServiceText}>{order.service?.name ?? 'Layanan'}</Text>
          </View>
          <View style={styles.timerBadge}>
            <Clock size={11} color={countdown <= 10 ? '#EF4444' : '#6B7280'} />
            <Text style={[styles.timerText, countdown <= 10 && { color: '#EF4444' }]}>
              {countdown}s
            </Text>
          </View>
        </View>

        <View style={styles.routeRow}>
          <View style={styles.routeDots}>
            <View style={[styles.dot, { borderColor: GREEN }]} />
            <View style={styles.dotLine} />
            <View style={[styles.dot, { borderColor: '#F59E0B' }]} />
          </View>
          <View style={styles.routeTexts}>
            <Text style={styles.routeLabel}>Jemput</Text>
            <Text style={styles.routeValue} numberOfLines={1}>{order.pickup_location}</Text>
            <Text style={[styles.routeLabel, { marginTop: 8 }]}>Antar</Text>
            <Text style={styles.routeValue} numberOfLines={1}>{order.destination_location}</Text>
          </View>
        </View>

        <View style={styles.orderCardFooter}>
          <Text style={styles.orderPrice}>
            Rp {Number(order.price).toLocaleString('id-ID')}
          </Text>
          <View style={styles.orderActions}>
            <Pressable style={styles.rejectBtn} onPress={onReject}>
              <Text style={styles.rejectBtnText}>Tolak</Text>
            </Pressable>
            <Pressable style={styles.acceptBtn} onPress={onAccept}>
              <Text style={styles.acceptBtnText}>Terima</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#F7F8FA' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F7F8FA' },

  // Header
  header: {
    backgroundColor: GREEN,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  greeting: { color: '#fff', fontSize: 20, fontWeight: '800', letterSpacing: -0.3 },
  vehicleRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 },
  vehicleText: { color: 'rgba(255,255,255,0.85)', fontSize: 12 },

  toggleWrap: { flexDirection: 'row', alignItems: 'center' },
  toggleRow: { position: 'relative', alignItems: 'center', justifyContent: 'center', marginRight: 4 },
  onlinePulse: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(74, 222, 128, 0.4)',
  },
  onlineDot: { width: 10, height: 10, borderRadius: 5 },
  toggleLabel: { color: '#fff', fontSize: 12, fontWeight: '700' },

  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  statusBannerText: { color: '#fff', fontSize: 12, flex: 1 },

  content: { padding: 20 },

  // Stats
  statsGrid: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  statIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  statValue: { fontSize: 16, fontWeight: '800', color: '#111827', letterSpacing: -0.3 },
  statLabel: { fontSize: 10, color: '#9CA3AF', textAlign: 'center', marginTop: 2, fontWeight: '600' },

  // Section
  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#111827', letterSpacing: -0.3, marginBottom: 12 },
  countBadge: {
    backgroundColor: GREEN,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginBottom: 12,
  },
  countBadgeText: { color: '#fff', fontSize: 11, fontWeight: '800' },

  // Active Order
  activeOrderCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 2,
    borderColor: '#BBF7D0',
    shadowColor: GREEN,
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  activeOrderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  activeOrderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  activeDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: GREEN },
  activeOrderBadgeText: { color: DARK_GREEN, fontSize: 12, fontWeight: '700' },
  activeOrderPrice: { fontSize: 16, fontWeight: '800', color: DARK_GREEN },
  activeOrderFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0FDF4',
  },
  activeOrderFooterText: { flex: 1, color: GREEN, fontSize: 12, fontWeight: '600' },

  // Route
  routeRow: { flexDirection: 'row', gap: 12 },
  routeDots: { alignItems: 'center', paddingTop: 4 },
  dot: { width: 12, height: 12, borderRadius: 6, borderWidth: 2.5, backgroundColor: '#fff' },
  dotLine: { width: 2, height: 28, backgroundColor: '#E5E7EB', marginVertical: 3 },
  routeTexts: { flex: 1 },
  routeLabel: { fontSize: 11, color: '#9CA3AF', fontWeight: '600', marginBottom: 2 },
  routeValue: { fontSize: 13, fontWeight: '600', color: '#374151' },

  // Available Order Card
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  timerBarBg: { height: 4, backgroundColor: '#F3F4F6' },
  timerBarFill: { height: 4, backgroundColor: GREEN, borderRadius: 2 },
  orderCardBody: { padding: 16 },
  orderCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderServiceBadge: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  orderServiceText: { color: DARK_GREEN, fontSize: 12, fontWeight: '700' },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  timerText: { fontSize: 12, fontWeight: '700', color: '#6B7280' },
  orderCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F7F8FA',
  },
  orderPrice: { fontSize: 16, fontWeight: '800', color: DARK_GREEN },
  orderActions: { flexDirection: 'row', gap: 8 },
  rejectBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
  },
  rejectBtnText: { color: '#EF4444', fontWeight: '700', fontSize: 13 },
  acceptBtn: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: GREEN,
    shadowColor: GREEN,
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  acceptBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  // Empty
  emptyOrders: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    borderStyle: 'dashed',
  },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: '#374151', marginTop: 12 },
  emptyDesc: { fontSize: 13, color: '#9CA3AF', textAlign: 'center', marginTop: 6, paddingHorizontal: 24 },

  // Offline
  offlineBanner: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 32,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  offlineEmoji: { fontSize: 48, marginBottom: 12 },
  offlineTitle: { fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 8 },
  offlineDesc: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  goOnlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: GREEN,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14,
    shadowColor: GREEN,
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  goOnlineBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
