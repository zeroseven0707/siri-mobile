import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../../lib/api';
import { Service } from '../../types';

const GREEN = '#2ECC71';

export default function ServiceOrderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  
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
      } catch (err) {
        Alert.alert('Error', 'Gagal memuat layanan');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchService();
  }, [id]);

  const handleOrder = async () => {
    if (!pickup.trim() || !destination.trim()) {
      Alert.alert('Peringatan', 'Lokasi jemput dan tujuan harus diisi');
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

  if (!service) {
    return (
      <SafeAreaView style={styles.center}>
        <Text>Layanan tidak ditemukan.</Text>
      </SafeAreaView>
    );
  }

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
  container: { flex: 1, backgroundColor: '#F9FAFB' },
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
