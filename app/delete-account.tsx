import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import CustomHeader from '../components/CustomHeader';
import api from '../lib/api';

const GREEN = '#2ECC71';

export default function DeleteAccountScreen() {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [reason, setReason] = useState('');
  const router = useRouter();

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await api.get('/account/delete-request');
      setStatus(res.data.data);
    } catch (err) {
      setStatus(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleRequest = async () => {
    if (!reason.trim()) return Alert.alert('Error', 'Harap masukkan alasan Anda.');
    
    Alert.alert(
      'Konfirmasi Terakhir',
      'Apakah Anda benar-benar yakin ingin mengajukan penghapusan akun? Data Anda akan dihapus permanen setelah ditinjau.',
      [
        { text: 'Batal', style: 'cancel' },
        { 
          text: 'Ya, Ajukan', 
          style: 'destructive', 
          onPress: async () => {
            setSubmitting(true);
            try {
              await api.post('/account/delete-request', { reason });
              Alert.alert('Sukses', 'Permintaan penghapusan akun telah dikirim.');
              fetchStatus();
            } catch (err) {
              Alert.alert('Gagal', 'Terjadi kesalahan saat mengirim permintaan.');
            } finally {
              setSubmitting(false);
            }
          } 
        }
      ]
    );
  };

  const handleCancel = async () => {
    Alert.alert(
      'Batalkan Penghapusan?',
      'Akun Anda akan tetap aktif dan permintaan penghapusan akan dibatalkan.',
      [
        { text: 'Tidak', style: 'cancel' },
        { 
          text: 'Ya, Batalkan', 
          onPress: async () => {
            setSubmitting(true);
            try {
              await api.delete('/account/delete-request');
              Alert.alert('Dibatalkan', 'Permintaan penghapusan berhasil dibatalkan.');
              fetchStatus();
            } catch (err) {
              Alert.alert('Error', 'Gagal membatalkan permintaan.');
            } finally {
              setSubmitting(false);
            }
          } 
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={GREEN} />
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      <CustomHeader title="Hapus Akun" />
      
      <ScrollView contentContainerStyle={styles.scroll}>
        {status ? (
          <View style={styles.statusCard}>
            <View style={styles.statusHeader}>
              <Ionicons name="time-outline" size={40} color="#F59E0B" />
              <Text style={styles.statusTitle}>Permintaan Sedang Ditinjau</Text>
              <Text style={styles.statusBadge}>{status.status.toUpperCase()}</Text>
            </View>
            
            <View style={styles.statusInfo}>
              <Text style={styles.infoLabel}>Diajukan pada:</Text>
              <Text style={styles.infoVal}>
                {new Date(status.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
              </Text>
              
              {status.reason && (
                <>
                  <Text style={[styles.infoLabel, { marginTop: 12 }]}>Alasan:</Text>
                  <Text style={styles.infoVal}>"{status.reason}"</Text>
                </>
              )}
            </View>

            <Text style={styles.warningText}>
              Peninjauan biasanya memakan waktu 1-3 hari kerja. Anda masih bisa membatalkan permintaan ini sebelum akun dihapus.
            </Text>

            <Pressable 
              style={styles.cancelBtn} 
              onPress={handleCancel}
              disabled={submitting}
            >
              {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.cancelBtnText}>Batalkan Permintaan</Text>}
            </Pressable>
          </View>
        ) : (
          <View style={styles.card}>
            <View style={styles.warningBox}>
              <Ionicons name="warning-outline" size={24} color="#DC2626" />
              <Text style={styles.warningTitle}>Peringatan Penting</Text>
            </View>
            
            <Text style={styles.desc}>
              Menghapus akun akan mengakibatkan:
            </Text>
            <View style={styles.list}>
              <Text style={styles.listItem}>• Seluruh riwayat pesanan akan dihapus.</Text>
              <Text style={styles.listItem}>• Saldo atau poin (jika ada) akan hangus.</Text>
              <Text style={styles.listItem}>• Data profil dan alamat akan dihapus permanen.</Text>
            </View>

            <Text style={styles.label}>Mengapa Anda ingin menghapus akun?</Text>
            <TextInput 
              style={styles.input}
              placeholder="Ceritakan alasan Anda..."
              multiline
              numberOfLines={4}
              value={reason}
              onChangeText={setReason}
              textAlignVertical="top"
            />

            <Pressable 
              style={[styles.requestBtn, submitting && { opacity: 0.6 }]} 
              onPress={handleRequest}
              disabled={submitting}
            >
              {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.requestBtnText}>Ajukan Penghapusan Akun</Text>}
            </Pressable>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#F9FAFB' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F9FAFB' },
  scroll: { padding: 20 },
  
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 20, elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
  warningBox: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  warningTitle: { fontSize: 18, fontWeight: '800', color: '#DC2626' },
  desc: { fontSize: 14, color: '#4B5563', marginBottom: 12, fontWeight: '600' },
  list: { marginBottom: 24 },
  listItem: { fontSize: 13, color: '#6B7280', marginBottom: 6 },
  
  label: { fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 8 },
  input: { backgroundColor: '#F9FAFB', borderRadius: 12, padding: 14, fontSize: 14, borderColor: '#E5E7EB', borderWidth: 1, minHeight: 100 },
  
  requestBtn: { backgroundColor: '#DC2626', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 24 },
  requestBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },

  statusCard: { backgroundColor: '#fff', borderRadius: 24, padding: 24, alignItems: 'center', elevation: 4 },
  statusHeader: { alignItems: 'center', marginBottom: 24 },
  statusTitle: { fontSize: 18, fontWeight: '800', color: '#1F2937', marginTop: 12 },
  statusBadge: { backgroundColor: '#FEF3C7', color: '#92400E', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8, fontSize: 12, fontWeight: '800', marginTop: 8 },
  statusInfo: { width: '100%', backgroundColor: '#F9FAFB', padding: 16, borderRadius: 16, marginBottom: 20 },
  infoLabel: { fontSize: 12, color: '#9CA3AF', fontWeight: '600' },
  infoVal: { fontSize: 14, color: '#1F2937', fontWeight: '700', marginTop: 2 },
  warningText: { textAlign: 'center', fontSize: 12, color: '#6B7280', lineHeight: 18, marginBottom: 24 },
  cancelBtn: { width: '100%', backgroundColor: GREEN, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  cancelBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
