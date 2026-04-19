import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, Image, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, X, Star, MapPin, ChevronRight, Bike, FileText, Info, Clock, Navigation } from 'lucide-react-native';
import api from '../../lib/api';
import { Service } from '../../types';
import { useAuthStore } from '../../lib/authStore';
import AuthPlaceholder from '../../components/AuthPlaceholder';
import { storageUrl } from '../../lib/storage';
import LocationPicker, { PickedLocation } from '../../components/LocationPicker';

const GREEN = '#2ECC71';
const DARK_GREEN = '#22A85A';

export default function ServiceOrderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [stores, setStores] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [pickup, setPickup] = useState('');
  const [destination, setDestination] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deliveryFee, setDeliveryFee] = useState<number | null>(null);
  const [calcFee, setCalcFee] = useState(false);

  // Koordinat untuk hitung ongkir
  const [pickupCoord, setPickupCoord] = useState<{ lat: number; lng: number } | null>(null);
  const [destCoord, setDestCoord] = useState<{ lat: number; lng: number } | null>(null);

  // Picker modal
  const [showPickupPicker, setShowPickupPicker] = useState(false);
  const [showDestPicker, setShowDestPicker] = useState(false);

  useEffect(() => {
    const fetchService = async () => {
      try {
        const res = await api.get('/services');
        const found = res.data.data.find((s: Service) => s.id === id || s.slug === id);
        setService(found);
        if (found?.slug === 'food') fetchStores();
      } catch { Alert.alert('Error', 'Gagal memuat layanan'); }
      finally { setLoading(false); }
    };
    if (id) fetchService();
    // Set pickup default dari alamat user
    if (user?.address) setPickup(user.address);
  }, [id]);

  const fetchStores = async (q = '') => {
    setIsSearching(true);
    try {
      const endpoint = q ? `/search?q=${q}&type=store` : '/stores';
      const res = await api.get(endpoint);
      setStores(res.data.data.stores || res.data.data || []);
    } catch { setStores([]); }
    finally { setIsSearching(false); }
  };

  useEffect(() => {
    if (service?.slug === 'food') {
      const delay = setTimeout(() => fetchStores(query), 500);
      return () => clearTimeout(delay);
    }
  }, [query]);

  // Hitung ongkir saat kedua koordinat tersedia
  useEffect(() => {
    const isRide = service && !['food', 'nitah'].includes(service.slug);
    if (!isRide || !pickupCoord || !destCoord) return;

    setCalcFee(true);
    api.get('/delivery-fee', {
      params: {
        from_lat: pickupCoord.lat, from_lng: pickupCoord.lng,
        to_lat: destCoord.lat,     to_lng: destCoord.lng,
      },
    }).then(res => setDeliveryFee(res.data.data.delivery_fee))
      .catch(() => {})
      .finally(() => setCalcFee(false));
  }, [pickupCoord, destCoord, service?.slug]);

  const handleOrder = async () => {
    const isRide = service && !['food', 'nitah'].includes(service.slug);
    if (isRide && !pickup.trim()) {
      Alert.alert('Peringatan', 'Pilih lokasi jemput terlebih dahulu');
      return;
    }
    if (!destination.trim()) {
      Alert.alert('Peringatan', service?.name.toLowerCase() === 'nitah' ? 'Kamu mau nitah apa? Mohon diisi dulu ya.' : 'Pilih lokasi tujuan terlebih dahulu');
      return;
    }
    if (!user?.latitude || !user?.longitude || !user?.address) {
      Alert.alert('Alamat Belum Diatur', 'Kamu perlu mengatur alamat terlebih dahulu sebelum memesan.', [
        { text: 'Nanti', style: 'cancel' },
        { text: 'Atur Sekarang', onPress: () => router.push('/update-location') },
      ]);
      return;
    }
    const finalFee = deliveryFee ?? service?.base_price ?? 15000;
    setIsSubmitting(true);
    try {
      await api.post('/orders', {
        service_id: service?.id || id,
        pickup_location: pickup || user.address,
        pickup_lat: pickupCoord?.lat ?? user.latitude,
        pickup_lng: pickupCoord?.lng ?? user.longitude,
        destination_location: destination,
        destination_lat: destCoord?.lat ?? null,
        destination_lng: destCoord?.lng ?? null,
        price: finalFee,
        delivery_fee: finalFee,
        notes,
      });
      Alert.alert('Berhasil! 🎉', 'Pesanan kamu sedang dicarikan driver.', [
        { text: 'Lihat Pesanan', onPress: () => router.replace('/(tabs)/orders') }
      ]);
    } catch (err: any) {
      const data = err?.response?.data;
      const msg = data?.errors ? Object.values(data.errors).flat().join('\n') : data?.message || err.message || 'Gagal membuat pesanan';
      Alert.alert('Gagal Memesan', msg);
    } finally { setIsSubmitting(false); }
  };

  if (loading) return <SafeAreaView style={styles.center}><ActivityIndicator size="large" color={GREEN} /></SafeAreaView>;
  if (!service) return <SafeAreaView style={styles.center}><Text>Layanan tidak ditemukan.</Text></SafeAreaView>;

  // ── FOOD: LIST STORE ──────────────────────────────────────────────
  if (service.slug === 'food') {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Pesan Makanan', headerStyle: { backgroundColor: '#fff' }, headerTintColor: '#111827', headerShadowVisible: false }} />

        {/* Search */}
        <View style={styles.searchHeader}>
          <View style={styles.searchBar}>
            <Search size={16} color="#9CA3AF" />
            <TextInput
              style={styles.searchInput}
              placeholder="Cari restoran atau makanan..."
              value={query}
              onChangeText={setQuery}
              placeholderTextColor="#9CA3AF"
            />
            {query.length > 0 && (
              <Pressable onPress={() => setQuery('')} hitSlop={8}>
                <X size={16} color="#9CA3AF" />
              </Pressable>
            )}
          </View>
        </View>

        {isSearching ? (
          <View style={styles.loadingContainer}><ActivityIndicator color={GREEN} size="large" /></View>
        ) : (
          <ScrollView contentContainerStyle={styles.storeList} showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionLabel}>
              {query ? `Hasil untuk "${query}"` : '🔥 Restoran Populer'}
            </Text>

            {stores.map((store) => (
              <Pressable key={store.id} style={styles.storeCard} onPress={() => router.push(`/store/${store.id}`)}>
                <View style={styles.storeImgWrap}>
                  {store.image
                    ? <Image source={{ uri: storageUrl(store.image)! }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                    : <Text style={{ fontSize: 36 }}>🍽️</Text>}
                  <View style={[styles.openBadge, { backgroundColor: store.is_open ? '#DCFCE7' : '#FEE2E2' }]}>
                    <View style={[styles.openDot, { backgroundColor: store.is_open ? GREEN : '#EF4444' }]} />
                    <Text style={[styles.openText, { color: store.is_open ? DARK_GREEN : '#DC2626' }]}>
                      {store.is_open ? 'Buka' : 'Tutup'}
                    </Text>
                  </View>
                </View>
                <View style={styles.storeCardInfo}>
                  <Text style={styles.storeCardName}>{store.name}</Text>
                  <Text style={styles.storeCardCat}>{store.category?.name || 'Kuliner'}</Text>
                  <View style={styles.storeCardMeta}>
                    <Star size={12} color="#F59E0B" fill="#F59E0B" />
                    <Text style={styles.metaText}>{store.rating || '4.8'}</Text>
                    <Text style={styles.metaDot}>•</Text>
                    <Clock size={12} color="#9CA3AF" />
                    <Text style={styles.metaText}>20-30 min</Text>
                    <Text style={styles.metaDot}>•</Text>
                    <View style={styles.promoBadge}><Text style={styles.promoText}>Promo</Text></View>
                  </View>
                </View>
                <ChevronRight size={18} color="#D1D5DB" />
              </Pressable>
            ))}

            {stores.length === 0 && (
              <View style={styles.emptyContainer}>
                <Text style={{ fontSize: 56 }}>🍽️</Text>
                <Text style={styles.emptyTitle}>Restoran tidak ditemukan</Text>
                <Text style={styles.emptyDesc}>Coba kata kunci lain</Text>
              </View>
            )}
          </ScrollView>
        )}
      </View>
    );
  }

  // ── GUEST GUARD ───────────────────────────────────────────────────
  if (!user) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: service.name, headerStyle: { backgroundColor: '#fff' }, headerTintColor: '#111827' }} />
        <AuthPlaceholder icon="Bike" title={`Pesan ${service.name}`} description={`Masuk untuk memesan ${service.name} dan nikmati semua fitur Siri.`} />
      </View>
    );
  }

  // ── ORDER FORM ────────────────────────────────────────────────────
  return (
    <>
      <Stack.Screen options={{ title: `Pesan ${service.name}`, headerStyle: { backgroundColor: '#fff' }, headerTintColor: '#111827', headerShadowVisible: false }} />
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={100}>
        <ScrollView contentContainerStyle={styles.formScroll} showsVerticalScrollIndicator={false}>

          {/* Service Banner */}
          <View style={styles.serviceBanner}>
            <View style={styles.serviceIconCircle}>
              <Bike size={28} color={GREEN} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.bannerTitle}>{service.name}</Text>
              <Text style={styles.bannerSub}>{service.description || 'Cepat, aman, dan terpercaya'}</Text>
            </View>
            <View style={styles.pricePill}>
              <Text style={styles.pricePillText}>Rp {Number(service.base_price || 15000).toLocaleString('id-ID')}</Text>
            </View>
          </View>

          {/* Pickup */}
          <View style={styles.formCard}>
            <View style={styles.formCardHeader}>
              <View style={[styles.dot2, { backgroundColor: GREEN }]} />
              <Text style={styles.formCardTitle}>Lokasi Jemput</Text>
            </View>
            <TouchableOpacity style={styles.locationPickerBtn} onPress={() => setShowPickupPicker(true)}>
              <View style={[styles.locationPickerIcon, { backgroundColor: '#F0FDF4' }]}>
                <MapPin size={18} color={GREEN} />
              </View>
              <View style={{ flex: 1 }}>
                {pickup
                  ? <Text style={styles.locationPickerText} numberOfLines={2}>{pickup}</Text>
                  : <Text style={styles.locationPickerPlaceholder}>Tap untuk pilih titik jemput di peta</Text>}
              </View>
              <ChevronRight size={16} color="#9CA3AF" />
            </TouchableOpacity>
            {/* Shortcut: pakai lokasi saat ini */}
            {user?.address && !pickup && (
              <TouchableOpacity
                style={styles.useCurrentBtn}
                onPress={() => {
                  setPickup(user.address!);
                  if (user.latitude && user.longitude) {
                    setPickupCoord({ lat: Number(user.latitude), lng: Number(user.longitude) });
                  }
                }}
              >
                <Navigation size={14} color={GREEN} />
                <Text style={styles.useCurrentText}>Gunakan lokasi saat ini</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Destination */}
          <View style={styles.formCard}>
            <View style={styles.formCardHeader}>
              <View style={[styles.dot2, { backgroundColor: '#EF4444' }]} />
              <Text style={styles.formCardTitle}>
                {service.name.toLowerCase() === 'nitah' ? 'Mau nitah apa?' : 'Tujuan'}
              </Text>
            </View>
            {service.name.toLowerCase() === 'nitah' ? (
              // Nitah: tetap pakai text input
              <View style={styles.inputBox}>
                <FileText size={16} color="#C4C9D4" style={{ marginTop: 2 }} />
                <TextInput
                  style={styles.textArea}
                  placeholder="Temenin ke dokter, Bantuin push rank, apa aja bisaa..."
                  placeholderTextColor="#C4C9D4"
                  value={destination}
                  onChangeText={setDestination}
                  multiline numberOfLines={3}
                />
              </View>
            ) : (
              <TouchableOpacity style={styles.locationPickerBtn} onPress={() => setShowDestPicker(true)}>
                <View style={[styles.locationPickerIcon, { backgroundColor: '#FEF2F2' }]}>
                  <MapPin size={18} color="#EF4444" />
                </View>
                <View style={{ flex: 1 }}>
                  {destination
                    ? <Text style={styles.locationPickerText} numberOfLines={2}>{destination}</Text>
                    : <Text style={styles.locationPickerPlaceholder}>Tap untuk pilih titik tujuan di peta</Text>}
                </View>
                <ChevronRight size={16} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>

          {/* Notes */}
          <View style={styles.formCard}>
            <View style={styles.formCardHeader}>
              <View style={[styles.dot2, { backgroundColor: '#9CA3AF' }]} />
              <Text style={styles.formCardTitle}>Catatan untuk Driver</Text>
              <View style={styles.optionalTag}><Text style={styles.optionalText}>Opsional</Text></View>
            </View>
            <View style={styles.inputBox}>
              <FileText size={16} color="#C4C9D4" style={{ marginTop: 2 }} />
              <TextInput
                style={styles.textArea}
                placeholder="Contoh: Jemput di lobi depan, pakai helm..."
                placeholderTextColor="#C4C9D4"
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
              />
            </View>
          </View>

        </ScrollView>

        {/* Bottom CTA */}
        <View style={styles.bottomBar}>
          <View>
            <Text style={styles.bottomLabel}>Estimasi Ongkir</Text>
            {calcFee ? (
              <ActivityIndicator size="small" color={GREEN} />
            ) : (
              <Text style={styles.bottomPrice}>
                Rp {Number(deliveryFee ?? service?.base_price ?? 15000).toLocaleString('id-ID')}
              </Text>
            )}
            {deliveryFee && !calcFee && (
              <Text style={{ fontSize: 10, color: '#9CA3AF' }}>Dihitung dari jarak</Text>
            )}
          </View>
          <Pressable style={[styles.btnOrder, isSubmitting && { opacity: 0.7 }]} onPress={handleOrder} disabled={isSubmitting}>
            {isSubmitting ? <ActivityIndicator color="#fff" /> : (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Bike size={18} color="#fff" />
                <Text style={styles.btnOrderText}>Pesan Sekarang</Text>
              </View>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      {/* Location Pickers */}
      <LocationPicker
        visible={showPickupPicker}
        title="Pilih Titik Jemput"
        initialLat={user?.latitude ? Number(user.latitude) : -6.2}
        initialLng={user?.longitude ? Number(user.longitude) : 106.8}
        onClose={() => setShowPickupPicker(false)}
        onConfirm={(loc: PickedLocation) => {
          setPickup(loc.address);
          setPickupCoord({ lat: loc.latitude, lng: loc.longitude });
          setShowPickupPicker(false);
        }}
      />
      <LocationPicker
        visible={showDestPicker}
        title="Pilih Titik Tujuan"
        initialLat={pickupCoord?.lat ?? (user?.latitude ? Number(user.latitude) : -6.2)}
        initialLng={pickupCoord?.lng ?? (user?.longitude ? Number(user.longitude) : 106.8)}
        onClose={() => setShowDestPicker(false)}
        onConfirm={(loc: PickedLocation) => {
          setDestination(loc.address);
          setDestCoord({ lat: loc.latitude, lng: loc.longitude });
          setShowDestPicker(false);
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F7F8FA' },
  container: { flex: 1, backgroundColor: '#F7F8FA' },

  // Search
  searchHeader: { paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 14, paddingHorizontal: 14, height: 46, gap: 10 },
  searchInput: { flex: 1, fontSize: 14, color: '#1F2937' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Store list
  storeList: { padding: 16, paddingBottom: 32 },
  sectionLabel: { fontSize: 17, fontWeight: '800', color: '#111827', marginBottom: 16, letterSpacing: -0.3 },
  storeCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 18, marginBottom: 12, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  storeImgWrap: { width: 90, height: 90, backgroundColor: '#F0FDF4', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  openBadge: { position: 'absolute', bottom: 6, left: 6, flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 5, paddingVertical: 2, borderRadius: 6 },
  openDot: { width: 5, height: 5, borderRadius: 3 },
  openText: { fontSize: 9, fontWeight: '800' },
  storeCardInfo: { flex: 1, paddingHorizontal: 12, paddingVertical: 10 },
  storeCardName: { fontSize: 15, fontWeight: '800', color: '#111827' },
  storeCardCat: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  storeCardMeta: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8 },
  metaText: { fontSize: 11, color: '#4B5563', fontWeight: '600' },
  metaDot: { color: '#D1D5DB' },
  promoBadge: { backgroundColor: '#F0FDF4', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  promoText: { color: DARK_GREEN, fontSize: 9, fontWeight: '800' },
  emptyContainer: { alignItems: 'center', paddingTop: 60 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#374151', marginTop: 12 },
  emptyDesc: { fontSize: 13, color: '#9CA3AF', marginTop: 4 },

  // Order form
  formScroll: { padding: 16, paddingBottom: 120 },
  serviceBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 20, padding: 16, marginBottom: 14, gap: 12, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  serviceIconCircle: { width: 52, height: 52, borderRadius: 16, backgroundColor: '#F0FDF4', alignItems: 'center', justifyContent: 'center' },
  bannerTitle: { fontSize: 16, fontWeight: '800', color: '#111827' },
  bannerSub: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  pricePill: { backgroundColor: '#F0FDF4', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  pricePillText: { color: DARK_GREEN, fontWeight: '800', fontSize: 13 },

  formCard: { backgroundColor: '#fff', borderRadius: 20, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  formCardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
  formCardTitle: { fontSize: 13, fontWeight: '700', color: '#374151', flex: 1 },
  dot2: { width: 9, height: 9, borderRadius: 5 },
  optionalTag: { backgroundColor: '#F3F4F6', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  optionalText: { fontSize: 10, color: '#9CA3AF', fontWeight: '600' },

  locationPickerBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#F9FAFB', borderRadius: 14, padding: 14,
    borderWidth: 1.5, borderColor: '#E5E7EB',
  },
  locationPickerIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  locationPickerText: { fontSize: 13, fontWeight: '600', color: '#111827', lineHeight: 18 },
  locationPickerPlaceholder: { fontSize: 13, color: '#9CA3AF' },
  useCurrentBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: 10, alignSelf: 'flex-start',
    backgroundColor: '#F0FDF4', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10,
  },
  useCurrentText: { fontSize: 12, color: GREEN, fontWeight: '700' },

  inputBox: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#F9FAFB', borderRadius: 14, padding: 12, gap: 10, borderWidth: 1, borderColor: '#F3F4F6' },
  textArea: { flex: 1, fontSize: 14, color: '#1F2937', padding: 0, lineHeight: 21, minHeight: 60 },
  hintRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 5, marginTop: 8 },
  hintText: { flex: 1, fontSize: 11, color: '#C4C9D4', lineHeight: 16 },

  bottomBar: { backgroundColor: '#fff', paddingHorizontal: 20, paddingVertical: 14, paddingBottom: Platform.OS === 'ios' ? 30 : 14, borderTopWidth: 1, borderTopColor: '#F3F4F6', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', elevation: 10, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: -4 } },
  bottomLabel: { fontSize: 11, color: '#9CA3AF', marginBottom: 2 },
  bottomPrice: { fontSize: 20, fontWeight: '800', color: '#111827' },
  btnOrder: { backgroundColor: GREEN, paddingVertical: 14, paddingHorizontal: 22, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', shadowColor: GREEN, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  btnOrderText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});
