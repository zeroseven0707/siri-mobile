import React, { useCallback, useState, useEffect } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import api from '../lib/api';
import { Transaction } from '../types';
import CustomHeader from '../components/CustomHeader';
import { Stack } from 'expo-router';

export default function HistoryScreen() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetch = async (isInitial = false) => {
    if (isInitial) setLoading(true);
    try {
      const res = await api.get('/transactions');
      setTransactions(res.data.data.transactions ?? []);
    }
    catch { }
    finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  useEffect(() => { fetch(true); }, []);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#2ECC71" /></View>;

  return (
    <View style={styles.flex}>
      <Stack.Screen options={{ headerShown: false }} />
      <CustomHeader title="Riwayat Transaksi" />
      <FlatList
        data={transactions}
        keyExtractor={t => t.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetch(); }} tintColor="#2ECC71" />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="time-outline" size={56} color="#D1D5DB" />
            <Text style={styles.emptyText}>Belum ada riwayat</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={[styles.iconBox, { backgroundColor: item.type === 'payment' ? '#FEF2F2' : '#F0FDF4' }]}>
              <Ionicons name={item.type === 'payment' ? 'arrow-up-outline' : 'arrow-down-outline'} size={20} color={item.type === 'payment' ? '#EF4444' : '#22C55E'} />
            </View>
            <View style={styles.info}>
              <Text style={styles.type}>{item.type === 'payment' ? 'Pembayaran' : 'Refund'}</Text>
              <Text style={styles.ref}>{item.reference ?? '-'}</Text>
            </View>
            <Text style={[styles.amount, { color: item.type === 'payment' ? '#EF4444' : '#22C55E' }]}>
              {item.type === 'payment' ? '-' : '+'}Rp {Number(item.amount).toLocaleString('id-ID')}
            </Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#F8FFF8' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FFF8' },
  header: { paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  title: { fontSize: 20, fontWeight: '700', color: '#1F2937' },
  list: { padding: 16, gap: 10 },
  empty: { alignItems: 'center', paddingVertical: 80 },
  emptyText: { color: '#9CA3AF', fontSize: 16, marginTop: 12 },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#F3F4F6' },
  iconBox: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  info: { flex: 1 },
  type: { fontWeight: '600', color: '#1F2937', fontSize: 14 },
  ref: { color: '#9CA3AF', fontSize: 12, marginTop: 2 },
  amount: { fontWeight: '700', fontSize: 14 },
});
