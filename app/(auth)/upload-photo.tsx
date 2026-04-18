import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Pressable, Image,
  ActivityIndicator, Alert, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Camera, ImageIcon, CheckCircle2, ArrowRight, Sparkles } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../../lib/api';
import { useAuthStore } from '../../lib/authStore';

const GREEN = '#2ECC71';
const DARK_GREEN = '#27AE60';

export default function UploadPhotoScreen() {
  const router = useRouter();
  const { user, updateUser } = useAuthStore();
  const [photo, setPhoto] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const pickImage = async (fromCamera: boolean) => {
    const perm = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!perm.granted) {
      Alert.alert('Izin Diperlukan', 'Berikan izin akses untuk melanjutkan.');
      return;
    }

    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.8 })
      : await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.8, mediaTypes: ImagePicker.MediaTypeOptions.Images });

    if (!result.canceled && result.assets[0]) {
      setPhoto(result.assets[0].uri);
    }
  };

  const showPickerOptions = () => {
    Alert.alert('Pilih Foto', 'Ambil dari mana?', [
      { text: 'Kamera', onPress: () => pickImage(true) },
      { text: 'Galeri', onPress: () => pickImage(false) },
      { text: 'Batal', style: 'cancel' },
    ]);
  };

  const handleUpload = async () => {
    if (!photo) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('profile_picture', {
        uri: photo,
        type: 'image/jpeg',
        name: 'profile.jpg',
      } as any);
      formData.append('name', user?.name ?? '');
      formData.append('phone', user?.phone ?? '');

      const res = await api.put('/profile/update', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await updateUser(res.data?.data || { photo_url: photo });
      router.replace('/(tabs)/home');
    } catch (e: any) {
      Alert.alert('Gagal Upload', e.message || 'Coba lagi nanti');
    } finally {
      setUploading(false);
    }
  };

  const handleSkip = () => router.replace('/(tabs)/home');

  return (
    <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
      <LinearGradient colors={[GREEN, DARK_GREEN]} style={styles.topGradient}>
        <View style={styles.topContent}>
          <View style={styles.sparkleRow}>
            <Sparkles size={16} color="rgba(255,255,255,0.7)" />
            <Text style={styles.stepText}>Langkah Terakhir</Text>
            <Sparkles size={16} color="rgba(255,255,255,0.7)" />
          </View>
          <Text style={styles.title}>Foto Profil</Text>
          <Text style={styles.subtitle}>Biar teman-teman bisa mengenalmu lebih mudah</Text>
        </View>
      </LinearGradient>

      <View style={styles.body}>
        {/* Avatar Picker */}
        <Pressable style={styles.avatarWrap} onPress={showPickerOptions}>
          {photo ? (
            <Image source={{ uri: photo }} style={styles.avatarImg} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitial}>{user?.name?.charAt(0).toUpperCase() ?? '?'}</Text>
            </View>
          )}
          <View style={styles.cameraBtn}>
            <Camera size={18} color="#fff" />
          </View>
          {photo && (
            <View style={styles.checkBadge}>
              <CheckCircle2 size={22} color={GREEN} fill="#fff" />
            </View>
          )}
        </Pressable>

        <Text style={styles.tapHint}>Ketuk untuk memilih foto</Text>

        {/* Options */}
        <View style={styles.optionRow}>
          <Pressable style={styles.optionBtn} onPress={() => pickImage(false)}>
            <View style={[styles.optionIcon, { backgroundColor: '#EFF6FF' }]}>
              <ImageIcon size={22} color="#3B82F6" />
            </View>
            <Text style={styles.optionLabel}>Galeri</Text>
          </Pressable>
          <Pressable style={styles.optionBtn} onPress={() => pickImage(true)}>
            <View style={[styles.optionIcon, { backgroundColor: '#F0FDF4' }]}>
              <Camera size={22} color={GREEN} />
            </View>
            <Text style={styles.optionLabel}>Kamera</Text>
          </Pressable>
        </View>

        <View style={styles.actions}>
          {photo && (
            <Pressable
              style={[styles.uploadBtn, uploading && { opacity: 0.6 }]}
              onPress={handleUpload}
              disabled={uploading}
            >
              {uploading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <CheckCircle2 size={20} color="#fff" />
                  <Text style={styles.uploadBtnText}>Simpan & Lanjutkan</Text>
                </>
              )}
            </Pressable>
          )}

          <Pressable style={styles.skipBtn} onPress={handleSkip}>
            <Text style={styles.skipText}>Lewati untuk sekarang</Text>
            <ArrowRight size={16} color="#9CA3AF" />
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#F9FAFB' },

  topGradient: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 48 },
  topContent: { alignItems: 'center' },
  sparkleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  stepText: { color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: '600' },
  title: { color: '#fff', fontSize: 28, fontWeight: '800', marginBottom: 6 },
  subtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 14, textAlign: 'center' },

  body: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    marginTop: -36,
    backgroundColor: '#F9FAFB',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 32,
  },

  avatarWrap: { position: 'relative', marginBottom: 8 },
  avatarImg: {
    width: 120, height: 120, borderRadius: 60,
    borderWidth: 4, borderColor: '#fff',
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 12,
  },
  avatarPlaceholder: {
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: GREEN,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 4, borderColor: '#fff',
    shadowColor: GREEN, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8,
  },
  avatarInitial: { color: '#fff', fontSize: 48, fontWeight: '800' },
  cameraBtn: {
    position: 'absolute', bottom: 4, right: 4,
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: DARK_GREEN,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2.5, borderColor: '#fff',
    elevation: 4,
  },
  checkBadge: {
    position: 'absolute', top: 0, right: 0,
    backgroundColor: '#fff', borderRadius: 12,
  },

  tapHint: { color: '#9CA3AF', fontSize: 13, marginBottom: 28 },

  optionRow: { flexDirection: 'row', gap: 16, marginBottom: 32 },
  optionBtn: { alignItems: 'center', gap: 8 },
  optionIcon: {
    width: 60, height: 60, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    elevation: 2,
  },
  optionLabel: { fontSize: 13, fontWeight: '600', color: '#374151' },

  actions: { width: '100%', gap: 12 },
  uploadBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: GREEN, paddingVertical: 16, borderRadius: 16,
    elevation: 4, shadowColor: GREEN, shadowOpacity: 0.35, shadowRadius: 10,
  },
  uploadBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },

  skipBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 14,
  },
  skipText: { color: '#9CA3AF', fontSize: 14, fontWeight: '500' },
});
