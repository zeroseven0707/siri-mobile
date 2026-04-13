import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, Image } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../../lib/api';
import { Service } from '../../types';
import { useAuthStore } from '../../lib/authStore';
import AuthPlaceholder from '../../components/AuthPlaceholder';
import MapViewFree from '../../components/MapViewFree';

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
    if (!destination.trim()) {
      const errorMsg = service?.name.toLowerCase() === 'nitah'
        ? 'Kamu mau nitah apa? Mohon diisi dulu ya.'
        : 'Lokasi tujuan harus diisi';
      Alert.alert('Peringatan', errorMsg);
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
        pickup_location: user.address,
        destination_location: destination,
        price: service?.base_price || 15000,
        notes,
      };

      await api.post('/orders', payload);
      Alert.alert('Berhasil', 'Pesanan Anda sedang dicarikan driver!', [
        { text: 'OK', onPress: () => router.replace('/(tabs)/orders') }
      ]);
    } catch (err: any) {
      const data = err?.response?.data;
      const msg = data?.errors
        ? Object.values(data.errors).flat().join('\n')
        : data?.message || err.message || 'Gagal membuat pesanan';
      Alert.alert('Gagal Memesan', msg);
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
          icon="Bike"
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
        headerStyle: { backgroundColor: '#fff' },
        headerTintColor: '#1F2937',
        headerShadowVisible: false,
      }} />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={100}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          {/* Service Banner */}
          <View style={styles.serviceBanner}>
            <View style={styles.serviceIconCircle}>
              <Ionicons name="bicycle-outline" size={32} color={GREEN} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.serviceBannerTitle}>{service.name}</Text>
              <Text style={styles.serviceBannerSub}>
                {service.description || 'Cepat, aman, dan terpercaya'}
              </Text>
            </View>
            <View style={styles.pricePill}>
              <Text style={styles.pricePillText}>Rp {Number(service.base_price || 15000).toLocaleString('id-ID')}</Text>
            </View>
          </View>

          {/* Lokasi Jemput */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionCardHeader}>
              <View style={[styles.dotIndicator, { backgroundColor: GREEN }]} />
              <Text style={styles.sectionCardTitle}>Lokasi Jemput</Text>
            </View>

            {user?.address && user?.latitude && user?.longitude ? (
              <View>
                <View style={styles.locationInfoBox}>
                  <Ionicons name="location" size={18} color={GREEN} />
                  <Text style={styles.locationInfoText} numberOfLines={2}>{user.address}</Text>
                  <Pressable onPress={() => router.push('/update-location')} style={styles.changeBtn}>
                    <Text style={styles.changeBtnText}>Ubah</Text>
                  </Pressable>
                </View>
                <View style={styles.mapPreview} pointerEvents="none">
                  <MapViewFree latitude={Number(user.latitude)} longitude={Number(user.longitude)} />
                </View>
              </View>
            ) : (
              <Pressable style={styles.emptyLocationBox} onPress={() => router.push('/update-location')}>
                <View style={styles.emptyLocationIcon}>
                  <Ionicons name="location-outline" size={24} color="#9CA3AF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.emptyLocationTitle}>Lokasi belum diatur</Text>
                  <Text style={styles.emptyLocationSub}>Tap untuk mengatur lokasi kamu</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
              </Pressable>
            )}
          </View>

          {/* Tujuan / Form Utama */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionCardHeader}>
              <View style={[styles.dotIndicator, { backgroundColor: '#EF4444' }]} />
              <Text style={styles.sectionCardTitle}>
                {service.name.toLowerCase() === 'nitah' ? 'Mau nitah apa?' : 'Tujuan'}
              </Text>
            </View>

            <View style={styles.notesBox}>
              <Ionicons name="location-outline" size={18} color="#EF4444" style={{ marginTop: 2 }} />
              <TextInput
                style={styles.notesInput}
                placeholder={
                  service.name.toLowerCase() === 'nitah'
                    ? 'Temenin ke dokter, Bantuin push rank, apa aja bisaa'
                    : 'Ketik alamat tujuan lengkap\nContoh: Jl. Merdeka No. 10, Kel. Sukajadi, Kec. Bandung Wetan, Kota Bandung'
                }
                placeholderTextColor="#9CA3AF"
                value={destination}
                onChangeText={setDestination}
                multiline
                numberOfLines={3}
              />
            </View>
            <Text style={styles.destHint}>
              <Ionicons name="information-circle-outline" size={12} color="#9CA3AF" />
              {service.name.toLowerCase() === 'nitah'
                ? ' Jelaskan apa yang kamu butuhkan agar kami bisa membantu dengan tepat.'
                : ' Sertakan nama jalan, nomor, kelurahan, dan kota agar driver mudah menemukan lokasi kamu.'
              }
            </Text>
          </View>

          {/* Catatan */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionCardHeader}>
              <View style={[styles.dotIndicator, { backgroundColor: '#6B7280' }]} />
              <Text style={styles.sectionCardTitle}>Catatan untuk Driver</Text>
              <Text style={styles.optionalTag}>Opsional</Text>
            </View>
            <View style={styles.notesBox}>
              <Ionicons name="document-text-outline" size={18} color="#9CA3AF" style={{ marginTop: 2 }} />
              <TextInput
                style={styles.notesInput}
                placeholder="Contoh: Jemput di lobi depan, pakai helm..."
                placeholderTextColor="#9CA3AF"
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
              />
            </View>
          </View>

        </ScrollView>

        {/* Bottom Bar */}
        <View style={styles.bottomBar}>
          <View style={styles.bottomInfo}>
            <Text style={styles.bottomLabel}>Estimasi Harga</Text>
            <Text style={styles.bottomPrice}>Rp {Number(service.base_price || 15000).toLocaleString('id-ID')}</Text>
          </View>
          <Pressable
            style={[styles.btnOrder, isSubmitting && { opacity: 0.7 }]}
            onPress={handleOrder}
            disabled={isSubmitting}
          >
            {isSubmitting
              ? <ActivityIndicator color="#fff" />
              : <>
                <Ionicons name="bicycle-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.btnOrderText}>Pesan Sekarang</Text>
              </>
            }
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
  scrollContent: { padding: 16, paddingBottom: 100, backgroundColor: '#F8FAFB' },
  mapPlaceholder: { height: 180, backgroundColor: '#E5E7EB', borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  mapText: { color: '#6B7280', marginTop: 8 },

  // Service Banner
  serviceBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, gap: 12, elevation: 1, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8 },
  serviceIconCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#F0FDF4', alignItems: 'center', justifyContent: 'center' },
  serviceBannerTitle: { fontSize: 16, fontWeight: '800', color: '#1F2937' },
  serviceBannerSub: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  pricePill: { backgroundColor: '#F0FDF4', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#D1FAE5' },
  pricePillText: { color: GREEN, fontWeight: '800', fontSize: 13 },

  // Section Cards
  sectionCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, elevation: 1, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8 },
  sectionCardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
  sectionCardTitle: { fontSize: 13, fontWeight: '700', color: '#374151', flex: 1 },
  dotIndicator: { width: 10, height: 10, borderRadius: 5 },
  optionalTag: { fontSize: 10, color: '#9CA3AF', backgroundColor: '#F3F4F6', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },

  // Location
  locationInfoBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0FDF4', borderRadius: 12, padding: 12, gap: 10, marginBottom: 10 },
  locationInfoText: { flex: 1, fontSize: 13, color: '#1F2937', fontWeight: '500', lineHeight: 18 },
  changeBtn: { backgroundColor: '#fff', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: '#D1FAE5' },
  changeBtnText: { color: GREEN, fontSize: 11, fontWeight: '700' },
  emptyLocationBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: 12, padding: 14, gap: 12, borderWidth: 1, borderColor: '#E5E7EB', borderStyle: 'dashed' },
  emptyLocationIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  emptyLocationTitle: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  emptyLocationSub: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  mapPreview: { borderRadius: 14, overflow: 'hidden', height: 180 },

  destHint: { fontSize: 11, color: '#9CA3AF', marginTop: 8, lineHeight: 16 },

  // Notes
  notesBox: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#F9FAFB', borderRadius: 12, padding: 12, gap: 10, borderWidth: 1, borderColor: '#F3F4F6' },
  notesInput: { flex: 1, fontSize: 14, color: '#1F2937', padding: 0, lineHeight: 20 },

  // Bottom Bar
  bottomBar: { backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 12, paddingBottom: Platform.OS === 'ios' ? 28 : 12, borderTopWidth: 1, borderTopColor: '#F3F4F6', flexDirection: 'row', alignItems: 'center', gap: 12, elevation: 8 },
  bottomInfo: { flex: 1 },
  bottomLabel: { fontSize: 11, color: '#9CA3AF' },
  bottomPrice: { fontSize: 18, fontWeight: '800', color: '#1F2937' },
  btnOrder: { backgroundColor: GREEN, paddingVertical: 14, paddingHorizontal: 20, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  btnOrderText: { color: '#fff', fontWeight: '800', fontSize: 15 },

  // Old unused
  formCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, elevation: 2, marginBottom: 20 },
  inputGroup: { flexDirection: 'row', alignItems: 'center' },
  inputIcon: { marginRight: 16 },
  inputWrapper: { flex: 1 },
  label: { fontSize: 11, color: '#6B7280', marginBottom: 4, fontWeight: '500' },
  input: { fontSize: 15, color: '#111827', padding: 0 },
  locationText: { fontSize: 14, color: '#111827', fontWeight: '500' },
  editLocation: { color: GREEN, fontSize: 12, fontWeight: '700', marginTop: 4 },
  locationEmpty: { fontSize: 13, color: '#9CA3AF' },
  setLocationBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  setLocationText: { color: GREEN, fontSize: 12, fontWeight: '700' },
  divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 12, marginLeft: 36 },
  priceContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#ECFDF5', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#D1FAE5' },
  priceLabel: { fontSize: 14, color: '#065F46', fontWeight: '500' },
  priceValue: { fontSize: 18, color: '#065F46', fontWeight: 'bold' },
});
