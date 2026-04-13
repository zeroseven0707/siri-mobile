import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, Image } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../../lib/api';
import { Service } from '../../types';
import { useAuthStore } from '../../lib/authStore';
import AuthPlaceholder from '../../components/AuthPlaceholder';

const GREEN = '#2ECC71';

export default function ServiceOrderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  
  // State for Food Service
  const [query, setQuery] = useState('');
  const [stores, setStores] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // State for Other Services
  const [pickup, setPickup] = useState('');
  const [destination, setDestination] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchService = async () => {
      try {
        const res = await api.get('/services');
        const found = res.data.data.find((s: Service) => s.id === id || s.slug === id);
        setService(found);
        if (found?.slug === 'food') {
          fetchStores();
        }
      } catch (err) {
        Alert.alert('Error', 'Gagal memuat layanan');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchService();
  }, [id]);

  const fetchStores = async (q = '') => {
    setIsSearching(true);
    try {
      const endpoint = q ? `/search?q=${q}&type=store` : '/stores';
      const res = await api.get(endpoint);
      setStores(res.data.data.stores || res.data.data || []);
    } catch {
      setStores([]);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    if (service?.slug === 'food') {
      const delay = setTimeout(() => {
        fetchStores(query);
      }, 500);
      return () => clearTimeout(delay);
    }
  }, [query]);

  const handleOrder = async () => {
    if (!pickup.trim() || !destination.trim()) {
      Alert.alert('Peringatan', 'Lokasi jemput dan tujuan harus diisi');
      return;
    }

    // Validasi alamat/koordinat user
    if (!user?.latitude || !user?.longitude || !user?.address) {
      Alert.alert(
        'Alamat Belum Diatur',
        'Kamu perlu mengatur alamat terlebih dahulu sebelum memesan.',
        [
          { text: 'Nanti', style: 'cancel' },
          { text: 'Atur Sekarang', onPress: () => router.push('/update-location') },
        ]
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        service_id: service?.id || id,
        pickup_location: pickup,
        destination_location: destination,
        price: service?.base_price || 15000,
        notes,
      };

      await api.post('/orders', payload);
      Alert.alert('Berhasil', 'Pesanan Anda sedang dicarikan driver!', [
        { text: 'OK', onPress: () => router.replace('/(tabs)/orders') }
      ]);
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || err.message || 'Gagal membuat pesanan');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color={GREEN} />
      </SafeAreaView>
    );
  }

  if (!service) {
    return (
      <SafeAreaView style={styles.center}>
        <Text>Layanan tidak ditemukan.</Text>
      </SafeAreaView>
    );
  }

  // KHUSUS TAMPILAN PESAN MAKANAN (LIST STORE)
  if (service.slug === 'food') {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{
          title: service.name,
          headerStyle: { backgroundColor: '#fff' },
          headerTintColor: '#000',
          headerShadowVisible: false,
        }} />

        <View style={styles.searchHeader}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={18} color="#9CA3AF" />
            <TextInput
              style={styles.searchInput}
              placeholder="Cari restoran atau makanan..."
              value={query}
              onChangeText={setQuery}
            />
            {query.length > 0 && (
              <Pressable onPress={() => setQuery('')}>
                <Ionicons name="close-circle" size={18} color="#9CA3AF" />
              </Pressable>
            )}
          </View>
        </View>

        {isSearching ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={GREEN} />
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.storeList} showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionTitle}>
              {query ? `Hasil pencarian "${query}"` : 'Restoran Populer'}
            </Text>

            {stores.map((store) => (
              <Pressable
                key={store.id}
                style={styles.storeCard}
                onPress={() => router.push(`/store/${store.id}`)}
              >
                <View style={styles.storeImagePlaceholder}>
                  <Image
                    source={store.image ? { uri: store.image } : require('../../assets/images/siri.png')}
                    style={styles.storeImage}
                  />
                </View>
                <View style={styles.storeInfo}>
                  <Text style={styles.storeName}>{store.name}</Text>
                  <Text style={styles.storeCategory}>{store.category?.name || 'Kuliner'}</Text>
                  <View style={styles.storeMetrics}>
                    <View style={styles.metricItem}>
                      <Ionicons name="star" size={14} color="#F59E0B" />
                      <Text style={styles.metricText}>{store.rating || '4.8'}</Text>
                    </View>
                    <Text style={styles.dot}>•</Text>
                    <Text style={styles.metricText}>{store.distance || '1.2 km'}</Text>
                    <Text style={styles.dot}>•</Text>
                    <View style={styles.promoBadge}>
                      <Text style={styles.promoText}>Promo</Text>
                    </View>
                  </View>
                </View>
              </Pressable>
            ))}

            {stores.length === 0 && (
              <View style={styles.emptyContainer}>
                <Ionicons name="restaurant-outline" size={64} color="#D1D5DB" />
                <Text style={styles.emptyText}>Tidak menemukan restoran</Text>
              </View>
            )}
          </ScrollView>
        )}
      </View>
    );
  }

  // PROTEKSI GUEST UNTUK LAYANAN SELAIN MAKANAN
  if (!user) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: service.name, headerStyle: { backgroundColor: '#fff' }, headerTintColor: '#000' }} />
        <AuthPlaceholder 
          icon="bicycle-outline"
          title={`Pesan ${service.name}`}
          description={`Silakan masuk untuk melakukan pemesanan ${service.name} dan menikmati seluruh fitur Siri.`}
        />
      </View>
    );
  }

  // TAMPILAN LAYANAN BIASA (FOOD BUKAN SLUG)
  return (
    <>
      <Stack.Screen options={{
        title: `Pesan ${service.name}`,
        headerStyle: { backgroundColor: GREEN },
        headerTintColor: '#fff',
      }} />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={100}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.mapPlaceholder}>
            <Ionicons name="map-outline" size={64} color="#9CA3AF" />
            <Text style={styles.mapText}>Peta Lokasi (Ilustrasi)</Text>
          </View>

          <View style={styles.formCard}>
            <View style={styles.inputGroup}>
              <Ionicons name="location" size={20} color={GREEN} style={styles.inputIcon} />
              <View style={styles.inputWrapper}>
                <Text style={styles.label}>Lokasi Jemput</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Cari lokasi jemput..."
                  value={pickup}
                  onChangeText={setPickup}
                />
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.inputGroup}>
              <Ionicons name="location" size={20} color="#EF4444" style={styles.inputIcon} />
              <View style={styles.inputWrapper}>
                <Text style={styles.label}>Tujuan</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Cari lokasi tujuan..."
                  value={destination}
                  onChangeText={setDestination}
                />
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.inputGroup}>
              <Ionicons name="document-text-outline" size={20} color="#6B7280" style={styles.inputIcon} />
              <View style={styles.inputWrapper}>
                <Text style={styles.label}>Catatan untuk Driver (Opsional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Contoh: Jemput di lobi depan"
                  value={notes}
                  onChangeText={setNotes}
                />
              </View>
            </View>
          </View>

          <View style={styles.priceContainer}>
            <Text style={styles.priceLabel}>Estimasi Harga</Text>
            <Text style={styles.priceValue}>Rp {Number(service.base_price || 15000).toLocaleString('id-ID')}</Text>
          </View>

        </ScrollView>

        <View style={styles.bottomBar}>
          <Pressable
            style={[styles.btnOrder, isSubmitting && { opacity: 0.7 }]}
            onPress={handleOrder}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnOrderText}>Pesan Sekarang</Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  container: { flex: 1, backgroundColor: '#fff' },
  
  // Search Styles
  searchHeader: { paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff' },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 12, paddingHorizontal: 12, height: 44, gap: 10 },
  searchInput: { flex: 1, fontSize: 14, color: '#1F2937' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Store List Styles
  storeList: { padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#1F2937', marginBottom: 16 },
  storeCard: { flexDirection: 'row', marginBottom: 20, gap: 12 },
  storeImagePlaceholder: { width: 90, height: 90, borderRadius: 12, backgroundColor: '#F3F4F6', overflow: 'hidden' },
  storeImage: { width: '100%', height: '100%' },
  storeInfo: { flex: 1, justifyContent: 'center' },
  storeName: { fontSize: 15, fontWeight: '700', color: '#1F2937' },
  storeCategory: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  storeMetrics: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 6 },
  metricItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metricText: { fontSize: 12, color: '#4B5563', fontWeight: '600' },
  dot: { color: '#D1D5DB' },
  promoBadge: { backgroundColor: '#F0FDF4', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  promoText: { color: GREEN, fontSize: 10, fontWeight: '800' },

  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 60 },
  emptyText: { color: '#9CA3AF', marginTop: 12, fontSize: 14 },

  // Original Order Styles
  scrollContent: { padding: 16 },
  mapPlaceholder: { height: 180, backgroundColor: '#E5E7EB', borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  mapText: { color: '#6B7280', marginTop: 8 },
  formCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, elevation: 2, marginBottom: 20 },
  inputGroup: { flexDirection: 'row', alignItems: 'center' },
  inputIcon: { marginRight: 16 },
  inputWrapper: { flex: 1 },
  label: { fontSize: 11, color: '#6B7280', marginBottom: 4, fontWeight: '500' },
  input: { fontSize: 15, color: '#111827', padding: 0 },
  divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 12, marginLeft: 36 },
  priceContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#ECFDF5', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#D1FAE5' },
  priceLabel: { fontSize: 14, color: '#065F46', fontWeight: '500' },
  priceValue: { fontSize: 18, color: '#065F46', fontWeight: 'bold' },
  bottomBar: { backgroundColor: '#fff', padding: 16, borderTopWidth: 1, borderTopColor: '#E5E7EB', elevation: 4 },
  btnOrder: { backgroundColor: GREEN, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  btnOrderText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
