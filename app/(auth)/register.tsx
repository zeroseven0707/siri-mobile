import React, { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../lib/authStore';

const GREEN = '#2ECC71';
const DARK_GREEN = '#27AE60';

const Field = ({ label, icon, ...props }: any) => (
  <View style={styles.fieldWrap}>
    <Text style={styles.label}>{label}</Text>
    <View style={styles.inputRow}>
      <Ionicons name={icon} size={18} color="#9CA3AF" style={styles.inputIcon} />
      <TextInput style={styles.input} placeholderTextColor="#9CA3AF" {...props} />
    </View>
  </View>
);

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuthStore();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', password_confirmation: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const set = (key: keyof typeof form) => (val: string) => setForm(f => ({ ...f, [key]: val }));

  const handleRegister = async () => {
    if (!form.name || !form.email || !form.phone || !form.password) { setError('Isi semua field'); return; }
    if (form.password !== form.password_confirmation) { setError('Password tidak cocok'); return; }
    setLoading(true); setError('');
    try { await register(form); }
    catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </Pressable>
          <View style={styles.owlCircle}>
            <Image source={require('../../assets/images/siri.png')} style={{ width: 100, height: 100 }} resizeMode="contain" />
          </View>
          <Text style={styles.appName}>Daftar Akun</Text>
          <Text style={styles.tagline}>Bergabung dengan Siri sekarang</Text>
        </View>

        <View style={styles.card}>
          {error ? <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View> : null}
          <Field label="Nama Lengkap" icon="person-outline" placeholder="Budi Santoso" value={form.name} onChangeText={set('name')} />
          <Field label="Email" icon="mail-outline" placeholder="email@contoh.com" value={form.email} onChangeText={set('email')} keyboardType="email-address" autoCapitalize="none" />
          <Field label="No. HP" icon="call-outline" placeholder="08123456789" value={form.phone} onChangeText={set('phone')} keyboardType="phone-pad" />
          <Field label="Password" icon="lock-closed-outline" placeholder="Min. 8 karakter" value={form.password} onChangeText={set('password')} secureTextEntry />
          <Field label="Konfirmasi Password" icon="lock-closed-outline" placeholder="Ulangi password" value={form.password_confirmation} onChangeText={set('password_confirmation')} secureTextEntry />

          <Pressable style={[styles.btn, loading && styles.btnDisabled]} onPress={handleRegister} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Daftar Sekarang</Text>}
          </Pressable>

          <View style={styles.row}>
            <Text style={styles.mutedText}>Sudah punya akun? </Text>
            <Pressable onPress={() => router.back()}><Text style={styles.link}>Masuk</Text></Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: GREEN },
  scroll: { flexGrow: 1 },
  header: { paddingHorizontal: 24, paddingTop: 56, paddingBottom: 32, alignItems: 'center' },
  backBtn: { position: 'absolute', top: 56, left: 24, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  owlCircle: { alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  owlEmoji: { fontSize: 38 },
  appName: { color: '#fff', fontSize: 26, fontWeight: '800' },
  tagline: { color: 'rgba(255,255,255,0.85)', fontSize: 13, marginTop: 4 },
  card: { backgroundColor: '#fff', borderTopLeftRadius: 32, borderTopRightRadius: 32, flex: 1, padding: 28, paddingTop: 28 },
  errorBox: { backgroundColor: '#FEF2F2', borderRadius: 10, padding: 12, marginBottom: 16 },
  errorText: { color: '#DC2626', fontSize: 13 },
  fieldWrap: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  inputRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 14, backgroundColor: '#F9FAFB' },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, paddingVertical: 13, fontSize: 15, color: '#1F2937' },
  btn: { backgroundColor: GREEN, borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginTop: 8, elevation: 4 },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  row: { flexDirection: 'row', justifyContent: 'center', marginTop: 20, marginBottom: 16 },
  mutedText: { color: '#6B7280', fontSize: 14 },
  link: { color: DARK_GREEN, fontWeight: '700', fontSize: 14 },
});
