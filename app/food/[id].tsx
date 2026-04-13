import React, { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Text, View, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Minus, Plus, ChevronRight, ArrowLeft, Star, ShoppingBag } from 'lucide-react-native';
import api from '../../lib/api';
import { FoodItem, Store } from '../../types';
import { useAuthStore } from '../../lib/authStore';
import { storageUrl } from '../../lib/storage';

const GREEN = '#2ECC71';
const DARK_GREEN = '#22A85A';

export default function FoodDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const [food, setFood] = useState<FoodItem | null>(null);
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchFood = async () => {
      try {
        const res = await api.get(`/foods/${id}`);
        setFood(res.data.data.food_item);
        setStore(res.data.data.store);
      } catch { Alert.alert('Error', 'Gagal memuat menu'); }
      finally { setLoading(false); }
    };
    if (id) fetchFood();
  }, [id]);

  const handleOrder = async () => {
    if (!food || !store) return;
    if (!user?.latitude || !user?.longitude || !user?.address) {
      Alert.alert('Alamat Belum Diatur', 'Atur alamat pengiriman terlebih dahulu.', [
        { text: 'Nanti', style: 'cancel' },
        { text: 'Atur Sekarang', onPress: () => router.push('/update-location') },
      ]);
      return;
    }
    setIsSubmitting(true);
    try {
      const servicesRes = await api.get('/services');
      const foodService = servicesRes.data.data.find((s: any) => s.slug === 'food');
      if (!foodService) throw new Error('Layanan Food tidak ditemukan');
      await api.post('/food-orders', {
        service_id: foodService.id,
        pickup_location: store.address || 'Lokasi Toko',
        destination_location: 'Lokasi Anda (Default)',
        price: Number(food.price) * quantity,
        notes: '',
        food_items: [{ food_item_id: food.id, qty: quantity, price: food.price }],
      });
      Alert.alert('Pesanan Masuk! 🎉', 'Pesanan makananmu sedang diproses.', [
        { text: 'Lihat Pesanan', onPress: () => router.push('/(tabs)/orders' as any) }
      ]);
    } catch (err: any) {
      const data = err?.response?.data;
      const msg = data?.errors ? Object.values(data.errors).flat().join('\n') : data?.message || err.message || 'Gagal memproses pesanan.';
      Alert.alert('Gagal Memesan', msg);
    } finally { setIsSubmitting(false); }
  };

  if (loading) return <SafeAreaView style={styles.center}><ActivityIndicator size="large" color={GREEN} /></SafeAreaView>;
  if (!food) return (
    <SafeAreaView style={styles.center}>
      <Text style={{ color: '#6B7280', marginBottom: 16 }}>Menu tidak ditemukan</Text>
      <Pressable onPress={() => router.back()} style={styles.backLink}><Text style={{ color: GREEN, fontWeight: '700' }}>← Kembali</Text></Pressable>
    </SafeAreaView>
  );

  return (
    <View style={styles.flex}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Hero Image */}
        <View style={styles.heroWrap}>
          {food.image
            ? <Image source={{ uri: storageUrl(food.image)! }} style={styles.heroImg} resizeMode="cover" />
            : <View style={styles.heroPlaceholder}><Text style={{ fontSize: 72 }}>🍱</Text></View>}
          <View style={styles.heroOverlay} />

          {/* Back button */}
          <SafeAreaView style={styles.heroHeader} edges={['top']}>
            <Pressable style={styles.backBtn} onPress={() => router.back()}>
              <ArrowLeft size={20} color="#1F2937" />
            </Pressable>
          </SafeAreaView>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Name & Price */}
          <View style={styles.titleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.foodName}>{food.name}</Text>
              <View style={styles.ratingRow}>
                <Star size={13} color="#F59E0B" fill="#F59E0B" />
                <Text style={styles.ratingText}>4.8 · 120+ terjual</Text>
              </View>
            </View>
            <Text style={styles.foodPrice}>Rp {Number(food.price).toLocaleString('id-ID')}</Text>
          </View>

          {/* Description */}
          <Text style={styles.foodDesc}>
            {food.description || 'Menu lezat yang disiapkan dengan bahan-bahan segar pilihan.'}
          </Text>

          {/* Store card */}
          {store && (
            <Pressable style={styles.storeCard} onPress={() => router.push(`/store/${store.id}` as any)}>
              <View style={styles.storeImgWrap}>
                {store.image
                  ? <Image source={{ uri: storageUrl(store.image)! }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                  : <Text style={{ fontSize: 22 }}>🍽️</Text>}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.storeLabel}>Disediakan oleh</Text>
                <Text style={styles.storeName}>{store.name}</Text>
              </View>
              <ChevronRight size={18} color="#D1D5DB" />
            </Pressable>
          )}

          {/* Qty */}
          <View style={styles.qtySection}>
            <Text style={styles.qtyLabel}>Jumlah</Text>
            <View style={styles.qtyControl}>
              <Pressable onPress={() => setQuantity(Math.max(1, quantity - 1))} style={styles.qtyBtn}>
                <Minus size={18} color={quantity === 1 ? '#D1D5DB' : GREEN} />
              </Pressable>
              <Text style={styles.qtyText}>{quantity}</Text>
              <Pressable onPress={() => setQuantity(quantity + 1)} style={[styles.qtyBtn, { backgroundColor: GREEN }]}>
                <Plus size={18} color="#fff" />
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <View>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalPrice}>Rp {(Number(food.price) * quantity).toLocaleString('id-ID')}</Text>
        </View>
        <Pressable style={[styles.orderBtn, isSubmitting && { opacity: 0.7 }]} onPress={handleOrder} disabled={isSubmitting}>
          {isSubmitting ? <ActivityIndicator color="#fff" /> : (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <ShoppingBag size={18} color="#fff" />
              <Text style={styles.orderBtnText}>Pesan Sekarang</Text>
            </View>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  backLink: { padding: 8 },

  heroWrap: { position: 'relative', height: 300 },
  heroImg: { width: '100%', height: '100%' },
  heroPlaceholder: { width: '100%', height: '100%', backgroundColor: '#FFF7ED', alignItems: 'center', justifyContent: 'center' },
  heroOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 80, backgroundColor: 'transparent' },
  heroHeader: { position: 'absolute', top: 0, left: 0, right: 0, paddingHorizontal: 16, paddingTop: 8 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.95)', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },

  content: { padding: 20 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  foodName: { fontSize: 22, fontWeight: '800', color: '#111827', letterSpacing: -0.3, lineHeight: 28 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  ratingText: { fontSize: 12, color: '#6B7280', fontWeight: '600' },
  foodPrice: { fontSize: 20, fontWeight: '800', color: DARK_GREEN },
  foodDesc: { fontSize: 14, color: '#6B7280', lineHeight: 22, marginBottom: 20, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },

  storeCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F7F8FA', borderRadius: 16, padding: 14, gap: 12, marginBottom: 24 },
  storeImgWrap: { width: 46, height: 46, borderRadius: 14, backgroundColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  storeLabel: { fontSize: 11, color: '#9CA3AF', fontWeight: '600' },
  storeName: { fontSize: 14, fontWeight: '700', color: '#111827', marginTop: 2 },

  qtySection: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  qtyLabel: { fontSize: 15, fontWeight: '700', color: '#111827' },
  qtyControl: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  qtyBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  qtyText: { fontSize: 18, fontWeight: '800', color: '#111827', minWidth: 40, textAlign: 'center' },

  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff',
    paddingHorizontal: 20, paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    borderTopWidth: 1, borderTopColor: '#F3F4F6',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: -4 }, elevation: 10,
  },
  totalLabel: { fontSize: 12, color: '#9CA3AF', marginBottom: 2 },
  totalPrice: { fontSize: 20, fontWeight: '800', color: '#111827' },
  orderBtn: { backgroundColor: GREEN, paddingVertical: 14, paddingHorizontal: 22, borderRadius: 16, shadowColor: GREEN, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  orderBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
});
