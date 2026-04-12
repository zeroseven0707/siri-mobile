import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../../lib/api';
import { FoodItem, Store, Service } from '../../types';

const GREEN = '#2ECC71';
const DARK_GREEN = '#27AE60';

type CartItem = FoodItem & { qty: number };

export default function StoreDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [store, setStore] = useState<Store | null>(null);
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<Record<string, CartItem>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchStore = async () => {
      try {
        const res = await api.get(`/stores/${id}`);
        setStore(res.data.data);
        setFoods(res.data.data.food_items || []);
      } catch (err) {
        Alert.alert('Error', 'Gagal memuat detail toko');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchStore();
  }, [id]);

  const updateCart = (food: FoodItem, delta: number) => {
    setCart((prev) => {
      const currentQty = prev[food.id]?.qty || 0;
      const newQty = Math.max(0, currentQty + delta);
      const newCart = { ...prev };
      if (newQty === 0) {
        delete newCart[food.id];
      } else {
        newCart[food.id] = { ...food, qty: newQty };
      }
      return newCart;
    });
  };

  const calculateTotal = () => {
    return Object.values(cart).reduce((sum, item) => sum + item.price * item.qty, 0);
  };

  const handleCreateOrder = async () => {
    const cartItems = Object.values(cart);
    if (cartItems.length === 0) return;
    
    setIsSubmitting(true);
    try {
      // Find food service id first!
      const servicesRes = await api.get('/services');
      const foodService = servicesRes.data.data.find((s: Service) => s.slug === 'food');
      if (!foodService) throw new Error('Layanan Food tidak ditemukan');

      const payload = {
        service_id: foodService.id,
        pickup_location: store?.address || 'Lokasi Toko',
        destination_location: 'Lokasi Anda (Default)', // Simplified for demo
        price: calculateTotal(), // Actually delivery price! Let's just use total price for now or add flat delivery
        notes: '',
        food_items: cartItems.map((item) => ({
          food_item_id: item.id,
          qty: item.qty,
          price: item.price,
        })),
      };

      await api.post('/food-orders', payload);
      Alert.alert('Berhasil', 'Pesanan berhasil dibuat!', [
        { text: 'OK', onPress: () => router.replace('/(tabs)/orders') }
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Gagal membuat pesanan');
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

  if (!store) {
    return (
      <SafeAreaView style={styles.center}>
        <Text>Toko tidak ditemukan.</Text>
      </SafeAreaView>
    );
  }

  const cartItemsCount = Object.values(cart).reduce((sum, item) => sum + item.qty, 0);
  const totalPrice = calculateTotal();

  return (
    <>
      <Stack.Screen options={{ 
        title: store.name, 
        headerStyle: { backgroundColor: GREEN }, 
        headerTintColor: '#fff',
      }} />
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <View style={styles.storeIcon}><Text style={{fontSize: 40}}>🍽️</Text></View>
            <Text style={styles.storeName}>{store.name}</Text>
            <Text style={styles.storeAddress}>{store.address}</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{store.is_open ? 'Buka' : 'Tutup'}</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Menu</Text>
          {foods.length === 0 ? (
            <Text style={styles.emptyText}>Belum ada menu di toko ini.</Text>
          ) : (
            foods.map((food) => {
              const qty = cart[food.id]?.qty || 0;
              return (
                <View key={food.id} style={styles.foodItem}>
                  <View style={styles.foodInfo}>
                    <Text style={styles.foodName}>{food.name}</Text>
                    {food.description && <Text style={styles.foodDesc} numberOfLines={2}>{food.description}</Text>}
                    <Text style={styles.foodPrice}>Rp {Number(food.price).toLocaleString('id-ID')}</Text>
                  </View>
                  {food.is_available ? (
                    <View style={styles.actionContainer}>
                      {qty > 0 ? (
                        <View style={styles.qtyControls}>
                          <Pressable style={styles.btnSm} onPress={() => updateCart(food, -1)}>
                            <Ionicons name="remove" size={18} color="#fff" />
                          </Pressable>
                          <Text style={styles.qtyText}>{qty}</Text>
                          <Pressable style={styles.btnSm} onPress={() => updateCart(food, 1)}>
                            <Ionicons name="add" size={18} color="#fff" />
                          </Pressable>
                        </View>
                      ) : (
                        <Pressable style={styles.btnAdd} onPress={() => updateCart(food, 1)}>
                          <Text style={styles.btnAddText}>Tambah</Text>
                        </Pressable>
                      )}
                    </View>
                  ) : (
                    <Text style={styles.unavailableText}>Habis</Text>
                  )}
                </View>
              );
            })
          )}
        </ScrollView>

        {cartItemsCount > 0 && (
          <View style={styles.bottomBar}>
            <View>
              <Text style={styles.cartInfo}>{cartItemsCount} item</Text>
              <Text style={styles.cartTotal}>Rp {totalPrice.toLocaleString('id-ID')}</Text>
            </View>
            <Pressable 
              style={[styles.btnOrder, isSubmitting && { opacity: 0.7 }]} 
              onPress={handleCreateOrder}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.btnOrderText}>Pesan Sekarang</Text>
              )}
            </Pressable>
          </View>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  scrollContent: { padding: 16, paddingBottom: 100 },
  header: { alignItems: 'center', backgroundColor: '#ffffff', padding: 20, borderRadius: 16, marginBottom: 20, elevation: 1 },
  storeIcon: { width: 80, height: 80, backgroundColor: '#E5E7EB', borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  storeName: { fontSize: 20, fontWeight: 'bold', color: '#111827', textAlign: 'center' },
  storeAddress: { fontSize: 13, color: '#6B7280', textAlign: 'center', marginTop: 4, marginBottom: 12 },
  badge: { backgroundColor: '#D1FAE5', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  badgeText: { color: DARK_GREEN, fontSize: 12, fontWeight: '600' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 16 },
  emptyText: { color: '#6B7280', fontStyle: 'italic' },
  foodItem: { flexDirection: 'row', backgroundColor: '#fff', padding: 16, borderRadius: 16, marginBottom: 12, elevation: 1, alignItems: 'center' },
  foodInfo: { flex: 1, paddingRight: 12 },
  foodName: { fontSize: 15, fontWeight: '600', color: '#1F2937' },
  foodDesc: { fontSize: 12, color: '#6B7280', marginTop: 4 },
  foodPrice: { fontSize: 14, fontWeight: 'bold', color: DARK_GREEN, marginTop: 8 },
  actionContainer: { width: 90, alignItems: 'center' },
  btnAdd: { backgroundColor: GREEN, paddingVertical: 6, paddingHorizontal: 16, borderRadius: 20 },
  btnAddText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  qtyControls: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 20, padding: 4 },
  btnSm: { backgroundColor: GREEN, width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  qtyText: { marginHorizontal: 10, fontSize: 14, fontWeight: 'bold', color: '#111827' },
  unavailableText: { color: '#EF4444', fontWeight: 'bold', fontSize: 13 },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#E5E7EB', elevation: 4 },
  cartInfo: { fontSize: 13, color: '#6B7280' },
  cartTotal: { fontSize: 18, fontWeight: 'bold', color: DARK_GREEN },
  btnOrder: { backgroundColor: GREEN, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 24, flexDirection: 'row', alignItems: 'center' },
  btnOrderText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
});
