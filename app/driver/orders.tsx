import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable,
  ActivityIndicator, RefreshControl, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Receipt, MapPin, ChevronRight, Package } from 'lucide-react-native';
import api from '../../lib/api';
import { Order } from '../../types';

const GREEN = '#16a34a';
const DARK_GREEN = '#15803d';

const STATUS_CFG: Record<string, { label: string; bg: string; color: string }> = {
  pending:     { label: 'Menunggu',         bg: '#FEF9C3', color: '#A16207' },
  accepted:    { label: 'Diterima',         bg: '#DBEAFE', color: '#1D4ED8' },
  on_progress: { label: 'Dalam Perjalanan', bg: '#EDE9FE', color: '#6D28D9' },
  completed:   { label: 'Selesai',          bg: '#DCFCE7', color: '#15803D' },
  cancelled:   { label: 'Dibatalkan',       bg: '#FEE2E2', color: '#B91C1C' },
};

const TABS = [
  { key: 'all',         label: 'Semua' },
  { key: 'on_progress', label: 'Aktif' },
  { key: 'completed',   label: 'Selesai' },
  { key: 'cancelled',   label: 'Dibatalkan' },
] as const;

type TabKey = typeof TABS[number]['key'];

export default function DriverOrdersScreen() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('all');

  const fetchOrders = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await api.get('/driver/orders');
      setOrders(res.data.data.orders ?? []);
    } catch {}
    finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => {
    fetchOrders();
  }, []));

  const filtered = activeTab === 'all'
    ? orders
    : orders.filter((o) => o.status === activeTab);

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color={GREEN} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.flex} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Riwayat Pengiriman</Text>
        <Text style={styles.headerSub}>Semua pesanan yang pernah kamu kerjakan</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabsWrap}>
        <FlatList
          data={TABS}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(t) => t.key}
          contentContainerStyle={styles.tabs}
          renderItem={({ item }) => (
            <Pressable
              style={[styles.tab, activeTab === item.key && styles.tabActive]}
              onPress={() => setActiveTab(item.key)}
            >
              <Text style={[styles.tabText, activeTab === item.key && styles.tabTextActive]}>
                {item.label}
              </Text>
            </Pressable>
          )}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(o) => o.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchOrders(true); }}
            tintColor={GREEN}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Package size={56} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>Belum ada riwayat</Text>
            <Text style={styles.emptyDesc}>Pesanan yang sudah kamu kerjakan akan muncul di sini</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() => router.push(`/driver/order/${item.id}` as any)}
          >
            <View style={styles.cardTop}>
              <View style={styles.serviceIcon}>
                <Receipt size={20} color={DARK_GREEN} />
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.serviceName}>{item.service?.name ?? 'Layanan'}</Text>
                <View style={styles.locationRow}>
                  <MapPin size={11} color="#9CA3AF" />
                  <Text style={styles.locationText} numberOfLines={1}>
                    {item.pickup_location}
                  </Text>
                </View>
              </View>
              <View style={[styles.badge, { backgroundColor: STATUS_CFG[item.status]?.bg ?? '#F3F4F6' }]}>
                <Text style={[styles.badgeText, { color: STATUS_CFG[item.status]?.color ?? '#374151' }]}>
                  {STATUS_CFG[item.status]?.label ?? item.status}
                </Text>
              </View>
            </View>

            <View style={styles.cardBottom}>
              <Text style={styles.price}>
                Rp {Number(item.price).toLocaleString('id-ID')}
              </Text>
              <View style={styles.dateRow}>
                <Text style={styles.dateText}>
                  {new Date(item.created_at).toLocaleDateString('id-ID', {
                    day: 'numeric', month: 'short', year: 'numeric',
                  })}
                </Text>
                <ChevronRight size={14} color="#D1D5DB" />
              </View>
            </View>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#F7F8FA' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F7F8FA' },

  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#111827', letterSpacing: -0.3 },
  headerSub: { fontSize: 13, color: '#9CA3AF', marginTop: 2 },

  tabsWrap: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  tabs: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  tabActive: { backgroundColor: GREEN },
  tabText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  tabTextActive: { color: '#fff' },

  list: { padding: 16, gap: 10 },

  empty: { alignItems: 'center', paddingVertical: 80 },
  emptyTitle: { fontSize: 17, fontWeight: '800', color: '#374151', marginTop: 14 },
  emptyDesc: { fontSize: 13, color: '#9CA3AF', marginTop: 6, textAlign: 'center', paddingHorizontal: 32 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  serviceIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: { flex: 1 },
  serviceName: { fontWeight: '800', color: '#111827', fontSize: 14 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  locationText: { color: '#6B7280', fontSize: 12, flex: 1 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  badgeText: { fontSize: 10, fontWeight: '800' },

  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F7F8FA',
  },
  price: { color: DARK_GREEN, fontWeight: '800', fontSize: 15 },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dateText: { fontSize: 12, color: '#9CA3AF' },
});
