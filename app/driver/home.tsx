import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator,
  RefreshControl, Alert, Switch, StatusBar, Animated, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  Navigation, Package, CheckCircle2, Clock,
  TrendingUp, Bike, Car, ChevronRight, Zap, History, Bell, QrCode, X,
} from 'lucide-react-native';
import QRCode from 'react-native-qrcode-svg';
import api from '../../lib/api';
import { useAuthStore } from '../../lib/authStore';
import { useNotificationStore } from '../../lib/notificationStore';
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
  const { unreadCount } = useNotificationStore();
  const [isActive, setIsActive] = useState(user?.is_active ?? true);
  const [togglingActive, setTogglingActive] = useState(false);
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [allActiveOrders, setAllActiveOrders] = useState<Order[]>([]);
  const [qrOrder, setQrOrder] = useState<Order | null>(null);
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
    if (isActive) {
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
  }, [isActive]);

  const fetchData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const ordersRes = await api.get('/driver/orders');
      console.log('driver/orders raw:', JSON.stringify(ordersRes.data));
      const allOrders: Order[] = ordersRes.data.data?.orders ?? ordersRes.data.data ?? [];

      // Urutkan terlama dulu (ascending created_at)
      const sorted = [...allOrders].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );

      // Order aktif: accepted atau on_progress (ambil yang paling baru untuk card utama)
      const active = sorted.find(
        (o) => o.status === 'accepted' || o.status === 'on_progress'
      ) ?? null;

      // Semua order non-completed untuk ditampilkan di home (pending, accepted, on_progress, cancelled)
      const nonCompleted = sorted.filter((o) => o.status !== 'completed');

      // Tersedia: pending saja
      const available = sorted.filter((o) => o.status === 'pending');

      setActiveOrder(active);
      setAllActiveOrders(nonCompleted);
      setPendingOrders(available);

      // Stats
      const completed = allOrders.filter((o) => o.status === 'completed');
      const todayStr = new Date().toDateString();
      const todayCompleted = completed.filter(
        (o) => new Date(o.created_at).toDateString() === todayStr
      );
      setStats({
        today_orders:   todayCompleted.length,
        today_earnings: todayCompleted.reduce((sum, o) => sum + Number(o.delivery_fee ?? o.price), 0),
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

  const handleToggleActive = async () => {
    if (togglingActive) return;
    setTogglingActive(true);
    const prev = isActive;
    setIsActive(!prev); // optimistic
    try {
      const res = await api.post('/driver/toggle-active');
      const newState: boolean = res.data.data.is_active;
      setIsActive(newState);
      updateUser({ is_active: newState });
    } catch (e: any) {
      setIsActive(prev); // revert
      Alert.alert('Gagal', e.message || 'Tidak dapat mengubah status aktif');
    } finally {
      setTogglingActive(false);
    }
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

  const handleStartTrip = async (orderId: string) => {
    Alert.alert('Mulai Perjalanan', 'Konfirmasi mulai perjalanan?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Ya',
        onPress: async () => {
          try {
            await api.put(`/driver/orders/${orderId}/process`);
            fetchData(true);
          } catch (e: any) {
            Alert.alert('Gagal', e.message || 'Tidak dapat update status');
          }
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

            {/* Bell + Active Status */}
            <View style={styles.headerRight}>
              <Pressable
                style={styles.bellBtn}
                onPress={() => router.push('/driver/notifications' as any)}
              >
                <Bell size={20} color="#fff" strokeWidth={1.8} />
                {unreadCount > 0 && (
                  <View style={styles.bellBadge}>
                    <Text style={styles.bellBadgeText}>
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </Text>
                  </View>
                )}
              </Pressable>

              {/* Active Status toggle */}
              <View style={styles.toggleWrap}>
              <View style={styles.toggleRow}>
                {isActive && (
                  <Animated.View
                    style={[styles.onlinePulse, { transform: [{ scale: pulseAnim }] }]}
                  />
                )}
                <View style={[styles.onlineDot, { backgroundColor: isActive ? LIGHT_GREEN : '#9CA3AF' }]} />
              </View>
              <Text style={styles.toggleLabel}>{isActive ? 'Aktif' : 'Nonaktif'}</Text>
              <Switch
                value={isActive}
                onValueChange={handleToggleActive}
                disabled={togglingActive}
                trackColor={{ false: 'rgba(255,255,255,0.3)', true: 'rgba(255,255,255,0.5)' }}
                thumbColor={isActive ? '#fff' : 'rgba(255,255,255,0.7)'}
                style={{ marginLeft: 6 }}
              />
              </View>
            </View>
          </View>

          {/* Status Banner */}
          <View style={[styles.statusBanner, { backgroundColor: isActive ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)' }]}>
            <Zap size={14} color={isActive ? '#fff' : 'rgba(255,255,255,0.6)'} />
            <Text style={[styles.statusBannerText, { opacity: isActive ? 1 : 0.7 }]}>
              {isActive
                ? 'Kamu sedang aktif — siap menerima pesanan'
                : 'Kamu nonaktif — aktifkan untuk menerima pesanan'}
            </Text>
          </View>
        </View>

        <View style={styles.content}>
          {/* Stats + History shortcut */}
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

          {/* History shortcut */}
          <Pressable style={styles.historyShortcut} onPress={() => router.push('/driver/history' as any)}>
            <View style={styles.historyLeft}>
              <View style={styles.historyIcon}>
                <History size={18} color={GREEN} />
              </View>
              <View>
                <Text style={styles.historyTitle}>History Pesanan</Text>
                <Text style={styles.historyDesc}>{stats.total_completed} pesanan selesai</Text>
              </View>
            </View>
            <ChevronRight size={18} color="#9CA3AF" />
          </Pressable>

          {/* Semua pesanan non-completed (terlama dulu) */}
          {allActiveOrders.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Semua Pesanan</Text>
              {allActiveOrders.map((order) => {
                const cfg = STATUS_CFG[order.status];
                const isRunning = order.status === 'accepted' || order.status === 'on_progress';
                return (
                  <Pressable
                    key={order.id}
                    style={styles.orderListCard}
                    onPress={() => router.push(`/driver/order/${order.id}` as any)}
                  >
                    <View style={styles.orderListTop}>
                      <View style={[styles.statusBadge, { backgroundColor: cfg?.bg ?? '#F3F4F6' }]}>
                        {isRunning && <View style={[styles.statusDot, { backgroundColor: cfg.color }]} />}
                        <Text style={[styles.statusBadgeText, { color: cfg?.color ?? '#374151' }]}>
                          {cfg?.label ?? order.status}
                        </Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={styles.orderListPrice}>
                          Rp {Number(order.delivery_fee ?? order.price).toLocaleString('id-ID')}
                        </Text>
                        <Text style={styles.orderListPriceLabel}>ongkir</Text>
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
                    {/* Action buttons untuk order aktif */}
                    {order.status === 'accepted' && (
                      <View style={styles.orderListActions}>
                        <Pressable style={styles.startTripBtn} onPress={() => handleStartTrip(order.id)}>
                          <Package size={14} color="#fff" />
                          <Text style={styles.startTripBtnText}>Mulai Perjalanan</Text>
                        </Pressable>
                      </View>
                    )}
                    {order.status === 'on_progress' && (
                      <View style={styles.orderListActions}>
                        <Pressable style={styles.showQrBtn} onPress={() => setQrOrder(order)}>
                          <QrCode size={14} color="#fff" />
                          <Text style={styles.showQrBtnText}>Tampilkan QR Code</Text>
                        </Pressable>
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>
          )}

          {/* Available Orders (pending) */}
          {isActive && (
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

          {!isActive && (
            <View style={styles.offlineBanner}>
              <Text style={styles.offlineEmoji}>😴</Text>
              <Text style={styles.offlineTitle}>Kamu sedang nonaktif</Text>
              <Text style={styles.offlineDesc}>
                Aktifkan status untuk mulai menerima pesanan dari pelanggan
              </Text>
              <Pressable style={styles.goOnlineBtn} onPress={handleToggleActive}>
                <Zap size={16} color="#fff" />
                <Text style={styles.goOnlineBtnText}>Aktifkan Sekarang</Text>
              </Pressable>
            </View>
          )}
        </View>
      </ScrollView>

      {/* QR Code Modal */}
      <Modal visible={!!qrOrder} transparent animationType="fade" onRequestClose={() => setQrOrder(null)}>
        <Pressable style={styles.qrOverlay} onPress={() => setQrOrder(null)}>
          <Pressable onPress={e => e.stopPropagation()} style={styles.qrCard}>
            <Pressable style={styles.qrCloseBtn} onPress={() => setQrOrder(null)}>
              <X size={18} color="#374151" />
            </Pressable>
            <Text style={styles.qrTitle}>QR Code Penyelesaian</Text>
            <Text style={styles.qrDesc}>
              Tunjukkan QR ini ke pelanggan untuk di-scan dan menyelesaikan pesanan
            </Text>
            {(qrOrder as any)?.completion_token ? (
              <View style={styles.qrBox}>
                <QRCode value={(qrOrder as any).completion_token} size={220} />
              </View>
            ) : (
              <View style={styles.qrBox}>
                <Text style={{ color: '#9CA3AF', textAlign: 'center' }}>
                  QR belum tersedia.{'\n'}Pastikan pesanan sudah dalam status "Dalam Perjalanan"
                </Text>
              </View>
            )}
            <View style={styles.qrOrderInfo}>
              <Text style={styles.qrOrderDest} numberOfLines={1}>
                📍 {qrOrder?.destination_location}
              </Text>
              <Text style={styles.qrOrderPrice}>
                Rp {Number(qrOrder?.price ?? 0).toLocaleString('id-ID')}
              </Text>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
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

  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bellBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  bellBadge: {
    position: 'absolute', top: 0, right: 0,
    backgroundColor: '#EF4444', borderRadius: 8,
    minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 3,
  },
  bellBadgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },
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

  // Active Status Card
  activeStatusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  activeStatusLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  activeStatusDot: { width: 10, height: 10, borderRadius: 5 },
  activeStatusTitle: { fontSize: 14, fontWeight: '700', color: '#111827' },
  activeStatusDesc: { fontSize: 11, color: '#6B7280', marginTop: 2 },

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

  // History shortcut
  historyShortcut: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  historyLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  historyIcon: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: '#F0FDF4', alignItems: 'center', justifyContent: 'center',
  },
  historyTitle: { fontSize: 14, fontWeight: '700', color: '#111827' },
  historyDesc: { fontSize: 11, color: '#6B7280', marginTop: 1 },

  // Order list card (semua pesanan non-completed)
  orderListCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  orderListTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusBadgeText: { fontSize: 12, fontWeight: '700' },
  orderListPrice: { fontSize: 14, fontWeight: '800', color: DARK_GREEN },
  orderListPriceLabel: { fontSize: 10, color: '#9CA3AF', fontWeight: '600' },
  orderListActions: { marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F3F4F6' },

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
  activeOrderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0FDF4',
  },
  detailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#BBF7D0',
    backgroundColor: '#F0FDF4',
  },
  detailBtnText: { color: GREEN, fontWeight: '700', fontSize: 12 },
  startTripBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: '#3B82F6',
    shadowColor: '#3B82F6',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  startTripBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  showQrBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: GREEN,
    shadowColor: GREEN,
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  showQrBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  // QR Modal
  qrOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center', justifyContent: 'center',
  },
  qrCard: {
    backgroundColor: '#fff', borderRadius: 24, padding: 24,
    alignItems: 'center', width: 300, gap: 12,
  },
  qrCloseBtn: {
    position: 'absolute', top: 12, right: 12,
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center',
  },
  qrTitle: { fontSize: 16, fontWeight: '800', color: '#111827', textAlign: 'center' },
  qrDesc: { fontSize: 12, color: '#6B7280', textAlign: 'center', lineHeight: 17 },
  qrBox: {
    padding: 16, backgroundColor: '#fff',
    borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB',
    alignItems: 'center', justifyContent: 'center', minHeight: 120,
  },
  qrOrderInfo: {
    width: '100%', backgroundColor: '#F9FAFB', borderRadius: 12,
    padding: 12, gap: 4,
  },
  qrOrderDest: { fontSize: 12, color: '#374151', fontWeight: '600' },
  qrOrderPrice: { fontSize: 14, fontWeight: '800', color: DARK_GREEN },

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
