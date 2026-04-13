import React, { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../../lib/api';
import { FoodItem, Store } from '../../types';
import { useAuthStore } from '../../lib/authStore';

const GREEN = '#2ECC71';
const DARK_GREEN = '#27AE60';

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
      } catch (err) {
        Alert.alert('Error', 'Gagal memuat bahan/menu makanan');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchFood();
  }, [id]);

  const handleOrder = async () => {
    if (!food || !store) return;

    // Validasi alamat sebelum submit
    if (!user?.latitude || !user?.longitude || !user?.address) {
      Alert.alert(
        'Alamat Belum Diatur',
        'Kamu perlu mengatur alamat pengiriman terlebih dahulu sebelum memesan.',
        [
          { text: 'Nanti', style: 'cancel' },
          { text: 'Atur Sekarang', onPress: () => router.push('/update-location') },
        ]
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const servicesRes = await api.get('/services');
      const foodService = servicesRes.data.data.find((s: any) => s.slug === 'food');
      if (!foodService) throw new Error('Layanan Food tidak ditemukan');

      const payload = {
        service_id: foodService.id,
        pickup_location: store.address || 'Lokasi Toko',
        destination_location: 'Lokasi Anda (Default)', 
        price: Number(food.price) * quantity,
        notes: '',
        food_items: [{
          food_item_id: food.id,
          qty: quantity,
          price: food.price,
        }],
      };
      
      await api.post('/food-orders', payload);
      Alert.alert('Sukses', 'Pesanan makanan berhasil dibuat!', [
        { text: 'OK', onPress: () => router.push('/(tabs)/orders' as any) }
      ]);
    } catch (err: any) {
      const data = err?.response?.data;
      const msg = data?.errors
        ? Object.values(data.errors).flat().join('\n')
        : data?.message || err.message || 'Gagal memproses pesanan.';
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

  if (!food) {
    return (
      <SafeAreaView style={styles.center}>
        <Text>Menu tidak ditemukan</Text>
        <Pressable onPress={() => router.back()} style={{ marginTop: 20 }}>
          <Text style={{ color: GREEN }}>Kembali</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.flex} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </Pressable>
        <Text style={styles.headerTitle}>Detail Menu</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {food.image ? (
          <Image source={{ uri: food.image }} style={styles.foodBanner} resizeMode="cover" />
        ) : (
          <View style={[styles.foodBanner, { backgroundColor: '#FFF7ED', alignItems: 'center', justifyContent: 'center' }]}>
            <Text style={{ fontSize: 60 }}>🍱</Text>
          </View>
        )}

        <View style={styles.content}>
          <Text style={styles.foodName}>{food.name}</Text>
          <Text style={styles.foodPrice}>Rp {Number(food.price).toLocaleString('id-ID')}</Text>
          
          <Text style={styles.foodDesc}>
            {food.description || 'Tidak ada deskripsi tersedia untuk menu ini.'}
          </Text>

          {store && (
             <Pressable style={styles.storeMiniCard} onPress={() => router.push(`/store/${store.id}` as any)}>
                <View style={styles.storeMiniIcon}>
                   <Text style={{ fontSize: 24 }}>🍽️</Text>
                </View>
                <View style={{ flex: 1 }}>
                   <Text style={{ fontSize: 13, color: '#6B7280' }}>Disediakan oleh</Text>
                   <Text style={{ fontSize: 15, fontWeight: '700', color: '#1F2937' }}>{store.name}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
             </Pressable>
          )}

          <View style={styles.qtyContainer}>
             <Text style={{ fontSize: 15, fontWeight: '600', color: '#374151' }}>Jumlah Pesanan</Text>
             <View style={styles.qtyControl}>
                <Pressable onPress={() => setQuantity(Math.max(1, quantity - 1))} style={styles.qtyBtn}>
                  <Ionicons name="remove" size={20} color={GREEN} />
                </Pressable>
                <Text style={styles.qtyText}>{quantity}</Text>
                <Pressable onPress={() => setQuantity(quantity + 1)} style={styles.qtyBtn}>
                  <Ionicons name="add" size={20} color={GREEN} />
                </Pressable>
             </View>
          </View>
        </View>
      </ScrollView>

      {/* Footer / Order Button */}
      <View style={styles.footer}>
        <View style={styles.summary}>
           <Text style={styles.totalLabel}>Total Harga</Text>
           <Text style={styles.totalPrice}>Rp {(Number(food.price) * quantity).toLocaleString('id-ID')}</Text>
        </View>
        <Pressable 
          style={[styles.orderBtn, isSubmitting && { opacity: 0.7 }]} 
          onPress={handleOrder}
          disabled={isSubmitting}
        >
          {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.orderBtnText}>Pesan Sekarang</Text>}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6'
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: '#F9FAFB'
  },
  headerTitle: { fontSize: 16, fontWeight: '600', color: '#1F2937' },
  foodBanner: { width: '100%', height: 260 },
  content: { padding: 20 },
  foodName: { fontSize: 24, fontWeight: 'bold', color: '#111827', marginBottom: 8 },
  foodPrice: { fontSize: 20, fontWeight: '700', color: GREEN, marginBottom: 16 },
  foodDesc: { fontSize: 14, color: '#4B5563', lineHeight: 22, paddingBottom: 24, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  storeMiniCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', padding: 16, borderRadius: 16, marginTop: 24, borderWidth: 1, borderColor: '#E5E7EB' },
  storeMiniIcon: { width: 50, height: 50, backgroundColor: '#fff', borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 16, borderWidth: 1, borderColor: '#F3F4F6' },
  qtyContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 32 },
  qtyControl: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0FDF4', borderRadius: 24, paddingHorizontal: 4, paddingVertical: 4 },
  qtyBtn: { width: 36, height: 36, backgroundColor: '#fff', borderRadius: 18, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  qtyText: { fontSize: 16, fontWeight: '600', marginHorizontal: 20, color: '#1F2937' },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 10
  },
  summary: { flex: 1 },
  totalLabel: { fontSize: 13, color: '#6B7280', marginBottom: 4 },
  totalPrice: { fontSize: 18, fontWeight: '800', color: '#111827' },
  orderBtn: { backgroundColor: GREEN, paddingVertical: 14, paddingHorizontal: 24, borderRadius: 14, alignItems: 'center', justifyContent: 'center', minWidth: 140 },
  orderBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' }
});
