import React, { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View, Platform, StatusBar } from 'react-native';
import {
  Settings, MessageSquare, ChevronRight, Clock, RefreshCw,
  Bike, CheckCircle, Receipt, MapPin, ShieldCheck, HelpCircle,
  Info, FileText, LogOut, User
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { useAuthStore } from '../../lib/authStore';
import { useOrderStore } from '../../lib/orderStore';
import AuthPlaceholder from '../../components/AuthPlaceholder';
import api from '../../lib/api';

const GREEN = '#2ECC71';
const DARK_GREEN = '#22A85A';

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const { setActiveTab } = useOrderStore();
  const [counts, setCounts] = useState({ pending: 0, accepted: 0, on_progress: 0 });

  useFocusEffect(useCallback(() => {
    if (!user) return;
    api.get('/orders/counts')
      .then(res => {
        const d = res.data.data;
        setCounts({ pending: d.pending, accepted: d.accepted, on_progress: d.on_progress });
      })
      .catch(() => {});
  }, [user]));

  if (!user) {
    return (
      <AuthPlaceholder
        icon="User"
        title="Atur Profil & Keamanan"
        description="Masuk untuk mengelola detail akun, melihat riwayat transaksi, dan mengatur metode pembayaran Anda."
      />
    );
  }

  const handleStatusPress = (status: any) => {
    const map: any = { 'Menunggu': 'pending', 'Diproses': 'accepted', 'Dikirim': 'on_progress', 'Diterima': 'completed' };
    setActiveTab(map[status]);
    router.push('/orders-list');
  };

  const handleLogout = () => Alert.alert('Keluar', 'Yakin ingin keluar?', [
    { text: 'Batal', style: 'cancel' },
    { text: 'Keluar', style: 'destructive', onPress: logout },
  ]);

  const menuSections = [
    {
      items: [
        { icon: Receipt, label: 'Riwayat Transaksi', color: '#3B82F6', route: '/history-transactions' },
        { icon: MapPin, label: 'Alamat Saya', color: '#EF4444', route: '/update-location' },
        { icon: ShieldCheck, label: 'Keamanan Akun', color: GREEN, route: '/security' },
      ]
    },
    {
      items: [
        { icon: HelpCircle, label: 'Pusat Bantuan', color: '#F59E0B', route: '/help' },
        { icon: Info, label: 'Tentang Siri', color: '#6366F1', route: '/about' },
        { icon: FileText, label: 'Kebijakan Privasi', color: '#6B7280', route: '/terms' },
      ]
    }
  ];

  const orderStatuses = [
    { icon: Clock, label: 'Menunggu', countKey: 'pending', color: '#F59E0B' },
    { icon: RefreshCw, label: 'Diproses', countKey: 'accepted', color: '#3B82F6' },
    { icon: Bike, label: 'Dikirim', countKey: 'on_progress', color: GREEN },
    { icon: CheckCircle, label: 'Diterima', countKey: null, color: '#6B7280' },
  ];

  return (
    <View style={styles.flex}>
      <StatusBar barStyle="light-content" backgroundColor={GREEN} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerActions}>
          <Text style={styles.headerTitle}>Akun Saya</Text>
          <View style={styles.headerIcons}>
            <Pressable style={styles.iconBtn} onPress={() => router.push('/settings')}>
              <Settings size={20} color="#fff" />
            </Pressable>
            <Pressable style={styles.iconBtn} onPress={() => router.push('/help')}>
              <MessageSquare size={20} color="#fff" />
            </Pressable>
          </View>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{user?.name?.charAt(0).toUpperCase()}</Text>
            </View>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.name}</Text>
            <Text style={styles.profileEmail}>{user?.email}</Text>
            <View style={styles.memberBadge}>
              <Text style={styles.memberText}>✦ Member Siri</Text>
            </View>
          </View>
          <Pressable style={styles.editBtn} onPress={() => router.push('/edit-profile')}>
            <Text style={styles.editBtnText}>Edit</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Order Status */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Pesanan Saya</Text>
            <Pressable onPress={() => router.push('/(tabs)/orders')} style={styles.seeAllBtn}>
              <Text style={styles.seeAll}>Lihat Riwayat</Text>
              <ChevronRight size={14} color={DARK_GREEN} />
            </Pressable>
          </View>
          <View style={styles.statusRow}>
            {orderStatuses.map((item, i) => {
              const count = item.countKey ? counts[item.countKey as keyof typeof counts] : 0;
              const IconComp = item.icon;
              return (
                <Pressable key={i} style={styles.statusItem} onPress={() => handleStatusPress(item.label)}>
                  <View style={styles.statusIconWrap}>
                    <View style={[styles.statusIcon, { backgroundColor: item.color + '15' }]}>
                      <IconComp size={20} color={item.color} />
                    </View>
                    {count > 0 && (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{count > 99 ? '99+' : count}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.statusLabel}>{item.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Menu Sections */}
        {menuSections.map((section, si) => (
          <View key={si} style={styles.card}>
            {section.items.map((item, i) => {
              const IconComp = item.icon;
              return (
                <Pressable
                  key={i}
                  style={[styles.menuItem, i < section.items.length - 1 && styles.menuBorder]}
                  onPress={() => router.push(item.route as any)}
                >
                  <View style={[styles.menuIconBox, { backgroundColor: item.color + '15' }]}>
                    <IconComp size={18} color={item.color} />
                  </View>
                  <Text style={styles.menuLabel}>{item.label}</Text>
                  <ChevronRight size={16} color="#D1D5DB" />
                </Pressable>
              );
            })}
          </View>
        ))}

        {/* Logout */}
        <Pressable style={styles.logoutBtn} onPress={handleLogout}>
          <LogOut size={18} color="#EF4444" />
          <Text style={styles.logoutText}>Keluar dari Akun</Text>
        </Pressable>

        <Text style={styles.version}>Siri App v1.2.0</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#F7F8FA' },

  header: {
    backgroundColor: GREEN,
    paddingTop: Platform.OS === 'ios' ? 56 : 44,
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '800' },
  headerIcons: { flexDirection: 'row', gap: 8 },
  iconBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },

  profileCard: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatarWrap: {},
  avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)' },
  avatarText: { color: '#fff', fontSize: 26, fontWeight: '800' },
  profileInfo: { flex: 1 },
  profileName: { color: '#fff', fontSize: 17, fontWeight: '800' },
  profileEmail: { color: 'rgba(255,255,255,0.75)', fontSize: 12, marginTop: 2 },
  memberBadge: { backgroundColor: 'rgba(255,255,255,0.2)', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginTop: 6 },
  memberText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  editBtn: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  editBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  scroll: { padding: 16, paddingBottom: 32 },

  card: { backgroundColor: '#fff', borderRadius: 20, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  cardTitle: { fontSize: 15, fontWeight: '800', color: '#111827' },
  seeAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  seeAll: { fontSize: 12, color: DARK_GREEN, fontWeight: '700' },

  statusRow: { flexDirection: 'row', justifyContent: 'space-around' },
  statusItem: { alignItems: 'center', gap: 8 },
  statusIconWrap: { position: 'relative' },
  statusIcon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  badge: { position: 'absolute', top: -4, right: -4, backgroundColor: '#EF4444', borderRadius: 10, minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4, borderWidth: 2, borderColor: '#fff' },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },
  statusLabel: { fontSize: 11, color: '#6B7280', fontWeight: '600' },

  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, gap: 12 },
  menuBorder: { borderBottomWidth: 1, borderBottomColor: '#F7F8FA' },
  menuIconBox: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  menuLabel: { flex: 1, fontSize: 14, color: '#1F2937', fontWeight: '600' },

  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#fff', borderRadius: 16, paddingVertical: 15, marginBottom: 12, borderWidth: 1, borderColor: '#FEE2E2', shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 },
  logoutText: { color: '#EF4444', fontWeight: '700', fontSize: 14 },
  version: { textAlign: 'center', color: '#C4C9D4', fontSize: 11, marginBottom: 8 },
});
