import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ActivityIndicator, Pressable, Alert } from 'react-native';
import * as Location from 'expo-location';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import MapViewFree from '../components/MapViewFree';

export default function TestLocationScreen() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const getLocation = async () => {
    setLoading(true);
    let { status } = await Location.requestForegroundPermissionsAsync();
    
    if (status !== 'granted') {
      setErrorMsg('Izin akses lokasi ditolak');
      setLoading(false);
      return;
    }

    try {
      let currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setLocation(currentLocation);
      console.log('Location:', currentLocation.coords);
    } catch (err) {
      setErrorMsg('Gagal mengambil lokasi. Pastikan GPS aktif.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getLocation();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: 'Cek Lokasi GPS', headerTintColor: '#000' }} />
      
      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.title}>Posisi Koordinat Anda</Text>
          
          {loading ? (
            <ActivityIndicator size="large" color="#2ECC71" style={{ marginVertical: 20 }} />
          ) : location ? (
            <View style={styles.infoBox}>
              <View style={styles.row}>
                <Text style={styles.label}>Latitude:</Text>
                <Text style={styles.value}>{location.coords.latitude.toFixed(6)}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Longitude:</Text>
                <Text style={styles.value}>{location.coords.longitude.toFixed(6)}</Text>
              </View>
            </View>
          ) : (
            <Text style={styles.errorText}>{errorMsg || 'Mencari lokasi...'}</Text>
          )}

          <Pressable style={styles.btn} onPress={getLocation} disabled={loading}>
            <Ionicons name="refresh" size={18} color="#fff" />
            <Text style={styles.btnText}>Perbarui Lokasi</Text>
          </Pressable>
        </View>

        {location && (
          <View style={styles.mapWrap}>
            <Text style={styles.mapTitle}>Tampilan di OpenStreetMap</Text>
            <MapViewFree 
              latitude={location.coords.latitude} 
              longitude={location.coords.longitude} 
              title="Posisi Anda"
            />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  content: { padding: 20 },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 20, elevation: 2, alignItems: 'center' },
  title: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 16 },
  infoBox: { width: '100%', marginBottom: 20 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  label: { color: '#6B7280', fontSize: 14 },
  value: { fontWeight: 'bold', color: '#111827', fontSize: 14 },
  btn: { backgroundColor: '#2ECC71', flexDirection: 'row', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12, alignItems: 'center', gap: 8, marginTop: 10 },
  btnText: { color: '#fff', fontWeight: '700' },
  errorText: { color: '#EF4444', marginBottom: 20 },
  mapWrap: { marginTop: 30 },
  mapTitle: { fontSize: 16, fontWeight: '700', color: '#1F2937', marginBottom: 12 },
});
