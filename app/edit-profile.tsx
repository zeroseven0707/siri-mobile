import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, User, Phone, Mail, Edit2 } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../lib/authStore';
import api from '../lib/api';

const GREEN = '#2ECC71';

export default function EditProfileScreen() {
  const { user, updateUser } = useAuthStore();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: user?.name ?? '', phone: user?.phone ?? '' });

  const set = (key: keyof typeof form) => (val: string) => setForm(f => ({ ...f, [key]: val }));

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await api.put('/profile/update', form);
      await updateUser(res.data?.data || form);
      Alert.alert('Berhasil', 'Profil telah diperbarui', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (e: any) {
      Alert.alert('Gagal', e.message);
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { label: 'Nama Lengkap', key: 'name', icon: 'person-outline', value: form.name, placeholder: 'Masukkan nama lengkap' },
    { label: 'Nomor WhatsApp', key: 'phone', icon: 'logo-whatsapp', value: form.phone, placeholder: 'Masukkan nomor WhatsApp' },
  ];

  return (
    <SafeAreaView style={styles.flex} edges={['top']}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={22} color="#1F2937" />
        </Pressable>
        <Text style={styles.headerTitle}>Edit Profil</Text>
        <View style={{ width: 38 }} />
      </View>

      <View style={styles.content}>
        {/* Avatar */}
        <View style={styles.avatarWrap}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.name?.charAt(0).toUpperCase()}</Text>
          </View>
        </View>

        {/* Fields */}
        <View style={styles.card}>
          {fields.map((f, i) => (
            <View key={f.key} style={[styles.fieldWrap, i < fields.length - 1 && styles.fieldBorder]}>
              <Text style={styles.label}>{f.label}</Text>
              <View style={styles.inputRow}>
                <View style={{ marginRight: 10 }}><User size={18} color={GREEN} /></View>
                <TextInput
                  style={styles.input}
                  value={f.value}
                  onChangeText={set(f.key as any)}
                  placeholder={f.placeholder}
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>
          ))}
        </View>

        {/* Email (read-only) */}
        <View style={styles.card}>
          <View style={styles.fieldWrap}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputRow}>
              <View style={{ marginRight: 10 }}><Mail size={18} color="#9CA3AF" /></View>
              <Text style={styles.readOnly}>{user?.email}</Text>
            </View>
          </View>
        </View>

        <Pressable style={[styles.saveBtn, loading && { opacity: 0.6 }]} onPress={handleSave} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveTxt}>Simpan Perubahan</Text>}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#F3F4F6' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  backBtn: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#1F2937' },
  content: { padding: 16 },
  avatarWrap: { alignItems: 'center', marginBottom: 20 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: GREEN, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 34, fontWeight: '800' },
  card: { backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 16, marginBottom: 12, elevation: 1 },
  fieldWrap: { paddingVertical: 14 },
  fieldBorder: { borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  label: { fontSize: 11, color: '#9CA3AF', fontWeight: '600', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  inputRow: { flexDirection: 'row', alignItems: 'center' },
  input: { flex: 1, fontSize: 15, color: '#1F2937', paddingVertical: 2 },
  readOnly: { flex: 1, fontSize: 15, color: '#9CA3AF' },
  saveBtn: { backgroundColor: GREEN, paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  saveTxt: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
