import React, { useState, useEffect } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, Image, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { User, Lock, Eye, EyeOff, Fingerprint } from 'lucide-react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { useAuthStore } from '../../lib/authStore';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Cek Biometrik saat halaman dibuka
  useEffect(() => {
    checkBiometric();
  }, []);

  const checkBiometric = async () => {
    const isEnabled = await SecureStore.getItemAsync('biometric_enabled');
    if (isEnabled === 'true') {
      handleBiometricLogin();
    }
  };

  const handleBiometricLogin = async () => {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Masuk ke Siri',
      fallbackLabel: 'Gunakan Password',
    });

    if (result.success) {
      const savedEmail = await SecureStore.getItemAsync('user_email');
      const savedPass = await SecureStore.getItemAsync('user_pass');

      if (savedEmail && savedPass) {
        setLoading(true);
        try {
          await login(savedEmail, savedPass);
        } catch (e: any) {
          setError('Gagal login otomatis. Silakan masuk manual.');
        } finally {
          setLoading(false);
        }
      } else {
        Alert.alert('Info', 'Data login belum tersimpan. Silakan login manual sekali dulu.');
      }
    }
  };

  const handleLogin = async () => {
    if (!identifier || !password) { setError('Isi semua field'); return; }
    setLoading(true); setError('');
    try { 
      await login(identifier, password); 
      // Simpan kredensial untuk biometrik kedepannya
      await SecureStore.setItemAsync('user_email', identifier);
      await SecureStore.setItemAsync('user_pass', password);
    }
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
            <View style={styles.inputIcon}><User size={18} color="#9CA3AF" /></View>
            <TextInput style={styles.input} placeholder="email@contoh.com" placeholderTextColor="#9CA3AF"
              value={identifier} onChangeText={setIdentifier} keyboardType="email-address" autoCapitalize="none" />
          </View>

          <Text style={styles.label}>Password</Text>
          <View style={styles.inputRow}>
            <View style={styles.inputIcon}><Lock size={18} color="#9CA3AF" /></View>
            <TextInput style={styles.input} placeholder="••••••••" placeholderTextColor="#9CA3AF"
              value={password} onChangeText={setPassword} secureTextEntry={!showPass} />
            <Pressable onPress={() => setShowPass(!showPass)}>
              {showPass ? <EyeOff size={18} color="#9CA3AF" /> : <Eye size={18} color="#9CA3AF" />}
            </Pressable>
          </View>

          <View style={styles.btnRow}>
            <Pressable style={[styles.btn, { flex: 1 }, loading && styles.btnDisabled]} onPress={handleLogin} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Masuk</Text>}
            </Pressable>
            
            <Pressable style={styles.bioBtn} onPress={handleBiometricLogin}>
              <Fingerprint size={28} color={GREEN} />
            </Pressable>
          </View>

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
  btn: { backgroundColor: GREEN, borderRadius: 14, paddingVertical: 15, alignItems: 'center', shadowColor: GREEN, shadowOpacity: 0.4, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  btnRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 },
  bioBtn: { width: 54, height: 54, borderRadius: 14, borderWidth: 1.5, borderColor: GREEN, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  row: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  mutedText: { color: '#6B7280', fontSize: 14 },
  link: { color: DARK_GREEN, fontWeight: '700', fontSize: 14 },
});
