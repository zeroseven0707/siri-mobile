import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';

export default function TermsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#1F2937" />
        </Pressable>
        <Text style={styles.headerTitle}>Syarat & Ketentuan</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Syarat & Ketentuan Penggunaan Push</Text>
        <Text style={styles.date}>Terakhir diperbarui: 12 April 2026</Text>

        <Text style={styles.sectionTitle}>1. Pendahuluan</Text>
        <Text style={styles.paragraph}>
          Selamat datang di aplikasi Push. Dengan mengunduh, menginstal, dan/atau menggunakan Aplikasi Push, Anda setuju bahwa Anda telah membaca, memahami, menerima, dan menyetujui Ketentuan Penggunaan ini. Jika Anda tidak menyetujui Ketentuan Penggunaan ini, mohon untuk tidak menggunakan Aplikasi Push.
        </Text>

        <Text style={styles.sectionTitle}>2. Akun Pelanggan</Text>
        <Text style={styles.paragraph}>
          Anda wajib memberikan informasi yang akurat dan lengkap saat mendaftar serta memperbarui informasi tersebut dari waktu ke waktu. Anda bertanggung jawab penuh atas keamanan akun dan kata sandi Anda. Push tidak bertanggung jawab atas kerugian yang diakibatkan oleh penyalahgunaan sandi oleh pihak ketiga.
        </Text>

        <Text style={styles.sectionTitle}>3. Layanan & Pemesanan</Text>
        <Text style={styles.paragraph}>
          Aplikasi Push berfungsi sebagai perantara antara pengguna, mitra toko, dan pengemudi. Waktu pengantaran dan ketersediaan barang sepenuhnya bergantung pada kondisi di lapangan, cuaca, dan ketersediaan mitra. 
        </Text>

        <Text style={styles.sectionTitle}>4. Kebijakan Pembayaran</Text>
        <Text style={styles.paragraph}>
          Pembayaran wajib diselesaikan sebagaimana disepakati saat pemesanan. Push menyediakan metode pembayaran langsung kepada mitra layanan di lapangan. Pengguna tidak diperkenankan melakukan tindakan penipuan atau pembayaran fiktif kepada Mitra Push.
        </Text>

        <Text style={styles.sectionTitle}>5. Pembatalan (Cancellation)</Text>
        <Text style={styles.paragraph}>
          Anda dapat membatalkan pesanan jika status belum diproses oleh mitra. Untuk pesanan makanan atau pembelian yang telah diproses dan dibuat oleh pihak mitra toko, pembatalan dapat mengakibatkan denda atau penonaktifan akun secara permanen.
        </Text>

        <Text style={styles.sectionTitle}>6. Privasi Pengguna</Text>
        <Text style={styles.paragraph}>
          Data pribadi Anda seperti lokasi, nomor telepon, dan email hanya akan digunakan untuk keperluan pemrosesan layanan di dalam ekosistem aplikasi Push, dan kami berkomitmen menjaga ketat kerahasiaan data tersebut.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', backgroundColor: '#fff' },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 20 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#1F2937' },
  scroll: { padding: 24, paddingBottom: 60 },
  title: { fontSize: 24, fontWeight: '800', color: '#1F2937', marginBottom: 6 },
  date: { fontSize: 13, color: '#6B7280', marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1F2937', marginTop: 16, marginBottom: 8 },
  paragraph: { fontSize: 14, color: '#4B5563', lineHeight: 22, textAlign: 'justify' }
});
