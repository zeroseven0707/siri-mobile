import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import CustomHeader from '../../components/CustomHeader';

const GREEN = '#2ECC71';

export default function NotificationsScreen() {
  const notifications = [
    {
      id: 1,
      title: 'Promo Spesial Makan Siang!',
      desc: 'Diskon hingga 30% untuk pemesanan Gacoan hari ini. Cek sekarang sebelum kehabisan!',
      time: '10:30',
      type: 'promo',
      is_read: false,
    },
    {
      id: 2,
      title: 'Pesanan Selesai',
      desc: 'Pesanan Nasi Goreng Spesial kamu sudah sampai. Jangan lupa beri penilaian ya!',
      time: '09:15',
      type: 'order',
      is_read: true,
    },
    {
      id: 3,
      title: 'Keamanan Akun',
      desc: 'Ada login baru terdeteksi di perangkat Android. Jika bukan kamu, segera hubungi bantuan.',
      time: 'Kemarin',
      type: 'system',
      is_read: true,
    }
  ];

  const getIcon = (type: string) => {
    switch (type) {
      case 'promo': return { icon: 'pricetag-outline', color: '#F59E0B' };
      case 'order': return { icon: 'fast-food-outline', color: GREEN };
      case 'system': return { icon: 'shield-checkmark-outline', color: '#3B82F6' };
      default: return { icon: 'notifications-outline', color: '#9CA3AF' };
    }
  };

  return (
    <View style={styles.flex}>
      <CustomHeader title="Notifikasi" showBack={false} />
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {notifications.length === 0 ? (
          <View style={styles.empty}>
            <Image 
              source={{ uri: 'https://cdn-icons-png.flaticon.com/512/3602/3602145.png' }} 
              style={styles.emptyImg} 
            />
            <Text style={styles.emptyTitle}>Belum ada notifikasi</Text>
            <Text style={styles.emptyDesc}>Notifikasi seputar pesanan dan promo akan muncul di sini.</Text>
          </View>
        ) : (
          notifications.map((notif) => {
            const { icon, color } = getIcon(notif.type);
            return (
              <View key={notif.id} style={[styles.item, !notif.is_read && styles.unread]}>
                <View style={[styles.iconBox, { backgroundColor: color + '15' }]}>
                  <Ionicons name={icon as any} size={22} color={color} />
                </View>
                <View style={styles.content}>
                  <View style={styles.row}>
                    <Text style={[styles.title, !notif.is_read && styles.bold]}>{notif.title}</Text>
                    <Text style={styles.time}>{notif.time}</Text>
                  </View>
                  <Text style={styles.desc} numberOfLines={2}>{notif.desc}</Text>
                </View>
                {!notif.is_read && <View style={styles.dot} />}
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#F9FAFB' },
  scroll: { padding: 16 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  emptyImg: { width: 120, height: 120, opacity: 0.5 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#374151', marginTop: 16 },
  emptyDesc: { fontSize: 14, color: '#9CA3AF', textAlign: 'center', marginTop: 8, paddingHorizontal: 40 },
  
  item: { 
    flexDirection: 'row', 
    backgroundColor: '#fff', 
    padding: 16, 
    borderRadius: 16, 
    marginBottom: 12, 
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  unread: { backgroundColor: '#F0FDF4', borderWidth: 1, borderColor: '#DCFCE7' },
  iconBox: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  content: { flex: 1 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  title: { fontSize: 14, color: '#1F2937' },
  bold: { fontWeight: '700' },
  time: { fontSize: 11, color: '#9CA3AF' },
  desc: { fontSize: 13, color: '#6B7280', lineHeight: 18 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: GREEN, marginLeft: 8 },
});
