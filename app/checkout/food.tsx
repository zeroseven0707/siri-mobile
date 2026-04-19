import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Alert, TextInput, Image } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, MapPin, ShoppingCart, CreditCard, Banknote, Globe, Tag, AlertTriangle, UtensilsCrossed, Loader } from 'lucide-react-native';
import api from '../../lib/api';
import { useAuthStore } from '../../lib/authStore';
import { Service } from '../../types';

const GREEN = '#2ECC71';
const DARK_GREEN = '#27AE60';

import CustomHeader from '../../components/CustomHeader';
import AuthPlaceholder from '../../components/AuthPlaceholder';

export default function FoodCheckoutScreen() {
  const { storeId, cartItems: cartItemsStr, storeName, storeAddress, storeLat, storeLng } = useLocalSearchParams<{
    storeId: string;
    cartItems: string;
    storeName: string;
    storeAddress: string;
    storeLat: string;
    storeLng: string;
  }>();

  const router = useRouter();
  const { user } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [voucherCode, setVoucherCode] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'xendit'>('cod');
  const [deliveryFee, setDeliveryFee] = useState(10000);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [durationMin, setDurationMin] = useState<number | null>(null);
  const [loadingFee, setLoadingFee] = useState(false);

  const cartItems = JSON.parse(cartItemsStr || '[]');
  const subtotal = cartItems.reduce((sum: number, item: any) => sum + (item.price * item.qty), 0);
  const serviceFee = 2000;
  const total = subtotal + deliveryFee + serviceFee;

  // Hitung ongkir saat komponen mount
  useEffect(() => {
    const fetchDeliveryFee = async () => {
      if (!storeLat || !storeLng || !user?.latitude || !user?.longitude) return;
      setLoadingFee(true);
      try {
        const res = await api.get('/delivery-fee', {
          params: {
            from_lat: storeLat,
            from_lng: storeLng,
            to_lat: user.latitude,
            to_lng: user.longitude,
          },
        });
        const data = res.data.data;
        setDeliveryFee(data.delivery_fee);
        setDistanceKm(data.distance_km);
        setDurationMin(data.duration_minutes);
      } catch {
        // Tetap pakai default 10.000
      } finally {
        setLoadingFee(false);
      }
    };
    fetchDeliveryFee();
  }, [storeLat, storeLng, user?.latitude, user?.longitude]);

  const handleConfirmOrder = async () => {
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
      const foodService = servicesRes.data.data.find((s: Service) => s.slug === 'food');
      if (!foodService) throw new Error('Layanan Food tidak ditemukan');

      const payload = {
        service_id: foodService.id,
        pickup_location: storeAddress || 'Lokasi Toko',
        destination_location: user?.address || 'Lokasi Anda',
        price: total,
        delivery_fee: deliveryFee,
        notes: `Pembayaran: ${paymentMethod.toUpperCase()} | Voucher: ${voucherCode || 'None'}`,
        food_items: cartItems.map((item: any) => ({
          food_item_id: item.id,
          qty: item.qty,
          price: item.price,
        })),
      };

      await api.post('/food-orders', payload);
      Alert.alert('Berhasil', 'Pesanan Anda sedang diproses oleh toko!', [
        { text: 'Lihat Pesanan', onPress: () => router.replace('/(tabs)/orders') }
      ]);
    } catch (err: any) {
      const data = err?.response?.data;
      const msg = data?.errors
        ? Object.values(data.errors).flat().join('\n')
        : data?.message || err.message || 'Terjadi kesalahan saat membuat pesanan';
      Alert.alert('Gagal Memesan', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
        <Stack.Screen options={{ headerShown: false }} />
        <AuthPlaceholder
          icon="ShoppingCart"
          title="Masuk untuk Checkout"
          description="Kamu perlu masuk terlebih dahulu untuk melanjutkan proses pemesanan."
        />
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <CustomHeader title="Konfirmasi Pesanan" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Informasi Pelanggan */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <User size={20} color={GREEN} />
            <Text style={styles.sectionTitle}>Detail Pengiriman</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.userName}>{user?.name}</Text>
            <Text style={styles.userPhone}>{user?.phone}</Text>
            <View style={styles.divider} />
            <View style={styles.addressRow}>
              <MapPin size={18} color="#EF4444" />
              <Text style={styles.addressText} numberOfLines={2}>
                {user?.address || 'Alamat belum diatur. Harap atur di profil.'}
              </Text>
            </View>
            {(!user?.latitude || !user?.longitude || !user?.address) && (
              <View style={styles.addressWarning}>
                <AlertTriangle size={14} color="#D97706" />
                <Text style={styles.addressWarningText}>Atur alamat dulu sebelum memesan</Text>
              </View>
            )}
            <Pressable onPress={() => router.push('/update-location')}>
              <Text style={styles.changeAddress}>Ubah Alamat</Text>
            </Pressable>
          </View>
        </View>

        {/* Ringkasan Pesanan */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <UtensilsCrossed size={20} color={GREEN} />
            <Text style={styles.sectionTitle}>Pesanan di {storeName}</Text>
          </View>
          <View style={styles.card}>
            {cartItems.map((item: any, i: number) => {
              const ItemView = View as any;
              return (
                <ItemView key={item.id} style={[styles.foodItem, i === cartItems.length - 1 && { borderBottomWidth: 0 }]}>
                  <View style={styles.foodInfo}>
                    <Text style={styles.foodQty}>{item.qty}x</Text>
                    <Text style={styles.foodName}>{item.name}</Text>
                  </View>
                  <Text style={styles.foodSubtotal}>Rp {(item.price * item.qty).toLocaleString('id-ID')}</Text>
                </ItemView>
              );
            })}
          </View>
        </View>

        {/* Metode Pembayaran */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <CreditCard size={20} color={GREEN} />
            <Text style={styles.sectionTitle}>Metode Pembayaran</Text>
          </View>
          <View style={styles.card}>
            <Pressable
              style={[styles.paymentItem, paymentMethod === 'cod' && styles.paymentActive]}
              onPress={() => setPaymentMethod('cod')}
            >
              <View style={styles.paymentLeft}>
                <Banknote size={24} color={paymentMethod === 'cod' ? GREEN : '#9CA3AF'} />
                <View>
                  <Text style={[styles.paymentTitle, paymentMethod === 'cod' && { color: DARK_GREEN }]}>COD (Bayar di Tempat)</Text>
                  <Text style={styles.paymentSub}>Bayar langsung ke driver saat sampai</Text>
                </View>
              </View>
              {paymentMethod === 'cod'
                ? <ShoppingCart size={20} color={GREEN} />
                : <ShoppingCart size={20} color="#D1D5DB" />}
            </Pressable>

            <View style={styles.divider} />

            <Pressable
              style={[styles.paymentItem, paymentMethod === 'xendit' && styles.paymentActive]}
              onPress={() => setPaymentMethod('xendit')}
            >
              <View style={styles.paymentLeft}>
                <Globe size={24} color={paymentMethod === 'xendit' ? GREEN : '#9CA3AF'} />
                <View>
                  <Text style={[styles.paymentTitle, paymentMethod === 'xendit' && { color: DARK_GREEN }]}>Transfer / E-Wallet</Text>
                  <Text style={styles.paymentSub}>OVO, Dana, LinkAja, VA Bank</Text>
                </View>
              </View>
              {paymentMethod === 'xendit'
                ? <ShoppingCart size={20} color={GREEN} />
                : <ShoppingCart size={20} color="#D1D5DB" />}
            </Pressable>
          </View>
        </View>

        {/* Voucher */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Tag size={20} color={GREEN} />
            <Text style={styles.sectionTitle}>Makin Hemat Pakai Voucher</Text>
          </View>
          <View style={styles.voucherBox}>
            <TextInput
              style={styles.voucherInput}
              placeholder="Masukkan kode voucher"
              value={voucherCode}
              onChangeText={setVoucherCode}
            />
            <Pressable style={styles.voucherBtn}>
              <Text style={styles.voucherBtnText}>Pakai</Text>
            </Pressable>
          </View>
        </View>

        {/* Ringkasan Pembayaran */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ringkasan Pembayaran</Text>
          <View style={styles.card}>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Harga Makanan</Text>
              <Text style={styles.priceVal}>Rp {subtotal.toLocaleString('id-ID')}</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Ongkos Kirim</Text>
              {loadingFee ? (
                <ActivityIndicator size="small" color={GREEN} />
              ) : (
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.priceVal}>Rp {deliveryFee.toLocaleString('id-ID')}</Text>
                  {distanceKm !== null && (
                    <Text style={{ fontSize: 11, color: '#9CA3AF' }}>
                      {distanceKm} km{durationMin ? ` · ~${Math.round(durationMin)} menit` : ''}
                    </Text>
                  )}
                </View>
              )}
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Biaya Layanan</Text>
              <Text style={styles.priceVal}>Rp {serviceFee.toLocaleString('id-ID')}</Text>
            </View>
            <View style={[styles.divider, { marginVertical: 12 }]} />
            <View style={styles.priceRow}>
              <Text style={styles.totalLabel}>Total Pembayaran</Text>
              <Text style={styles.totalVal}>Rp {total.toLocaleString('id-ID')}</Text>
            </View>
          </View>
        </View>

      </ScrollView>

      {/* Footer Button */}
      <View style={styles.footer}>
        <View>
          <Text style={styles.footerLabel}>Total Pembayaran</Text>
          <Text style={styles.footerPrice}>Rp {total.toLocaleString('id-ID')}</Text>
        </View>
        <Pressable
          style={[styles.btnConfirm, isSubmitting && { opacity: 0.7 }]}
          onPress={handleConfirmOrder}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnConfirmText}>Pesan Sekarang</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  scroll: { padding: 16, paddingBottom: 100 },
  section: { marginBottom: 20 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#1F2937' },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 },
  userName: { fontSize: 16, fontWeight: '700', color: '#111827' },
  userPhone: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 10 },
  addressRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  addressText: { flex: 1, fontSize: 13, color: '#374151', lineHeight: 20 },
  changeAddress: { color: GREEN, fontWeight: '700', fontSize: 13, marginTop: 10 },
  addressWarning: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FFFBEB', borderRadius: 8, padding: 8, marginTop: 8, borderWidth: 1, borderColor: '#FDE68A' },
  addressWarningText: { fontSize: 12, color: '#D97706', fontWeight: '600' },
  foodItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F9FAFB' },
  foodInfo: { flexDirection: 'row', gap: 10 },
  foodQty: { fontWeight: '700', color: GREEN },
  foodName: { color: '#374151', fontWeight: '500' },
  foodSubtotal: { fontWeight: '600', color: '#111827' },
  voucherBox: { flexDirection: 'row', gap: 10 },
  voucherInput: { flex: 1, backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, borderWidth: 1, borderColor: '#E5E7EB', fontSize: 14 },
  voucherBtn: { backgroundColor: DARK_GREEN, paddingHorizontal: 20, justifyContent: 'center', borderRadius: 12 },
  voucherBtnText: { color: '#fff', fontWeight: 'bold' },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  priceLabel: { color: '#6B7280', fontSize: 14 },
  priceVal: { color: '#111827', fontWeight: '500' },
  totalLabel: { fontSize: 15, fontWeight: '700', color: '#111827' },
  totalVal: { fontSize: 16, fontWeight: '800', color: DARK_GREEN },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#E5E7EB', elevation: 10 },
  footerLabel: { fontSize: 12, color: '#6B7280' },
  footerPrice: { fontSize: 18, fontWeight: '800', color: DARK_GREEN },
  btnConfirm: { backgroundColor: GREEN, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 24 },
  btnConfirmText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  paymentItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderRadius: 12, paddingHorizontal: 8 },
  paymentActive: { backgroundColor: '#F0FDF4' },
  paymentLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  paymentTitle: { fontSize: 14, fontWeight: '700', color: '#374151' },
  paymentSub: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
});
