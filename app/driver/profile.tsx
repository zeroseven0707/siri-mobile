import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  Alert, Platform, StatusBar, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  Bike, Car, ChevronRight, LogOut, Settings,
  ShieldCheck, HelpCircle, Info, FileText,
  TrendingUp, Star, CheckCircle2, Package,
  MapPin, MessageSquare,
} from 'lucide-react-native';
import api from '../../lib/api';
import { useAuthStore } from '../../lib/authStore';
import { storageUrl } from '../../lib/storage';

const GREEN = '#16a34a';
const DARK_GREEN = '#15803d';

interface DriverStats {
  today_orders: number;
  today_earnings: number;
  total_completed: number;
  rating: number;
}

export default function DriverProfileScreen() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const [stats, setStats] = useState<DriverStats>({
    today_orders: 0,
    today_earnings: 0,
    total_completed: 0,
    rating: 5.0,
  });

  useFocusEffect(useCallback(() => {
    // Hitung stats dari orders yang ada
    api.get('/driver/orders')
      .then((res) => {
        const orders = res.data.data.orders ?? [];
        const completed = orders.filter((o: any) => o.status === 'completed');
        const todayStr = new Date().toDateString();
        const todayCompleted = completed.filter(
          (o: any) => new Date(o.created_at).toDateString() === todayStr
        );
        setStats({
          today_orders: todayCompleted.length,
          today_earnings: todayCompleted.reduce((sum: number, o: any) => sum + Number(o.price), 0),
          total_completed: completed.length,
          rating: 5.0,
        });
      })
      .catch(() => {});
  }, []));

  const handleLogout = () =>
    Alert.alert('Keluar', 'Yakin ingin keluar dari akun?', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Keluar', style: 'destructive', onPress: logout },
    ]);

  const VehicleIcon = user?.driver_profile?.vehicle_type === 'mobil' ? Car : Bike;

  const menuSections = [
    {
      title: 'Akun',
      items: [
        { icon: MapPin,      label: 'Alamat Saya',     color: '#EF4444', route: '/update-location' },
        { icon: ShieldCheck, label: 'Keamanan Akun',   color: GREEN,     route: '/security' },
        { icon: Settings,    label: 'Pengaturan',      color: '#6B7280', route: '/settings' },
      ],
    },
    {
      title: 'Lainnya',
      items: [
        { icon: HelpCircle, label: 'Pusat Bantuan',    color: '#F59E0B', route: '/help' },
        { icon: Info,       label: 'Tentang Push',     color: '#6366F1', route: '/about' },
        { icon: FileText,   label: 'Kebijakan Privasi', color: '#9CA3AF', route: '/terms' },
      ],
    },
  ];

  return (
    <View style={styles.flex}>
      <StatusBar barStyle="light-content" backgroundColor={GREEN} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerActions}>
          <Text style={styles.headerTitle}>Profil Driver</Text>
          <Pressable style={styles.iconBtn} onPress={() => router.push('/help')}>
            <MessageSquare size={20} color="#fff" />
          </Pressable>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          {user?.photo_url ? (
            <Image source={{ uri: storageUrl(user.photo_url)! }} style={styles.avatarImg} />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{user?.name?.charAt(0).toUpperCase()}</Text>
            </View>
          )}
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.name}</Text>
            <Text style={styles.profileEmail}>{user?.email}</Text>
            <View style={styles.driverBadge}>
              <VehicleIcon size={11} color="#fff" />
              <Text style={styles.driverBadgeText}>
                Driver {user?.driver_profile?.vehicle_type === 'mobil' ? 'Mobil' : 'Motor'} ·{' '}
                {user?.driver_profile?.license_plate ?? '-'}
              </Text>
            </View>
          </View>
          <Pressable style={styles.editBtn} onPress={() => router.push('/edit-profile')}>
            <Text style={styles.editBtnText}>Edit</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Stats */}
        <View style={styles.statsCard}>
          <Text style={styles.cardTitle}>Statistik Kamu</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: '#FFF7ED' }]}>
                <Package size={18} color="#F97316" />
              </View>
              <Text style={styles.statValue}>{stats.today_orders}</Text>
              <Text style={styles.statLabel}>Hari Ini</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: '#F0FDF4' }]}>
                <TrendingUp size={18} color={GREEN} />
              </View>
              <Text style={styles.statValue}>
                Rp {(stats.today_earnings / 1000).toFixed(0)}K
              </Text>
              <Text style={styles.statLabel}>Pendapatan</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: '#EFF6FF' }]}>
                <CheckCircle2 size={18} color="#3B82F6" />
              </View>
              <Text style={styles.statValue}>{stats.total_completed}</Text>
              <Text style={styles.statLabel}>Total Selesai</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: '#FFFBEB' }]}>
                <Star size={18} color="#F59E0B" fill="#F59E0B" />
              </View>
              <Text style={styles.statValue}>{stats.rating.toFixed(1)}</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
          </View>
        </View>

        {/* Menu Sections */}
        {menuSections.map((section, si) => (
          <View key={si} style={styles.menuCard}>
            <Text style={styles.menuSectionTitle}>{section.title}</Text>
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

        <Text style={styles.version}>Push Driver App v1.0.0</Text>
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
  headerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '800' },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  profileCard: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  avatarImg: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  avatarText: { color: '#fff', fontSize: 26, fontWeight: '800' },
  profileInfo: { flex: 1 },
  profileName: { color: '#fff', fontSize: 17, fontWeight: '800' },
  profileEmail: { color: 'rgba(255,255,255,0.75)', fontSize: 12, marginTop: 2 },
  driverBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 6,
  },
  driverBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  editBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  editBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  scroll: { padding: 16, paddingBottom: 32 },

  statsCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: { fontSize: 15, fontWeight: '800', color: '#111827', marginBottom: 16 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statItem: { flex: 1, alignItems: 'center', gap: 6 },
  statDivider: { width: 1, height: 48, backgroundColor: '#F3F4F6' },
  statIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: 14, fontWeight: '800', color: '#111827', letterSpacing: -0.3 },
  statLabel: { fontSize: 10, color: '#9CA3AF', fontWeight: '600' },

  menuCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  menuSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 12,
  },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12 },
  menuBorder: { borderBottomWidth: 1, borderBottomColor: '#F7F8FA' },
  menuIconBox: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  menuLabel: { flex: 1, fontSize: 14, color: '#1F2937', fontWeight: '600' },

  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  logoutText: { color: '#EF4444', fontWeight: '700', fontSize: 14 },
  version: { textAlign: 'center', color: '#C4C9D4', fontSize: 11, marginBottom: 8 },
});
