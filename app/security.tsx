import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as LocalAuthentication from 'expo-local-authentication';
import CustomHeader from '../components/CustomHeader';

const GREEN = '#2ECC71';

export default function SecurityScreen() {
  const router = useRouter();

  const handleAction = async (title: string) => {
    if (title === 'Biometrik') {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      if (!hasHardware) {
        return Alert.alert('Error', 'HP Anda tidak mendukung sensor biometrik.');
      }

      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (!isEnrolled) {
        return Alert.alert('Info', 'Belum ada sidik jari/wajah yang terdaftar di HP ini.');
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Autentikasi Keamanan Siri',
        fallbackLabel: 'Gunakan Password',
      });

      if (result.success) {
        Alert.alert('Sukses', 'Autentikasi Biometrik Berhasil! Fitur ini sudah aktif.');
      }
    } else if (title === 'Hapus Akun') {
      Alert.alert(
        'Hapus Akun?',
        'Tindakan ini tidak dapat dibatalkan. Seluruh data pesanan dan profil Anda akan dihapus permanen.',
        [
          { text: 'Batal', style: 'cancel' },
          { text: 'Hapus Permanen', style: 'destructive', onPress: () => console.log('Delete account') }
        ]
      );
    } else {
      Alert.alert('Info', `Fitur ${title} segera hadir.`);
    }
  };

  const SecurityItem = ({ icon, title, desc, dangerous = false }: any) => (
    <Pressable style={styles.item} onPress={() => handleAction(title)}>
      <View style={[styles.iconBox, { backgroundColor: dangerous ? '#FEF2F2' : '#F0FDF4' }]}>
        <Ionicons name={icon} size={22} color={dangerous ? '#EF4444' : GREEN} />
      </View>
      <View style={styles.content}>
        <Text style={[styles.title, dangerous && { color: '#EF4444' }]}>{title}</Text>
        <Text style={styles.desc}>{desc}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
    </Pressable>
  );

  return (
    <View style={styles.flex}>
      <CustomHeader title="Keamanan Akun" />
      
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Login & Autentikasi</Text>
          <SecurityItem 
            icon="key-outline" 
            title="Ganti Password" 
            desc="Perbarui password Anda secara berkala" 
          />
          <SecurityItem 
            icon="finger-print-outline" 
            title="Biometrik" 
            desc="Gunakan Face ID atau Sidik Jari" 
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Akses Perangkat</Text>
          <SecurityItem 
            icon="phone-portrait-outline" 
            title="Perangkat Terintegrasi" 
            desc="Kelola perangkat yang login ke akun Anda" 
          />
          <SecurityItem 
            icon="log-out-outline" 
            title="Riwayat Login" 
            desc="Cek aktivitas login mencurigakan" 
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: '#EF4444' }]}>Zona Bahaya</Text>
          <SecurityItem 
            icon="trash-outline" 
            title="Hapus Akun" 
            desc="Hapus data secara permanen dari Siri" 
            dangerous
          />
        </View>

        <Text style={styles.footerNote}>
          Siri melindungi data Anda dengan enkripsi end-to-end standar industri.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#F9FAFB' },
  scroll: { padding: 16 },
  section: { backgroundColor: '#fff', borderRadius: 20, padding: 8, marginBottom: 24, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#9CA3AF', marginLeft: 16, marginTop: 8, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  
  item: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#fff' },
  iconBox: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  content: { flex: 1 },
  title: { fontSize: 15, fontWeight: '600', color: '#1F2937' },
  desc: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  
  footerNote: { textAlign: 'center', fontSize: 12, color: '#9CA3AF', paddingHorizontal: 40, marginTop: 8, lineHeight: 18 },
});
