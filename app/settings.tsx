import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Edit2, ChevronRight, LogOut, User, MapPin, Shield, Receipt, Bell, Clock, HelpCircle, Info, FileText } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../lib/authStore';
import { storageUrl } from '../lib/storage';

const GREEN = '#2ECC71';

const MENU_SECTIONS = [
  {
    title: 'Akun',
    items: [
      { icon: User, label: 'Edit Profil', color: GREEN, route: '/edit-profile' },
      { icon: MapPin, label: 'Alamat Saya', color: '#EF4444', route: '/update-location' },
      { icon: Shield, label: 'Keamanan Akun', color: '#3B82F6', route: '/security' },
    ],
  },
  {
    title: 'Aktivitas',
    items: [
      { icon: Receipt, label: 'Pesanan Saya', color: '#8B5CF6', route: '/(tabs)/orders' },
      { icon: Bell, label: 'Notifikasi', color: '#F59E0B', route: '/(tabs)/notifications' },
      { icon: Clock, label: 'Riwayat Transaksi', color: '#3B82F6', route: '/history-transactions' },
    ],
  },
  {
    title: 'Lainnya',
    items: [
      { icon: HelpCircle, label: 'Pusat Bantuan', color: '#10B981', route: '/help' },
      { icon: Info, label: 'Tentang Push', color: '#6366F1', route: '/about' },
      { icon: FileText, label: 'Kebijakan Privasi', color: '#4B5563', route: '/terms' },
    ],
  },
];

export default function SettingsScreen() {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = () => Alert.alert('Keluar', 'Yakin ingin keluar?', [
    { text: 'Batal', style: 'cancel' },
    { text: 'Keluar', style: 'destructive', onPress: logout },
  ]);

  return (
    <SafeAreaView style={styles.flex} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={22} color="#1F2937" />
        </Pressable>
        <Text style={styles.headerTitle}>Pengaturan</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* User info */}
        {user && (
          <View style={styles.userCard}>
            {user.photo_url ? (
              <Image source={{ uri: storageUrl(user.photo_url)! }} style={styles.avatarImg} />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{user.name?.charAt(0).toUpperCase()}</Text>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.userName}>{user.name}</Text>
              <Text style={styles.userEmail}>{user.email}</Text>
            </View>
            <Pressable onPress={() => router.push('/edit-profile')} style={styles.editBtn}>
              <Edit2 size={18} color={GREEN} />
            </Pressable>
          </View>
        )}

        {MENU_SECTIONS.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.menuCard}>
              {section.items.map((item, i, arr) => (
                <Pressable
                  key={item.label}
                  style={[styles.menuItem, i < arr.length - 1 && styles.menuBorder]}
                  onPress={() => router.push(item.route as any)}
                >
                  <View style={[styles.iconBox, { backgroundColor: item.color + '15' }]}>
                    <item.icon size={18} color={item.color} />
                  </View>
                  <Text style={styles.menuLabel}>{item.label}</Text>
                  <ChevronRight size={16} color="#D1D5DB" />
                </Pressable>
              ))}
            </View>
          </View>
        ))}

        {user && (
          <Pressable style={styles.logoutBtn} onPress={handleLogout}>
            <LogOut size={18} color="#EF4444" style={{ marginRight: 8 }} />
            <Text style={styles.logoutTxt}>Keluar</Text>
          </Pressable>
        )}

        <Text style={styles.version}>Push App v1.2.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#F3F4F6' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  backBtn: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#1F2937' },
  scroll: { padding: 16 },
  userCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 20, gap: 12, elevation: 1 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: GREEN, alignItems: 'center', justifyContent: 'center' },
  avatarImg: { width: 48, height: 48, borderRadius: 24 },
  avatarText: { color: '#fff', fontSize: 20, fontWeight: '800' },
  userName: { fontSize: 15, fontWeight: '700', color: '#1F2937' },
  userEmail: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  editBtn: { padding: 8 },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 11, fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8, marginLeft: 4 },
  menuCard: { backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden', elevation: 1 },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  menuBorder: { borderBottomWidth: 1, borderBottomColor: '#F9FAFB' },
  iconBox: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  menuLabel: { flex: 1, fontSize: 14, color: '#374151', fontWeight: '500' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', borderRadius: 12, paddingVertical: 14, marginBottom: 12, borderWidth: 1, borderColor: '#FEE2E2', elevation: 1 },
  logoutTxt: { color: '#EF4444', fontWeight: '700', fontSize: 14 },
  version: { textAlign: 'center', color: '#9CA3AF', fontSize: 11, marginBottom: 20 },
});
