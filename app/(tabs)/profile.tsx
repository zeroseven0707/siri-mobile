import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../lib/authStore';
import api from '../../lib/api';

const GREEN = '#2ECC71';
const DARK_GREEN = '#27AE60';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout, updateUser } = useAuthStore();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: user?.name ?? '', phone: user?.phone ?? '', address: user?.address ?? '' });
  const set = (key: keyof typeof form) => (val: string) => setForm(f => ({ ...f, [key]: val }));

  const handleSave = async () => {
    setLoading(true);
    try { 
      const res = await api.put('/profile/update', form); 
      // Ambil data yang dikembalikan DB, kalau tidak ada, pakai form lokal
      const updatedUser = res.data?.data || form;
      await updateUser(updatedUser);
      setEditing(false); 
    }
    catch (e: any) { Alert.alert('Gagal', e.message); }
    finally { setLoading(false); }
  };

  const handleLogout = () => Alert.alert('Keluar', 'Yakin ingin keluar?', [
    { text: 'Batal', style: 'cancel' },
    { text: 'Keluar', style: 'destructive', onPress: logout },
  ]);

  return (
    <SafeAreaView style={styles.flex}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{user?.name?.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={styles.owlBadge}><Text style={{ fontSize: 14 }}>🦉</Text></View>
          </View>
          <Text style={styles.userName}>{user?.name}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
          <View style={styles.rolePill}><Text style={styles.roleText}>{user?.role}</Text></View>
        </View>

        <View style={styles.content}>
          {/* Info Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Informasi Akun</Text>
              <Pressable onPress={() => setEditing(!editing)} style={styles.editBtn}>
                <Ionicons name={editing ? 'close-outline' : 'pencil-outline'} size={16} color={DARK_GREEN} />
                <Text style={styles.editTxt}>{editing ? 'Batal' : 'Edit'}</Text>
              </Pressable>
            </View>

            {editing ? (
              <>
                {[
                  { label: 'Nama', key: 'name', icon: 'person-outline', value: form.name },
                  { label: 'No. HP', key: 'phone', icon: 'call-outline', value: form.phone },
                  { label: 'Alamat', key: 'address', icon: 'location-outline', value: form.address },
                ].map(f => {
                  const ItemView = View as any;
                  return (
                    <ItemView key={f.key} style={styles.fieldWrap}>
                      <Text style={styles.fieldLabel}>{f.label}</Text>
                      <View style={styles.inputRow}>
                        <Ionicons name={f.icon as any} size={16} color="#9CA3AF" style={{ marginRight: 8 }} />
                        <TextInput style={styles.input} value={f.value} onChangeText={set(f.key as any)} placeholderTextColor="#9CA3AF" />
                      </View>
                    </ItemView>
                  );
                })}
                <Pressable style={[styles.saveBtn, loading && { opacity: 0.6 }]} onPress={handleSave} disabled={loading}>
                  <Text style={styles.saveTxt}>Simpan Perubahan</Text>
                </Pressable>
              </>
            ) : (
              [
                { icon: 'person-outline', value: user?.name },
                { icon: 'mail-outline', value: user?.email },
                { icon: 'call-outline', value: user?.phone },
                { icon: 'location-outline', value: user?.address ?? 'Belum diisi' },
              ].map((item, i) => {
                const ItemView = View as any;
                return (
                  <ItemView key={i} style={[styles.infoRow, i < 3 && styles.infoRowBorder]}>
                    <View style={styles.infoIcon}><Ionicons name={item.icon as any} size={16} color={DARK_GREEN} /></View>
                    <Text style={styles.infoText}>{item.value}</Text>
                  </ItemView>
                );
              })
            )}
          </View>

          {/* Menu */}
          <View style={styles.menuCard}>
            {[
              { icon: 'receipt-outline', label: 'Riwayat Transaksi', color: '#3B82F6', route: '/(tabs)/history' },
              { icon: 'location-outline', label: 'Cek Lokasi GPS', color: '#2ECC71', route: '/test-location' },
              { icon: 'help-circle-outline', label: 'Bantuan', color: '#F97316', route: '/help' },
              { icon: 'information-circle-outline', label: 'Tentang Siri', color: '#A855F7', route: '/about' },
              { icon: 'document-text-outline', label: 'Syarat & Ketentuan', color: '#10B981', route: '/terms' },
            ].map((item, i, arr) => (
              <Pressable key={i} style={[styles.menuItem, i < arr.length - 1 && styles.menuBorder]} onPress={() => router.push(item.route as any)}>
                <View style={[styles.menuIcon, { backgroundColor: item.color + '20' }]}>
                  <Ionicons name={item.icon as any} size={18} color={item.color} />
                </View>
                <Text style={styles.menuLabel}>{item.label}</Text>
                <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
              </Pressable>
            ))}
          </View>

          <Pressable style={styles.logoutBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color="#EF4444" />
            <Text style={styles.logoutTxt}>Keluar</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#F8FFF8' },
  header: { backgroundColor: GREEN, alignItems: 'center', paddingTop: 24, paddingBottom: 32, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  avatarWrap: { position: 'relative', marginBottom: 12 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.3)', alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#fff' },
  avatarText: { color: '#fff', fontSize: 32, fontWeight: '700' },
  owlBadge: { position: 'absolute', bottom: 0, right: -4, width: 26, height: 26, borderRadius: 13, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  userName: { color: '#fff', fontSize: 20, fontWeight: '700' },
  userEmail: { color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: 2 },
  rolePill: { marginTop: 8, backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: 14, paddingVertical: 4, borderRadius: 999 },
  roleText: { color: '#fff', fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
  content: { paddingHorizontal: 16, paddingTop: 16 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 14, elevation: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  cardTitle: { fontWeight: '700', color: '#1F2937', fontSize: 15 },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F0FDF4', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  editTxt: { color: DARK_GREEN, fontWeight: '600', fontSize: 13 },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  infoRowBorder: { borderBottomWidth: 1, borderBottomColor: '#F9FAFB' },
  infoIcon: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#F0FDF4', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  infoText: { color: '#374151', fontSize: 14 },
  fieldWrap: { marginBottom: 12 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: '#6B7280', marginBottom: 6 },
  inputRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 10, paddingHorizontal: 12, backgroundColor: '#F9FAFB' },
  input: { flex: 1, paddingVertical: 11, fontSize: 14, color: '#1F2937' },
  saveBtn: { backgroundColor: GREEN, borderRadius: 12, paddingVertical: 13, alignItems: 'center', marginTop: 4 },
  saveTxt: { color: '#fff', fontWeight: '700', fontSize: 15 },
  menuCard: { backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', marginBottom: 14, elevation: 1 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  menuBorder: { borderBottomWidth: 1, borderBottomColor: '#F9FAFB' },
  menuIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  menuLabel: { flex: 1, fontWeight: '500', color: '#374151', fontSize: 14 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FEF2F2', borderRadius: 14, paddingVertical: 14, marginBottom: 32, gap: 8, borderWidth: 1, borderColor: '#FECACA' },
  logoutTxt: { color: '#EF4444', fontWeight: '700', fontSize: 15 },
});
