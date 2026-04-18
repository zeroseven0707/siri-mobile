import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';

export default function AboutScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#1F2937" />
        </Pressable>
        <Text style={styles.headerTitle}>Tentang Push</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.center}>
          <Image source={require('../assets/images/push.png')} style={{ width: 120, height: 120, marginBottom: 16 }} resizeMode="contain" />
          <Text style={styles.appName}>Push</Text>
          <Text style={styles.version}>Versi 1.0.0</Text>
        </View>

        <Text style={styles.desc}>
          Push (Sistem Interaksi dan Respons Integratif) adalah platform digital yang akan memudahkan hari-hari kita semua. Melayani segala kebutuhan sehari-hari dengan "Mudah, Cepat, dan Nyaman".
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Visi Kami</Text>
          <Text style={styles.cardText}>
            Menjadi platform lokal terbaik yang memberdayakan driver dan toko-toko mikro, memberikan kemudahan nyata bagi setiap pelanggan.
          </Text>
        </View>

        <Text style={styles.footer}>© 2026 Pamuda Nyipta Karya. All rights reserved.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', backgroundColor: '#fff' },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 20 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#1F2937' },
  scroll: { padding: 24 },
  center: { alignItems: 'center', marginBottom: 32 },
  appName: { fontSize: 24, fontWeight: '800', color: '#2ECC71' },
  version: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  desc: { fontSize: 15, color: '#374151', lineHeight: 24, textAlign: 'center', marginBottom: 32 },
  card: { backgroundColor: '#fff', padding: 20, borderRadius: 16, elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3, marginBottom: 40 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#1F2937', marginBottom: 8 },
  cardText: { fontSize: 14, color: '#4B5563', lineHeight: 22 },
  footer: { textAlign: 'center', color: '#9CA3AF', fontSize: 12 }
});
