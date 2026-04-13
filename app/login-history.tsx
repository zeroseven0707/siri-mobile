import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { Clock, Smartphone } from 'lucide-react-native';
import CustomHeader from '../components/CustomHeader';
import api from '../lib/api';

const GREEN = '#2ECC71';

export default function LoginHistoryScreen() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHistory = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const res = await api.get('/account/login-history');
      setHistory(res.data.data || []);
    } catch (err) {
      console.log('Gagal ambil riwayat login:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.iconBox}>
        <Clock size={24} color="#4B5563" />
      </View>
      <View style={styles.content}>
        <Text style={styles.deviceName}>{item.device || 'Perangkat Tidak Dikenal'}</Text>
        <Text style={styles.details}>{item.ip_address} • {item.platform || 'System'}</Text>
        <Text style={styles.date}>
          {new Date(item.logged_in_at).toLocaleDateString('id-ID', {
            day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
          })}
        </Text>
      </View>
      {item.success && (
        <View style={styles.successBadge}>
          <Text style={styles.successText}>Berhasil</Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.flex}>
      <CustomHeader title="Riwayat Login" />
      
      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={GREEN} />
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchHistory(false); }} tintColor={GREEN} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Clock size={60} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>Belum ada riwayat</Text>
              <Text style={styles.emptySubtitle}>Aktivitas login Anda akan muncul di sini.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#F9FAFB' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 16 },
  card: { 
    flexDirection: 'row', 
    backgroundColor: '#fff', 
    borderRadius: 16, 
    padding: 16, 
    marginBottom: 12, 
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  iconBox: { width: 50, height: 50, borderRadius: 12, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  content: { flex: 1 },
  deviceName: { fontSize: 15, fontWeight: '700', color: '#1F2937' },
  details: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  date: { fontSize: 11, color: '#9CA3AF', marginTop: 4 },
  successBadge: { backgroundColor: '#DCFCE7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  successText: { fontSize: 10, color: '#15803D', fontWeight: '700' },
  empty: { alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#374151', marginTop: 16 },
  emptySubtitle: { fontSize: 14, color: '#9CA3AF', marginTop: 4 },
});
