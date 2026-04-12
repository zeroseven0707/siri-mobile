import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl, Pressable, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CustomHeader from '../components/CustomHeader';
import api from '../lib/api';

const GREEN = '#2ECC71';

export default function DevicesScreen() {
  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDevices = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const res = await api.get('/account/devices');
      setDevices(res.data.data || []);
    } catch (err) {
      console.log('Gagal ambil data perangkat:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  const handleLogoutDevice = async (id: number, deviceName: string) => {
    Alert.alert(
      'Putuskan Koneksi?',
      `Apakah Anda yakin ingin mengeluarkan akun dari ${deviceName}?`,
      [
        { text: 'Batal', style: 'cancel' },
        { 
          text: 'Ya, Keluar', 
          style: 'destructive', 
          onPress: async () => {
            try {
              await api.delete(`/account/devices/${id}`);
              setDevices(prev => prev.filter(d => d.id !== id));
            } catch (err) {
              Alert.alert('Error', 'Gagal memutuskan koneksi perangkat.');
            }
          } 
        }
      ]
    );
  };

  const handleLogoutAll = async () => {
    Alert.alert(
      'Logout Semua?',
      'Anda akan dikeluarkan dari seluruh perangkat kecuali perangkat yang sedang Anda gunakan saat ini.',
      [
        { text: 'Batal', style: 'cancel' },
        { 
          text: 'Ya, Logout Semua', 
          style: 'destructive', 
          onPress: async () => {
            try {
              await api.delete('/account/devices');
              fetchDevices(false);
              Alert.alert('Sukses', 'Berhasil keluar dari semua perangkat lain.');
            } catch (err) {
              Alert.alert('Error', 'Gagal memproses permintaan.');
            }
          } 
        }
      ]
    );
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={[styles.card, item.is_current && styles.currentCard]}>
      <View style={[styles.iconBox, item.is_current && { backgroundColor: '#F0FDF4' }]}>
        <Ionicons 
          name={item.platform === 'ios' ? 'logo-apple' : 'logo-android'} 
          size={24} 
          color={item.is_current ? GREEN : '#4B5563'} 
        />
      </View>
      <View style={styles.content}>
        <View style={styles.nameRow}>
          <Text style={styles.deviceName}>{item.device || 'Perangkat Tidak Dikenal'}</Text>
          {item.is_current && (
            <View style={styles.currentBadge}>
              <Text style={styles.currentText}>Perangkat Ini</Text>
            </View>
          )}
        </View>
        <Text style={styles.details}>{item.ip_address || 'IP Tersembunyi'} • {item.platform || 'System'}</Text>
        <Text style={styles.date}>
          Aktif: {item.last_used_at ? new Date(item.last_used_at).toLocaleDateString('id-ID', {
            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
          }) : 'Baru saja'}
        </Text>
      </View>
      {!item.is_current && (
        <Pressable 
          style={styles.logoutBtn} 
          onPress={() => handleLogoutDevice(item.id, item.device)}
        >
          <Ionicons name="log-out-outline" size={22} color="#EF4444" />
        </Pressable>
      )}
    </View>
  );

  return (
    <View style={styles.flex}>
      <CustomHeader title="Perangkat Terhubung" />
      
      <View style={styles.headerAction}>
        <View style={styles.infoBanner}>
          <Ionicons name="shield-checkmark" size={18} color="#15803D" />
          <Text style={styles.infoText}>Berikut adalah perangkat yang saat ini memiliki akses ke akun Siri Anda.</Text>
        </View>
        
        {devices.filter(d => !d.is_current).length > 0 && (
          <Pressable style={styles.logoutAllFull} onPress={handleLogoutAll}>
            <Ionicons name="trash-outline" size={16} color="#EF4444" />
            <Text style={styles.logoutAllText}>Logout dari Semua Perangkat Lain</Text>
          </Pressable>
        )}
      </View>

      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={GREEN} />
        </View>
      ) : (
        <FlatList
          data={devices}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchDevices(false); }} tintColor={GREEN} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="phone-portrait-outline" size={60} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>Data tidak ditemukan</Text>
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
  infoBanner: { flexDirection: 'row', backgroundColor: '#DCFCE7', padding: 12, margin: 16, borderRadius: 12, gap: 10, alignItems: 'center' },
  infoText: { flex: 1, fontSize: 12, color: '#15803D', fontWeight: '500' },
  headerAction: { marginBottom: 8 },
  logoutAllFull: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginHorizontal: 16, marginBottom: 16, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#FEE2E2', backgroundColor: '#FEF2F2' },
  logoutAllText: { color: '#EF4444', fontSize: 13, fontWeight: '700' },
  list: { padding: 16, paddingTop: 0 },
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
  currentCard: { borderColor: GREEN, backgroundColor: '#FCFFFC' },
  iconBox: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  content: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  deviceName: { fontSize: 15, fontWeight: '700', color: '#1F2937' },
  details: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  date: { fontSize: 11, color: '#9CA3AF', marginTop: 4 },
  currentBadge: { backgroundColor: GREEN, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  currentText: { fontSize: 9, color: '#fff', fontWeight: '800' },
  logoutBtn: { padding: 8 },
  empty: { alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#374151', marginTop: 16 },
});
