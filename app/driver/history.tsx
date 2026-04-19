import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { ArrowLeft, CheckCircle2, ChevronRight, XCircle } from 'lucide-react-native';
import api from '../../lib/api';
import { Order } from '../../types';
import { formatDistanceToNow } from '../../lib/timeAgo';

const GREEN = '#16a34a';
const DARK_GREEN = '#15803d';

export default function DriverHistoryScreen() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchHistory = async (p = 1, refresh = false) => {
    try {
      const res = await api.get(`/driver/orders?status=completed&page=${p}`);
      const data: Order[] = res.data.data?.orders ?? [];
      const pagination = res.data.data?.pagination;

      if (refresh || p === 1) {
        setOrders(data);
      } else {
        setOrders(prev => [...prev, ...data]);
      }

      setHasMore(pagination ? pagination.current_page < pagination.last_page : false);
      setPage(p);
    } catch { }
    finally { setLoading(false); setRefreshing(false); setLoadingMore(false); }
  };

  useFocusEffect(useCallback(() => {
    fetchHistory(1);
  }, []));

  const onRefresh = () => { setRefreshing(true); fetchHistory(1, true); };

  const onEndReached = () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    fetchHistory(page + 1);
  };

  const totalEarnings = orders.reduce((sum, o) => sum + Number(o.delivery_fee ?? o.price), 0);

  if (loading) return (
    <SafeAreaView style={styles.center}>
      <ActivityIndicator size="large" color={GREEN} />
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={styles.flex} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <ArrowLeft size={22} color="#111827" />
        </Pressable>
        <Text style={styles.headerTitle}>History Pesanan</Text>
        <View style={{ width: 22 }} />
      </View>

      {/* Summary */}
      {orders.length > 0 && (
        <View style={styles.summary}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{orders.length}</Text>
            <Text style={styles.summaryLabel}>Total Pesanan</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>
              Rp {(totalEarnings / 1000).toFixed(0)}K
            </Text>
            <Text style={styles.summaryLabel}>Total Pendapatan</Text>
          </View>
        </View>
      )}

      <FlatList
        data={orders}
        keyExtractor={o => o.id}
        contentContainerStyle={{ padding: 16, gap: 10 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={GREEN} />}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.4}
        ListEmptyComponent={
          <View style={styles.empty}>
            <CheckCircle2 size={48} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>Belum ada history</Text>
            <Text style={styles.emptyDesc}>Pesanan yang selesai akan muncul di sini</Text>
          </View>
        }
        ListFooterComponent={loadingMore
          ? <ActivityIndicator color={GREEN} style={{ marginVertical: 16 }} />
          : null}
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() => router.push(`/driver/order/${item.id}` as any)}
          >
            <View style={styles.cardTop}>
              <View style={styles.completedBadge}>
                <CheckCircle2 size={13} color={GREEN} />
                <Text style={styles.completedText}>Selesai</Text>
              </View>
              <Text style={styles.cardPrice}>
                Rp {Number(item.delivery_fee ?? item.price).toLocaleString('id-ID')}
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
                <Text style={styles.routeValue} numberOfLines={1}>{item.pickup_location}</Text>
                <Text style={[styles.routeLabel, { marginTop: 8 }]}>Antar</Text>
                <Text style={styles.routeValue} numberOfLines={1}>{item.destination_location}</Text>
              </View>
            </View>

            <View style={styles.cardFooter}>
              <Text style={styles.cardTime}>{formatDistanceToNow(item.created_at)}</Text>
              <ChevronRight size={16} color="#9CA3AF" />
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
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  headerTitle: { fontSize: 16, fontWeight: '800', color: '#111827' },

  summary: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryValue: { fontSize: 20, fontWeight: '800', color: DARK_GREEN },
  summaryLabel: { fontSize: 11, color: '#6B7280', marginTop: 3, fontWeight: '600' },
  summaryDivider: { width: 1, backgroundColor: '#F3F4F6', marginVertical: 4 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTop: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12,
  },
  completedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#DCFCE7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
  },
  completedText: { color: GREEN, fontSize: 12, fontWeight: '700' },
  cardPrice: { fontSize: 14, fontWeight: '800', color: DARK_GREEN },

  routeRow: { flexDirection: 'row', gap: 12 },
  routeDots: { alignItems: 'center', paddingTop: 4 },
  dot: { width: 11, height: 11, borderRadius: 6, borderWidth: 2.5, backgroundColor: '#fff' },
  dotLine: { width: 2, height: 26, backgroundColor: '#E5E7EB', marginVertical: 3 },
  routeTexts: { flex: 1 },
  routeLabel: { fontSize: 11, color: '#9CA3AF', fontWeight: '600', marginBottom: 2 },
  routeValue: { fontSize: 13, fontWeight: '600', color: '#374151' },

  cardFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F9FAFB',
  },
  cardTime: { fontSize: 11, color: '#9CA3AF' },

  empty: { alignItems: 'center', paddingTop: 80 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#374151', marginTop: 16 },
  emptyDesc: { color: '#9CA3AF', marginTop: 6, fontSize: 13 },
});
