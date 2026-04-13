import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, RefreshControl, ActivityIndicator, Image, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, UtensilsCrossed, Bike, User } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import api from '../lib/api';
import { useOrderStore } from '../lib/orderStore';

const GREEN = '#2ECC71';

type OrderStatus = 'pending' | 'accepted' | 'on_progress' | 'completed' | 'cancelled';

interface TabItem {
  id: OrderStatus;
  label: string;
}

const TABS: TabItem[] = [
  { id: 'pending', label: 'Menunggu' },
  { id: 'accepted', label: 'Diproses' },
  { id: 'on_progress', label: 'Dikirim' },
  { id: 'completed', label: 'Selesai' },
  { id: 'cancelled', label: 'Dibatalkan' },
];

export default function OrdersScreen() {
  const { activeTab, setActiveTab } = useOrderStore();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const fetchOrders = async (status: string, showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const res = await api.get(`/orders?status=${status}`);
      setOrders(res.data.data.orders || []);
    } catch (err) {
      console.log('Error fetch orders:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders(activeTab);
  }, [activeTab]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchOrders(activeTab, false);
  }, [activeTab]);

  const renderOrderItem = ({ item }: { item: any }) => (
    <Pressable 
      style={styles.card} 
      onPress={() => router.push(`/order/${item.id}` as any)}
    >
      <View style={styles.cardHeader}>
        <View style={styles.serviceInfo}>
          <View style={styles.serviceIcon}>
             {item.service?.slug === 'food'
               ? <UtensilsCrossed size={20} color={GREEN} />
               : <Bike size={20} color={GREEN} />}
          </View>
          <View>
            <Text style={styles.serviceName}>{item.service?.name}</Text>
            <Text style={styles.orderDate}>
              {new Date(item.created_at).toLocaleDateString('id-ID', { 
                day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' 
              })}
            </Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusBg(item.status) }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {getStatusLabel(item.status)}
          </Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.locationRow}>
          <View style={styles.dot} />
          <Text style={styles.locationText} numberOfLines={1}>{item.pickup_location}</Text>
        </View>
        <View style={styles.line} />
        <View style={styles.locationRow}>
          <View style={[styles.dot, { backgroundColor: '#EF4444' }]} />
          <Text style={styles.locationText} numberOfLines={1}>{item.destination_location}</Text>
        </View>

        {item.food_items && item.food_items.length > 0 && (
          <View style={styles.foodPreview}>
            <Text style={styles.foodText}>
              {item.food_items[0].food_item.name} 
              {item.food_items.length > 1 ? ` +${item.food_items.length - 1} menu lainnya` : ''}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.cardFooter}>
        {item.driver ? (
          <View style={styles.driverInfo}>
            <View style={styles.driverAvatar}>
              <User size={14} color="#9CA3AF" />
            </View>
            <Text style={styles.driverName}>{item.driver.name}</Text>
          </View>
        ) : <View />}
        
        <Text style={styles.totalPrice}>Rp {Number(item.price).toLocaleString('id-ID')}</Text>
      </View>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.flex} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={24} color="#1F2937" />
        </Pressable>
        <Text style={styles.headerTitle}>Status Pesanan</Text>
      </View>

      {/* Tabs Selector */}
      <View style={styles.tabContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScroll}>
          {TABS.map((tab) => (
            <Pressable 
              key={tab.id} 
              onPress={() => setActiveTab(tab.id)}
              style={[styles.tabBtn, activeTab === tab.id && styles.tabBtnActive]}
            >
              <Text style={[styles.tabLabel, activeTab === tab.id && styles.tabLabelActive]}>
                {tab.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={GREEN} />
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          renderItem={renderOrderItem}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={GREEN} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Image 
                source={{ uri: 'https://cdn-icons-png.flaticon.com/512/2038/2038854.png' }} 
                style={styles.emptyImg} 
              />
              <Text style={styles.emptyTitle}>Belum ada pesanan</Text>
              <Text style={styles.emptyDesc}>Pesanan dengan status {getStatusLabel(activeTab)} tidak ditemukan.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'pending': return 'Menunggu';
    case 'accepted': return 'Diproses';
    case 'on_progress': return 'Dikirim';
    case 'completed': return 'Selesai';
    case 'cancelled': return 'Dibatalkan';
    default: return status;
  }
};

const getStatusBg = (status: string) => {
  switch (status) {
    case 'pending': return '#FEF9C3';
    case 'accepted': return '#DBEAFE';
    case 'on_progress': return '#EDE9FE';
    case 'completed': return '#DCFCE7';
    case 'cancelled': return '#FEE2E2';
    default: return '#F3F4F6';
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending': return '#A16207';
    case 'accepted': return '#1D4ED8';
    case 'on_progress': return '#6D28D9';
    case 'completed': return '#15803D';
    case 'cancelled': return '#B91C1C';
    default: return '#6B7280';
  }
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 16, 
    paddingVertical: 16, 
    backgroundColor: '#fff',
    gap: 12
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#1F2937' },
  
  tabContainer: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  tabScroll: { paddingHorizontal: 16, paddingBottom: 12 },
  tabBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 8, backgroundColor: '#F3F4F6' },
  tabBtnActive: { backgroundColor: GREEN },
  tabLabel: { fontSize: 13, color: '#6B7280', fontWeight: '600' },
  tabLabelActive: { color: '#fff' },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 16 },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 16, marginBottom: 16, elevation: 3, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, borderWidth: 1, borderColor: '#F3F4F6' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  serviceInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  serviceIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#F0FDF4', alignItems: 'center', justifyContent: 'center' },
  serviceName: { fontSize: 15, fontWeight: '800', color: '#111827' },
  orderDate: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 10, fontWeight: '700' },

  cardBody: { marginBottom: 16 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: GREEN },
  locationText: { flex: 1, fontSize: 13, color: '#4B5563' },
  line: { width: 1, height: 12, backgroundColor: '#E5E7EB', marginLeft: 3, marginVertical: 2 },
  foodPreview: { marginTop: 12, padding: 10, backgroundColor: '#F9FAFB', borderRadius: 10, borderLeftWidth: 3, borderLeftColor: GREEN },
  foodText: { fontSize: 12, color: '#374151', fontStyle: 'italic' },

  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  driverInfo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  driverAvatar: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  driverName: { fontSize: 13, color: '#4B5563', fontWeight: '500' },
  totalPrice: { fontSize: 16, fontWeight: '800', color: GREEN },

  empty: { alignItems: 'center', justifyContent: 'center', marginTop: 60 },
  emptyImg: { width: 150, height: 150, opacity: 0.5 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#374151', marginTop: 16 },
  emptyDesc: { fontSize: 14, color: '#9CA3AF', textAlign: 'center', marginTop: 8, paddingHorizontal: 40 },
});
