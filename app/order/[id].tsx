import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Pressable, Image } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Receipt, User, Info, FileText, ArrowLeft } from 'lucide-react-native';
import api from '../../lib/api';

const GREEN = '#2ECC71';
const DARK_GREEN = '#27AE60';

type OrderStatus = 'pending' | 'accepted' | 'on_progress' | 'completed' | 'cancelled';
const STATUS: Record<OrderStatus, { label: string; bg: string; color: string; desc: string }> = {
  pending:     { label: 'Menunggu Konfirmasi',   bg: '#FEF9C3', color: '#A16207', desc: 'Menunggu respon dari resto/driver' },
  accepted:    { label: 'Diterima',              bg: '#DBEAFE', color: '#1D4ED8', desc: 'Pesanan sedang disiapkan' },
  on_progress: { label: 'Dalam Perjalanan',      bg: '#EDE9FE', color: '#6D28D9', desc: 'Driver sedang mengantar pesanan' },
  completed:   { label: 'Selesai',               bg: '#DCFCE7', color: '#15803D', desc: 'Pesanan telah sampai tujuan' },
  cancelled:   { label: 'Dibatalkan',            bg: '#FEE2E2', color: '#B91C1C', desc: 'Pesanan telah dibatalkan' },
};

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await api.get(`/orders/${id}`);
        setOrder(res.data.data);
      } catch (err) {
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchOrder();
  }, [id]);

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
        <Text>Pesanan tidak ditemukan.</Text>
      </SafeAreaView>
    );
  }

  const st = STATUS[order.status as OrderStatus] || STATUS.pending;

  return (
    <>
      <Stack.Screen options={{ 
        title: 'Detail Pesanan', 
        headerStyle: { backgroundColor: GREEN }, 
        headerTintColor: '#fff',
      }} />
      <SafeAreaView edges={['bottom']} style={styles.container}>
        <ScrollView contentContainerStyle={styles.scroll}>
          
          {/* Status Header */}
          <View style={[styles.statusBox, { backgroundColor: st.bg }]}>
            <View style={styles.statusRow}>
               <Info size={24} color={st.color} />
               <View style={{ marginLeft: 12, flex: 1 }}>
                 <Text style={[styles.statusLabel, { color: st.color }]}>{st.label}</Text>
                 <Text style={[styles.statusDesc, { color: st.color }]}>{st.desc}</Text>
               </View>
            </View>
          </View>

          {/* Service Info */}
          {order.service && (
            <View style={styles.card}>
              <View style={styles.rowCenter}>
                <View style={styles.serviceIcon}>
                  <Receipt size={24} color={DARK_GREEN} />
                </View>
                <View style={{ marginLeft: 12 }}>
                  <Text style={styles.sectionTitle}>{order.service.name}</Text>
                  <Text style={styles.muted}>{new Date(order.created_at).toLocaleString('id-ID')}</Text>
                </View>
              </View>
            </View>
          )}

          {/* Map/Location Info */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Rute Pengiriman</Text>
            <View style={styles.routeContainer}>
              <View style={styles.routeDotLine}>
                <View style={[styles.dot, { borderColor: GREEN }]} />
                <View style={styles.line} />
                <View style={[styles.dot, { borderColor: '#F59E0B' }]} />
              </View>
              <View style={styles.routeTextContainer}>
                <View style={styles.routeItem}>
                  <Text style={styles.routeLabel}>Lokasi Penjemputan / Resto</Text>
                  <Text style={styles.routeValue}>{order.pickup_location}</Text>
                </View>
                <View style={[styles.routeItem, { marginTop: 20 }]}>
                  <Text style={styles.routeLabel}>Tujuan Pengiriman</Text>
                  <Text style={styles.routeValue}>{order.destination_location}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Driver Info */}
          {order.driver && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Informasi Driver</Text>
              <View style={styles.rowCenter}>
                 <View style={styles.driverAvatar}>
                   <User size={28} color="#D1D5DB" />
                 </View>
                 <View style={{ marginLeft: 16 }}>
                   <Text style={{ fontSize: 16, fontWeight: '700', color: '#1F2937' }}>{order.driver.name}</Text>
                   <Text style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }}>{order.driver.phone}</Text>
                 </View>
              </View>
            </View>
          )}

          {/* Detail Items */}
          {order.food_items && order.food_items.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Rincian Pesanan</Text>
              {order.food_items.map((fi: any) => {
                const ItemView = View as any;
                return (
                  <ItemView key={fi.id} style={styles.foodItem}>
                    <View style={styles.qtyBox}>
                      <Text style={styles.qtyText}>{fi.qty}x</Text>
                    </View>
                    <View style={{ flex: 1, paddingHorizontal: 12 }}>
                      <Text style={styles.foodName}>{fi.food_item.name}</Text>
                      {fi.food_item.description && (
                        <Text style={styles.foodDesc} numberOfLines={1}>{fi.food_item.description}</Text>
                      )}
                    </View>
                    <Text style={styles.foodPrice}>Rp {Number(fi.price).toLocaleString('id-ID')}</Text>
                  </ItemView>
                );
              })}
            </View>
          )}

          {/* Summary */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Ringkasan Pembayaran</Text>
            
            {order.notes ? (
              <View style={styles.notesBox}>
                <FileText size={16} color="#6B7280" />
                <Text style={styles.notesText}>Catatan: "{order.notes}"</Text>
              </View>
            ) : null}

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Harga</Text>
              <Text style={styles.summaryValue}>Rp {Number(order.price).toLocaleString('id-ID')}</Text>
            </View>
          </View>
          
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F9FAFB' },
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  scroll: { padding: 16, paddingBottom: 40 },
  statusBox: { padding: 16, borderRadius: 16, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  statusRow: { flexDirection: 'row', alignItems: 'center' },
  statusLabel: { fontSize: 16, fontWeight: 'bold', marginBottom: 2 },
  statusDesc: { fontSize: 13, opacity: 0.8 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, elevation: 1, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 14 },
  rowCenter: { flexDirection: 'row', alignItems: 'center' },
  serviceIcon: { width: 48, height: 48, backgroundColor: '#F0FDF4', borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1F2937' },
  muted: { fontSize: 13, color: '#6B7280', marginTop: 4 },
  routeContainer: { flexDirection: 'row', paddingVertical: 4 },
  routeDotLine: { alignItems: 'center', marginRight: 16, paddingTop: 4 },
  dot: { width: 14, height: 14, borderRadius: 7, borderWidth: 3, backgroundColor: '#fff' },
  line: { width: 2, height: 32, backgroundColor: '#E5E7EB', marginVertical: 4 },
  routeTextContainer: { flex: 1 },
  routeItem: {},
  routeLabel: { fontSize: 12, color: '#6B7280', marginBottom: 4 },
  routeValue: { fontSize: 14, fontWeight: '600', color: '#374151', lineHeight: 20 },
  driverAvatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E5E7EB' },
  foodItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  qtyBox: { paddingHorizontal: 8, paddingVertical: 4, backgroundColor: '#F0FDF4', borderRadius: 6, borderWidth: 1, borderColor: '#BBF7D0' },
  qtyText: { fontWeight: 'bold', color: DARK_GREEN, fontSize: 13 },
  foodName: { fontSize: 14, fontWeight: '600', color: '#1F2937' },
  foodDesc: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  foodPrice: { fontSize: 14, fontWeight: '700', color: '#111827' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  summaryLabel: { fontSize: 15, fontWeight: '600', color: '#374151' },
  summaryValue: { fontSize: 18, fontWeight: '800', color: DARK_GREEN },
  notesBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', padding: 12, borderRadius: 8, marginBottom: 16, borderWidth: 1, borderColor: '#E5E7EB' },
  notesText: { marginLeft: 8, fontSize: 13, color: '#4B5563', fontStyle: 'italic', flex: 1 }
});
