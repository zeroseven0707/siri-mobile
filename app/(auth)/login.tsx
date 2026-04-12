import React, { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../lib/authStore';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!identifier || !password) { setError('Isi semua field'); return; }
    setLoading(true); setError('');
    try { await login(identifier, password); }
    catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Header green */}
        <View style={styles.header}>
          <View style={styles.owlCircle}>
            <Image source={require('../../assets/images/siri.png')} style={{ width: 120, height: 120 }} resizeMode="contain" />
          </View>
          <Text style={styles.appName}>Siri</Text>
          <Text style={styles.tagline}>Mudah, Cepat, Nyaman</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Masuk</Text>
          <Text style={styles.subtitle}>Selamat datang kembali!</Text>

          {error ? <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View> : null}

          <Text style={styles.label}>Email atau No. HP</Text>
          <View style={styles.inputRow}>
            <Ionicons name="person-outline" size={18} color="#9CA3AF" style={styles.inputIcon} />
            <TextInput style={styles.input} placeholder="email@contoh.com" placeholderTextColor="#9CA3AF"
              value={identifier} onChangeText={setIdentifier} keyboardType="email-address" autoCapitalize="none" />
          </View>

          <Text style={styles.label}>Password</Text>
          <View style={styles.inputRow}>
            <Ionicons name="lock-closed-outline" size={18} color="#9CA3AF" style={styles.inputIcon} />
            <TextInput style={styles.input} placeholder="••••••••" placeholderTextColor="#9CA3AF"
              value={password} onChangeText={setPassword} secureTextEntry={!showPass} />
            <Pressable onPress={() => setShowPass(!showPass)}>
              <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={18} color="#9CA3AF" />
            </Pressable>
          </View>

          <Pressable style={[styles.btn, loading && styles.btnDisabled]} onPress={handleLogin} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Masuk</Text>}
          </Pressable>

          <View style={styles.row}>
            <Text style={styles.mutedText}>Belum punya akun? </Text>
            <Pressable onPress={() => router.push('/(auth)/register')}>
              <Text style={styles.link}>Daftar Sekarang</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const GREEN = '#2ECC71';
const DARK_GREEN = '#27AE60';

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: GREEN },
  scroll: { flexGrow: 1 },
  header: { alignItems: 'center', paddingTop: 80, paddingBottom: 40 },
  owlCircle: { alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  owlEmoji: { fontSize: 48 },
  appName: { color: '#fff', fontSize: 36, fontWeight: '800', letterSpacing: 1 },
  tagline: { color: 'rgba(255,255,255,0.85)', fontSize: 15, marginTop: 4 },
  card: { backgroundColor: '#fff', borderTopLeftRadius: 32, borderTopRightRadius: 32, flex: 1, padding: 28, paddingTop: 32 },
  title: { fontSize: 24, fontWeight: '700', color: '#1F2937', marginBottom: 4 },
  subtitle: { color: '#6B7280', marginBottom: 24, fontSize: 14 },
  errorBox: { backgroundColor: '#FEF2F2', borderRadius: 10, padding: 12, marginBottom: 16 },
  errorText: { color: '#DC2626', fontSize: 13 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  inputRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 14, marginBottom: 16, backgroundColor: '#F9FAFB' },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, paddingVertical: 13, fontSize: 15, color: '#1F2937' },
  btn: { backgroundColor: GREEN, borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginTop: 8, shadowColor: GREEN, shadowOpacity: 0.4, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  row: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  mutedText: { color: '#6B7280', fontSize: 14 },
  link: { color: DARK_GREEN, fontWeight: '700', fontSize: 14 },
});
