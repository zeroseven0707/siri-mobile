import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Lock, Key, Shield, Info } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import CustomHeader from '../components/CustomHeader';
import api from '../lib/api';

const GREEN = '#2ECC71';

export default function ChangePasswordScreen() {
  const [form, setForm] = useState({
    current_password: '',
    password: '',
    password_confirmation: ''
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleUpdate = async () => {
    if (!form.current_password || !form.password || !form.password_confirmation) {
      return Alert.alert('Error', 'Harap isi semua kolom.');
    }
    if (form.password !== form.password_confirmation) {
      return Alert.alert('Error', 'Konfirmasi password baru tidak cocok.');
    }

    setLoading(true);
    try {
      await api.post('/account/change-password', form);
      Alert.alert('Sukses', 'Password Anda berhasil diperbarui.', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Gagal memperbarui password. Silakan cek password lama Anda.';
      Alert.alert('Gagal', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.flex}>
      <CustomHeader title="Ganti Password" />
      
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.infoBox}>
            <Info size={20} color={GREEN} />
            <Text style={styles.infoText}>Gunakan password yang kuat dan unik untuk melindungi akun Siri Anda.</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>Password Saat Ini</Text>
            <View style={styles.inputRow}>
              <View style={styles.icon}><Lock size={18} color="#9CA3AF" /></View>
              <TextInput style={styles.input} secureTextEntry placeholder="Masukkan password lama" value={form.current_password} onChangeText={(v) => setForm({...form, current_password: v})} />
            </View>
            <View style={styles.divider} />
            <Text style={styles.label}>Password Baru</Text>
            <View style={styles.inputRow}>
              <View style={styles.icon}><Key size={18} color="#9CA3AF" /></View>
              <TextInput style={styles.input} secureTextEntry placeholder="Masukkan password baru" value={form.password} onChangeText={(v) => setForm({...form, password: v})} />
            </View>
            <Text style={styles.label}>Konfirmasi Password Baru</Text>
            <View style={styles.inputRow}>
              <View style={styles.icon}><Shield size={18} color="#9CA3AF" /></View>
              <TextInput style={styles.input} secureTextEntry placeholder="Ulangi password baru" value={form.password_confirmation} onChangeText={(v) => setForm({...form, password_confirmation: v})} />
            </View>
          </View>

          <Pressable 
            style={[styles.btn, loading && { opacity: 0.6 }]} 
            onPress={handleUpdate}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Perbarui Password</Text>}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#F9FAFB' },
  scroll: { padding: 20 },
  infoBox: { flexDirection: 'row', backgroundColor: '#F0FDF4', padding: 16, borderRadius: 12, marginBottom: 24, gap: 10, alignItems: 'center' },
  infoText: { flex: 1, fontSize: 13, color: '#15803D', lineHeight: 18 },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 20, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
  label: { fontSize: 13, fontWeight: '600', color: '#4B5563', marginBottom: 8, marginTop: 16 },
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: 12, borderWidth: 1, borderColor: '#F3F4F6', paddingHorizontal: 12 },
  icon: { marginRight: 8 },
  input: { flex: 1, paddingVertical: 12, fontSize: 15, color: '#1F2937' },
  divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 10 },
  btn: { backgroundColor: GREEN, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 32, elevation: 4 },
  btnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
