import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, RefreshControl, Pressable, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import CustomHeader from '../../components/CustomHeader';
import api from '../../lib/api';
import { useNotificationStore } from '../../lib/notificationStore';
import { useAuthStore } from '../../lib/authStore';
import AuthPlaceholder from '../../components/AuthPlaceholder';

const GREEN = '#2ECC71';

interface SiriNotification {
  id: string;
  title: string;
  body: string;
  type: 'promo' | 'system' | 'order_status' | string;
  is_read: boolean;
  sent_at: string;
}

export default function NotificationsScreen() {
  const { user } = useAuthStore();
  const [notifications, setNotifications] = useState<SiriNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { setUnreadCount, decrementCount, clearCount } = useNotificationStore();

  const fetchNotifications = async (showLoading = true) => {
    if (!user) return;
    if (showLoading) setLoading(true);
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data.data.notifications || []);
      setUnreadCount(res.data.data.unread_count || 0);
    } catch (err) {
      console.log('Gagal ambil notifikasi:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [user]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchNotifications(false);
  }, []);

  const handleMarkAsRead = async (id: string, alreadyRead: boolean) => {
    if (alreadyRead) return;
    
    try {
      // Update UI lokal dulu agar cepat
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      decrementCount();
      // Panggil API
      await api.post(`/notifications/${id}/read`);
    } catch (err) {
      console.log('Gagal tandai dibaca:', err);
    }
  };

  const handleReadAll = async () => {
    if (notifications.every(n => n.is_read)) return;

    Alert.alert('Konfirmasi', 'Tandai semua notifikasi sebagai sudah dibaca?', [
      { text: 'Batal', style: 'cancel' },
      { 
        text: 'Ya, Baca Semua', 
        onPress: async () => {
          try {
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            clearCount();
            await api.post('/notifications/read-all');
          } catch (err) {
            fetchNotifications(false);
          }
        } 
      }
    ]);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'promo': return { icon: 'pricetag-outline', color: '#F59E0B' };
      case 'order_status': return { icon: 'bicycle-outline', color: GREEN };
      case 'system': return { icon: 'shield-checkmark-outline', color: '#3B82F6' };
      default: return { icon: 'notifications-outline', color: '#9CA3AF' };
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInSec = Math.floor(diffInMs / 1000);
    const diffInMin = Math.floor(diffInSec / 60);
    const diffInHr = Math.floor(diffInMin / 60);
    const diffInDay = Math.floor(diffInHr / 24);

    if (diffInSec < 60) return 'Baru saja';
    if (diffInMin < 60) return `${diffInMin} menit lalu`;
    if (diffInHr < 24) return `${diffInHr} jam lalu`;
    if (diffInDay === 1) return 'Kemarin';
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  };

  return (
    <SafeAreaView style={styles.flex} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifikasi</Text>
        <Pressable onPress={handleReadAll} style={styles.readAllBox}>
          <Ionicons name="mail-open-outline" size={22} color={GREEN} />
        </Pressable>
      </View>
      
      {!user ? (
        <AuthPlaceholder 
          icon="notifications-outline"
          title="Jangan Ketinggalan Kabar"
          description="Masuk untuk mendapatkan notifikasi promo eksklusif, status pesanan, dan pembaruan penting lainnya dari Siri."
        />
      ) : loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={GREEN} />
        </View>
      ) : (
        <ScrollView 
          showsVerticalScrollIndicator={false} 
          contentContainerStyle={styles.scroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={GREEN} />}
        >
          {notifications.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="notifications-off-outline" size={80} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>Belum ada notifikasi</Text>
              <Text style={styles.emptyDesc}>Notifikasi seputar pesanan dan promo akan muncul di sini.</Text>
            </View>
          ) : (
            notifications.map((notif) => {
              const { icon, color } = getIcon(notif.type);
              return (
                <Pressable 
                  key={notif.id} 
                  style={[styles.item, !notif.is_read && styles.unread]}
                  onPress={() => handleMarkAsRead(notif.id, notif.is_read)}
                >
                  <View style={[styles.iconBox, { backgroundColor: color + '15' }]}>
                    <Ionicons name={icon as any} size={22} color={color} />
                  </View>
                  <View style={styles.content}>
                    <View style={styles.row}>
                      <Text style={[styles.title, !notif.is_read && styles.bold]}>{notif.title}</Text>
                      <Text style={styles.time}>{formatTime(notif.sent_at)}</Text>
                    </View>
                    <Text style={styles.desc} numberOfLines={2}>{notif.body}</Text>
                  </View>
                  {!notif.is_read && <View style={styles.dot} />}
                </Pressable>
              );
            })
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 20, 
    paddingVertical: 16, 
    backgroundColor: '#fff', 
    borderBottomWidth: 1, 
    borderBottomColor: '#F3F4F6' 
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#1F2937' },
  readAllBox: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: 16 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 120 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#374151', marginTop: 16 },
  emptyDesc: { fontSize: 14, color: '#9CA3AF', textAlign: 'center', marginTop: 8, paddingHorizontal: 40 },
  
  item: { 
    flexDirection: 'row', 
    backgroundColor: '#fff', 
    padding: 16, 
    borderRadius: 20, 
    marginBottom: 12, 
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  unread: { backgroundColor: '#F0FDF4', borderColor: '#DCFCE7' },
  iconBox: { width: 50, height: 50, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  content: { flex: 1 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  title: { fontSize: 14, color: '#1F2937' },
  bold: { fontWeight: '800' },
  time: { fontSize: 11, color: '#9CA3AF' },
  desc: { fontSize: 13, color: '#6B7280', lineHeight: 18 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: GREEN, marginLeft: 8 },
});
