import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, Pressable,
  Alert, ActivityIndicator, Image, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Camera, Mail, Phone, User, ImageIcon } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../lib/authStore';
import api from '../lib/api';
import { storageUrl } from '../lib/storage';

const GREEN = '#2ECC71';
const DARK_GREEN = '#27AE60';

export default function EditProfileScreen() {
  const { user, updateUser } = useAuthStore();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [photo, setPhoto] = useState<string | null>(user?.photo_url ?? null);
  const [form, setForm] = useState({ name: user?.name ?? '', phone: user?.phone ?? '' });
  const set = (key: keyof typeof form) => (val: string) => setForm(f => ({ ...f, [key]: val }));

  const pickImage = async (fromCamera: boolean) => {
    const perm = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { Alert.alert('Izin Diperlukan', 'Berikan izin akses untuk melanjutkan.'); return; }

    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.8 })
      : await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.8, mediaTypes: 'images' });

    if (!result.canceled && result.assets[0]) setPhoto(result.assets[0].uri);
  };

  const showPickerOptions = () => {
    Alert.alert('Ganti Foto', 'Pilih sumber foto', [
      { text: 'Kamera', onPress: () => pickImage(true) },
      { text: 'Galeri', onPress: () => pickImage(false) },
      { text: 'Batal', style: 'cancel' },
    ]);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('_method', 'PUT');
      formData.append('name', form.name);
      formData.append('phone', form.phone);
      if (photo && photo !== user?.photo_url) {
        formData.append('profile_picture', { uri: photo, type: 'image/jpeg', name: 'profile.jpg' } as any);
      }
      const res = await api.post('/profile/update', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const userData = res.data?.data;
      await updateUser({
        name: userData?.name ?? form.name,
        phone: userData?.phone ?? form.phone,
        photo_url: userData?.profile_picture ?? photo,
      });
      Alert.alert('Berhasil', 'Profil telah diperbarui', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (e: any) {
      Alert.alert('Gagal', e.message);
    } finally {
      setLoading(false);
    }
  };

  const isPhotoNew = photo && photo !== user?.photo_url;

  return (
    <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={22} color="#1F2937" />
        </Pressable>
        <Text style={styles.headerTitle}>Edit Profil</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Avatar Section */}
        <LinearGradient colors={[GREEN + '18', GREEN + '05']} style={styles.avatarSection}>
          <Pressable style={styles.avatarWrap} onPress={showPickerOptions}>
            {photo ? (
              <Image source={{ uri: storageUrl(photo) ?? photo }} style={styles.avatarImg} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitial}>{user?.name?.charAt(0).toUpperCase() ?? '?'}</Text>
              </View>
            )}
            <View style={styles.cameraBtn}>
              <Camera size={16} color="#fff" />
            </View>
          </Pressable>

          <Text style={styles.avatarName}>{user?.name}</Text>
          <Text style={styles.avatarEmail}>{user?.email}</Text>

          <View style={styles.photoOptions}>
            <Pressable style={styles.photoOptBtn} onPress={() => pickImage(false)}>
              <ImageIcon size={15} color={GREEN} />
              <Text style={styles.photoOptText}>Galeri</Text>
            </Pressable>
            <View style={styles.photoOptDivider} />
            <Pressable style={styles.photoOptBtn} onPress={() => pickImage(true)}>
              <Camera size={15} color={GREEN} />
              <Text style={styles.photoOptText}>Kamera</Text>
            </Pressable>
          </View>

          {isPhotoNew && (
            <View style={styles.newPhotoBadge}>
              <Text style={styles.newPhotoText}>✓ Foto baru dipilih</Text>
            </View>
          )}
        </LinearGradient>

        {/* Form Fields */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informasi Pribadi</Text>

          <View style={styles.card}>
            <View style={styles.fieldWrap}>
              <Text style={styles.label}>Nama Lengkap</Text>
              <View style={styles.inputRow}>
                <User size={17} color={GREEN} style={{ marginRight: 10 }} />
                <TextInput
                  style={styles.input}
                  value={form.name}
                  onChangeText={set('name')}
                  placeholder="Masukkan nama lengkap"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

            <View style={[styles.fieldWrap, styles.fieldBorder]}>
              <Text style={styles.label}>Nomor WhatsApp</Text>
              <View style={styles.inputRow}>
                <Phone size={17} color={GREEN} style={{ marginRight: 10 }} />
                <TextInput
                  style={styles.input}
                  value={form.phone}
                  onChangeText={set('phone')}
                  placeholder="Masukkan nomor WhatsApp"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="phone-pad"
                />
              </View>
            </View>
          </View>
        </View>

        {/* Email read-only */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Akun</Text>
          <View style={styles.card}>
            <View style={styles.fieldWrap}>
              <Text style={styles.label}>Email</Text>
              <View style={styles.inputRow}>
                <Mail size={17} color="#9CA3AF" style={{ marginRight: 10 }} />
                <Text style={styles.readOnly}>{user?.email}</Text>
                <View style={styles.lockedBadge}><Text style={styles.lockedText}>Terkunci</Text></View>
              </View>
            </View>
          </View>
        </View>

        <Pressable
          style={[styles.saveBtn, loading && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.saveTxt}>Simpan Perubahan</Text>}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#F3F4F6' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  backBtn: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#1F2937' },

  scroll: { paddingBottom: 40 },

  avatarSection: {
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 24,
    marginBottom: 8,
  },
  avatarWrap: { position: 'relative', marginBottom: 12 },
  avatarImg: {
    width: 100, height: 100, borderRadius: 50,
    borderWidth: 3, borderColor: '#fff',
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 10, elevation: 6,
  },
  avatarPlaceholder: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: GREEN,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: '#fff',
    elevation: 6,
  },
  avatarInitial: { color: '#fff', fontSize: 40, fontWeight: '800' },
  cameraBtn: {
    position: 'absolute', bottom: 2, right: 2,
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: DARK_GREEN,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#fff', elevation: 4,
  },
  avatarName: { fontSize: 18, fontWeight: '700', color: '#1F2937', marginBottom: 2 },
  avatarEmail: { fontSize: 13, color: '#6B7280', marginBottom: 14 },

  photoOptions: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 12,
    paddingHorizontal: 4, paddingVertical: 2,
    elevation: 2,
  },
  photoOptBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 8 },
  photoOptText: { color: GREEN, fontWeight: '600', fontSize: 13 },
  photoOptDivider: { width: 1, height: 20, backgroundColor: '#E5E7EB' },

  newPhotoBadge: {
    marginTop: 10, backgroundColor: '#DCFCE7',
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20,
  },
  newPhotoText: { color: DARK_GREEN, fontSize: 12, fontWeight: '600' },

  section: { paddingHorizontal: 16, marginBottom: 4 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8, marginLeft: 4 },

  card: { backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 16, elevation: 1 },
  fieldWrap: { paddingVertical: 14 },
  fieldBorder: { borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  label: { fontSize: 11, color: '#9CA3AF', fontWeight: '600', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  inputRow: { flexDirection: 'row', alignItems: 'center' },
  input: { flex: 1, fontSize: 15, color: '#1F2937', paddingVertical: 2 },
  readOnly: { flex: 1, fontSize: 15, color: '#9CA3AF' },
  lockedBadge: { backgroundColor: '#F3F4F6', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  lockedText: { fontSize: 11, color: '#9CA3AF', fontWeight: '600' },

  saveBtn: {
    marginHorizontal: 16, marginTop: 20,
    backgroundColor: GREEN, paddingVertical: 15, borderRadius: 14,
    alignItems: 'center', elevation: 4,
    shadowColor: GREEN, shadowOpacity: 0.3, shadowRadius: 8,
  },
  saveTxt: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
