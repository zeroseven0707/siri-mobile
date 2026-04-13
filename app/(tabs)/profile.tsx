import React, { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { useAuthStore } from '../../lib/authStore';
import { useOrderStore } from '../../lib/orderStore';
import AuthPlaceholder from '../../components/AuthPlaceholder';
import api from '../../lib/api';

const GREEN = '#2ECC71';

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
        icon="person-outline"
        title="Atur Profil & Keamanan"
        description="Masuk untuk mengelola detail akun, melihat riwayat transaksi, dan mengatur metode pembayaran Anda."
      />
    );
  }

  const handleStatusPress = (status: any) => {
    const map: any = {
      'Menunggu': 'pending',
      'Diproses': 'accepted',
      'Dikirim': 'on_progress',
      'Diterima': 'completed'
    };
    setActiveTab(map[status]);
    router.push('/orders-list');
  };

  const handleLogout = () => Alert.alert('Keluar', 'Yakin ingin keluar?', [
    { text: 'Batal', style: 'cancel' },
    { text: 'Keluar', style: 'destructive', onPress: logout },
  ]);

  return (
    <View style={styles.flex}>
      {/* Mini Top Header (Shopee Style) */}
      <View style={styles.topActions}>
        <Text style={styles.topTitle}>Saya</Text>
        <View style={styles.topIcons}>
          <Pressable onPress={() => router.push('/settings')} style={styles.iconBtn}>
            <Ionicons name="settings-outline" size={22} color="#fff" />
          </Pressable>
          <Pressable onPress={() => router.push('/help')} style={styles.iconBtn}>
            <Ionicons name="chatbubble-ellipses-outline" size={22} color="#fff" />
          </Pressable>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} bounces={false}
        >
        {/* Profile Card Header */}
        <View style={styles.header}>
          <View style={styles.userInfoRow}>
             <View style={styles.avatarWrap}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{user?.name?.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={styles.owlBadge}><Text style={{ fontSize: 10 }}>🦉</Text></View>
             </View>
             <View style={styles.nameDetails}>
                <Text style={styles.userName}>{user?.name}</Text>
                <View style={styles.memberBadge}>
                   <Text style={styles.memberText}>{user?.role === 'user' ? 'Member Siri' : 'Mitra Siri'}</Text>
                   <Ionicons name="chevron-forward" size={12} color="rgba(255,255,255,0.7)" />
                </View>
                <Text style={styles.userEmail}>{user?.email}</Text>
             </View>
          </View>
        </View>

        <View style={styles.content}>
          {/* Order Status (Shopee Style) */}
          <View style={styles.orderStatusCard}>
            <View style={styles.cardHeader}>
               <Text style={styles.cardTitle}>Pesanan Saya</Text>
               <Pressable onPress={() => router.push('/(tabs)/orders')} style={styles.seeAll}>
                  <Text style={styles.seeAllText}>Lihat Riwayat</Text>
                  <Ionicons name="chevron-forward" size={14} color="#9CA3AF" />
               </Pressable>
            </View>
            <View style={styles.statusRow}>
               {[
                 { icon: 'time-outline', label: 'Menunggu', countKey: 'pending' },
                 { icon: 'sync-outline', label: 'Diproses', countKey: 'accepted' },
                 { icon: 'bicycle-outline', label: 'Dikirim', countKey: 'on_progress' },
                 { icon: 'checkmark-done-circle-outline', label: 'Diterima', countKey: null },
               ].map((item, i) => {
                 const count = item.countKey ? counts[item.countKey as keyof typeof counts] : 0;
                 return (
                   <Pressable
                     key={i}
                     style={styles.statusItem}
                     onPress={() => handleStatusPress(item.label)}
                   >
                     <View style={styles.iconWrap}>
                       <Ionicons name={item.icon as any} size={24} color="#4B5563" />
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
          <View style={styles.menuCard}>
            {[
              { icon: 'receipt-outline', label: 'Riwayat Transaksi', color: '#3B82F6', route: '/history-transactions' },
              { icon: 'location-outline', label: 'Alamat Saya', color: '#EF4444', route: '/update-location' },
              { icon: 'shield-checkmark-outline', label: 'Keamanan Akun', color: '#3B82F6', route: '/security' },
            ].map((item, i, arr) => (
              <Pressable key={i} style={[styles.menuItem, i < arr.length - 1 && styles.menuBorder]} onPress={() => router.push(item.route as any)}>
                <Ionicons name={item.icon as any} size={20} color={item.color} style={{marginRight: 12}} />
                <Text style={styles.menuLabel}>{item.label}</Text>
                <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
              </Pressable>
            ))}
          </View>

          <View style={styles.menuCard}>
            {[
              { icon: 'help-circle-outline', label: 'Pusat Bantuan', color: '#10B981', route: '/help' },
              { icon: 'shield-checkmark-outline', label: 'Keamanan Akun', color: '#3B82F6', route: '/security' },
              { icon: 'information-circle-outline', label: 'Tentang Siri', color: '#6366F1', route: '/about' },
              { icon: 'document-text-outline', label: 'Kebijakan Privasi', color: '#4B5563', route: '/terms' },
            ].map((item, i, arr) => (
              <Pressable key={i} style={[styles.menuItem, i < arr.length - 1 && styles.menuBorder]} onPress={() => router.push(item.route as any)}>
                <Ionicons name={item.icon as any} size={20} color={item.color} style={{marginRight: 12}} />
                <Text style={styles.menuLabel}>{item.label}</Text>
                <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
              </Pressable>
            ))}
          </View>

          <Pressable style={styles.logoutBtn} onPress={handleLogout}>
            <Text style={styles.logoutTxt}>Keluar</Text>
          </Pressable>
          <Text style={styles.version}>Siri App v1.2.0</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#F3F4F6' },
  topActions: { 
    backgroundColor: GREEN, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 16, 
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    paddingBottom: 10
  },
  topTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },
  topIcons: { flexDirection: 'row', gap: 15 },
  iconBtn: { padding: 4 },
  header: { backgroundColor: GREEN, paddingHorizontal: 16, paddingBottom: 40, paddingTop: 10 },
  userInfoRow: { flexDirection: 'row', alignItems: 'center' },
  avatarWrap: { position: 'relative' },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(255,255,255,0.3)', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },
  avatarText: { color: '#fff', fontSize: 28, fontWeight: '800' },
  owlBadge: { position: 'absolute', bottom: -2, right: -2, width: 22, height: 22, borderRadius: 11, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  nameDetails: { marginLeft: 16, flex: 1 },
  userName: { color: '#fff', fontSize: 18, fontWeight: '800' },
  memberBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.15)', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, marginTop: 4, gap: 4 },
  memberText: { color: '#fff', fontSize: 10, fontWeight: '600' },
  userEmail: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 4 },
  
  content: { paddingHorizontal: 12, marginTop: -25 },
  orderStatusCard: { backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#F9FAFB', paddingBottom: 10, marginBottom: 12 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#1F2937' },
  seeAll: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  seeAllText: { fontSize: 11, color: '#9CA3AF' },
  statusRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  statusItem: { alignItems: 'center', gap: 6 },
  statusLabel: { fontSize: 10, color: '#4B5563' },
  iconWrap: { position: 'relative' },
  badge: { position: 'absolute', top: -6, right: -8, backgroundColor: '#EF4444', borderRadius: 10, minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4, borderWidth: 1.5, borderColor: '#fff' },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },

  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, elevation: 2 },
  menuCard: { backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden', marginBottom: 12, elevation: 2 },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  menuBorder: { borderBottomWidth: 1, borderBottomColor: '#F9FAFB' },
  menuLabel: { flex: 1, fontSize: 14, color: '#374151', fontWeight: '500' },

  logoutBtn: { backgroundColor: '#fff', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginBottom: 12, borderWidth: 1, borderColor: '#FEE2E2' },
  logoutTxt: { color: '#EF4444', fontWeight: '700' },
  version: { textAlign: 'center', color: '#9CA3AF', fontSize: 11, marginBottom: 30 },
});
