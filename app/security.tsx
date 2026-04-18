import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Alert } from 'react-native';
import { Key, Fingerprint, Smartphone, LogOut, Trash2, ChevronRight } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import CustomHeader from '../components/CustomHeader';

const GREEN = '#2ECC71';

export default function SecurityScreen() {
  const router = useRouter();

  const handleAction = async (title: string) => {
    if (title === 'Biometrik') {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      if (!hasHardware) return Alert.alert('Error', 'HP Anda tidak mendukung sensor biometrik.');
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (!isEnrolled) return Alert.alert('Info', 'Belum ada sidik jari/wajah yang terdaftar di HP ini.');
      const result = await LocalAuthentication.authenticateAsync({ promptMessage: 'Autentikasi Keamanan Push', fallbackLabel: 'Gunakan Password' });
      if (result.success) {
        await SecureStore.setItemAsync('biometric_enabled', 'true');
        Alert.alert('Sukses', 'Biometrik berhasil diaktifkan!');
      }
    } else if (title === 'Ganti Password') { router.push('/change-password');
    } else if (title === 'Riwayat Login') { router.push('/login-history');
    } else if (title === 'Perangkat Terintegrasi') { router.push('/devices');
    } else if (title === 'Hapus Akun') { router.push('/delete-account');
    } else { Alert.alert('Info', `Fitur ${title} segera hadir.`); }
  };

  const SecurityItem = ({ IconComp, title, desc, dangerous = false }: any) => (
    <Pressable style={styles.item} onPress={() => handleAction(title)}>
      <View style={[styles.iconBox, { backgroundColor: dangerous ? '#FEF2F2' : '#F0FDF4' }]}>
        <IconComp size={22} color={dangerous ? '#EF4444' : GREEN} />
      </View>
      <View style={styles.content}>
        <Text style={[styles.title, dangerous && { color: '#EF4444' }]}>{title}</Text>
        <Text style={styles.desc}>{desc}</Text>
      </View>
      <ChevronRight size={18} color="#D1D5DB" />
    </Pressable>
  );

  return (
    <View style={styles.flex}>
      <CustomHeader title="Keamanan Akun" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Login & Autentikasi</Text>
          <SecurityItem IconComp={Key} title="Ganti Password" desc="Perbarui password Anda secara berkala" />
          <SecurityItem IconComp={Fingerprint} title="Biometrik" desc="Gunakan Face ID atau Sidik Jari" />
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Akses Perangkat</Text>
          <SecurityItem IconComp={Smartphone} title="Perangkat Terintegrasi" desc="Kelola perangkat yang login ke akun Anda" />
          <SecurityItem IconComp={LogOut} title="Riwayat Login" desc="Cek aktivitas login mencurigakan" />
        </View>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: '#EF4444' }]}>Zona Bahaya</Text>
          <SecurityItem IconComp={Trash2} title="Hapus Akun" desc="Hapus data secara permanen dari Push" dangerous />
        </View>
        <Text style={styles.footerNote}>Push melindungi data Anda dengan enkripsi end-to-end standar industri.</Text>
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
