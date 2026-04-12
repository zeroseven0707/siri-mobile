import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ActivityIndicator, Pressable, Alert, TextInput, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import * as Location from 'expo-location';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import MapViewFree from '../components/MapViewFree';
import api from '../lib/api';
import { useAuthStore } from '../lib/authStore';

export default function UpdateLocationScreen() {
  const { user, updateUser } = useAuthStore();
  const [address, setAddress] = useState(user?.address || '');
  const [coords, setCoords] = useState<{ lat: number, lng: number } | null>(
    user?.latitude != null && user?.longitude != null 
      ? { lat: Number(user.latitude), lng: Number(user.longitude) } 
      : null
  );
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const getLocation = async () => {
    setLoading(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Izin Ditolak', 'Harap izinkan akses lokasi di pengaturan HP agar kami bisa mengambil titik GPS Anda.');
        return;
      }

      let currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      
      setCoords({
        lat: currentLocation.coords.latitude,
        lng: currentLocation.coords.longitude
      });
    } catch (err) {
      Alert.alert('Error', 'Gagal mengambil lokasi GPS. Pastikan GPS Anda aktif.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Ambil lokasi otomatis hanya jika user belum punya koordinat tersimpan
    if (!coords) {
      getLocation();
    }
  }, []);

  const handleSave = async () => {
    if (!address.trim()) {
      return Alert.alert('Perhatian', 'Harap isi alamat lengkap Anda.');
    }
    if (!coords) {
      return Alert.alert('Perhatian', 'Harap ambil lokasi GPS Anda terlebih dahulu.');
    }

    setSaving(true);
    try {
      const payload = {
        address: address,
        latitude: coords.lat,
        longitude: coords.lng
      };
      
      const res = await api.put('/profile/update', payload);
      await updateUser(res.data.data);
      
      Alert.alert('Berhasil', 'Alamat dan lokasi Anda telah diperbarui.', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (err: any) {
      Alert.alert('Gagal Simpan', err.message || 'Terjadi kesalahan saat menyimpan data.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: 'Atur Alamat & Lokasi', headerTintColor: '#000' }} />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scroll}>
          
          <View style={styles.card}>
            <Text style={styles.label}>Titik Lokasi (Maps)</Text>
            
            {coords && coords.lat != null && coords.lng != null ? (
              <View style={styles.mapWrap}>
                <MapViewFree 
                  latitude={coords.lat} 
                  longitude={coords.lng} 
                  title="Lokasi Penjemputan"
                />
                <View style={styles.coordBadge}>
                    <Text style={styles.coordText}>{coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}</Text>
                </View>
              </View>
            ) : (
              <View style={styles.emptyMap}>
                <Ionicons name="map-outline" size={40} color="#9CA3AF" />
                <Text style={styles.emptyText}>Lokasi GPS belum terdeteksi</Text>
              </View>
            )}

            <Pressable 
              style={[styles.btnLocation, loading && { opacity: 0.7 }]} 
              onPress={getLocation} 
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#2ECC71" /> : (
                <>
                  <Ionicons name="locate" size={18} color="#2ECC71" />
                  <Text style={styles.btnLocationText}>Gunakan Lokasi Saat Ini</Text>
                </>
              )}
            </Pressable>
          </View>

          <View style={[styles.card, { marginTop: 16 }]}>
            <Text style={styles.label}>Alamat Lengkap (Patokan/No. Rumah)</Text>
            <TextInput
              style={styles.textArea}
              multiline
              numberOfLines={4}
              placeholder="Contoh: Jl. Merdeka No. 12, Pagar warna hijau, samping Indomaret"
              value={address}
              onChangeText={setAddress}
              textAlignVertical="top"
            />
            
            <Text style={styles.hint}>
              Pastikan alamat lengkap Anda mudah ditemukan oleh kurir/driver.
            </Text>
          </View>

          <Pressable 
            style={[styles.btnSave, saving && { opacity: 0.7 }]} 
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? <ActivityIndicator color="#fff" /> : (
              <>
                <Ionicons name="save-outline" size={20} color="#fff" />
                <Text style={styles.btnSaveText}>Simpan Lokasi & Alamat</Text>
              </>
            )}
          </Pressable>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  scroll: { padding: 16 },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 16, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
  label: { fontSize: 14, fontWeight: '700', color: '#374151', marginBottom: 12 },
  mapWrap: { height: 250, borderRadius: 16, overflow: 'hidden', position: 'relative' },
  coordBadge: { position: 'absolute', bottom: 10, right: 10, backgroundColor: 'rgba(255,255,255,0.9)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB' },
  coordText: { fontSize: 10, color: '#6B7280', fontWeight: 'bold' },
  emptyMap: { height: 200, backgroundColor: '#F3F4F6', borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderStyle: 'dashed', borderWidth: 1, borderColor: '#D1D5DB' },
  emptyText: { color: '#9CA3AF', fontSize: 14, marginTop: 8 },
  btnLocation: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14, marginTop: 16, borderRadius: 12, borderWidth: 1.5, borderColor: '#2ECC71' },
  btnLocationText: { color: '#2ECC71', fontWeight: '700', fontSize: 14 },
  textArea: { backgroundColor: '#F9FAFB', borderRadius: 12, padding: 12, fontSize: 14, color: '#1F2937', minHeight: 100, borderWidth: 1, borderColor: '#E5E7EB' },
  hint: { fontSize: 12, color: '#9CA3AF', marginTop: 8, fontStyle: 'italic' },
  btnSave: { backgroundColor: '#2ECC71', flexDirection: 'row', padding: 16, borderRadius: 16, alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 24, elevation: 4, shadowColor: '#2ECC71', shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
  btnSaveText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
