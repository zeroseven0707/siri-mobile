import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Mail } from 'lucide-react-native';
import { useRouter } from 'expo-router';

export default function HelpScreen() {
  const router = useRouter();

  const handleContact = () => {
    Linking.openURL('mailto:pamudanyiptakarya@gmail.com');
  };

  return (
    <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#1F2937" />
        </Pressable>
        <Text style={styles.headerTitle}>Pusat Bantuan</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Ada yang bisa kami bantu?</Text>
        
        {[
          { q: 'Bagaimana cara membatalkan pesanan?', a: 'Masuk ke menu Riwayat Transaksi (Orders), pilih pesanan yang berstatus Menunggu, lalu tekan tombol Batalkan.' },
          { q: 'Metode pembayaran apa saja yang didukung?', a: 'Saat ini kami melayani pembayaran tunai (Cash on Delivery) ke driver langsung.' },
          { q: 'Kenapa toko favorit saya tutup?', a: 'Toko mitra memiliki jam operasional masing-masing yang dapat Anda lihat pada keterangan profil mereka.' }
        ].map((faq, i) => {
          const ItemView = View as any;
          return (
            <ItemView key={i} style={styles.faqCard}>
              <Text style={styles.q}>{faq.q}</Text>
              <Text style={styles.a}>{faq.a}</Text>
            </ItemView>
          );
        })}

        <Text style={styles.subtitle}>Masih butuh bantuan lain?</Text>
        <Pressable style={styles.btn} onPress={handleContact}>
           <Mail size={20} color="#fff" />
           <Text style={styles.btnText}>Hubungi Customer Service</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', backgroundColor: '#fff' },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 20 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#1F2937' },
  scroll: { padding: 20 },
  title: { fontSize: 20, fontWeight: '800', color: '#1F2937', marginBottom: 20 },
  faqCard: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12, elevation: 1 },
  q: { fontSize: 15, fontWeight: '700', color: '#1F2937', marginBottom: 6 },
  a: { fontSize: 14, color: '#4B5563', lineHeight: 22 },
  subtitle: { fontSize: 16, fontWeight: '700', color: '#1F2937', marginTop: 24, marginBottom: 12 },
  btn: { backgroundColor: '#2ECC71', flexDirection: 'row', padding: 16, borderRadius: 14, alignItems: 'center', justifyContent: 'center', gap: 8 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' }
});
