import React, { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View, Image, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Mail, RefreshCcw, LogOut, CheckCircle } from 'lucide-react-native';
import { useAuthStore } from '../../lib/authStore';

export default function VerifyEmailScreen() {
  const router = useRouter();
  const { user, resendVerification, refreshUser, logout } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const handleResend = async () => {
    setResending(true);
    try {
      await resendVerification();
      Alert.alert('Berhasil', 'Link verifikasi baru telah dikirim ke email Anda.');
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.message || 'Gagal mengirim ulang link verifikasi.');
    } finally {
      setResending(false);
    }
  };

  const handleCheckStatus = async () => {
    setLoading(true);
    try {
      await refreshUser();
      // useAuthStore akan mengupdate state user, 
      // kita perlu mengecek apakah user sudah terverifikasi setelah refresh
    } catch (e: any) {
      Alert.alert('Error', 'Gagal mengecek status verifikasi.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  // Jika user tiba-tiba terverifikasi (dari refreshUser), kita arahkan ke home
  // Tapi biasanya layout parent yang menangani navigasi berdasarkan status auth
  // Namun untuk keamanan tambahan:
  React.useEffect(() => {
    if (user?.is_verified) {
      router.replace('/(tabs)');
    }
  }, [user?.is_verified]);

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <Mail size={60} color="#fff" />
          </View>
          <Text style={styles.appName}>Verifikasi Email</Text>
          <Text style={styles.tagline}>Satu langkah lagi untuk memulai</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Cek Email Anda</Text>
          <Text style={styles.subtitle}>
            Kami telah mengirimkan link verifikasi ke <Text style={styles.emailText}>{user?.email}</Text>. 
            Silakan klik link tersebut untuk mengaktifkan akun Anda.
          </Text>

          <View style={styles.btnRow}>
            <Pressable style={[styles.btn, loading && styles.btnDisabled]} onPress={handleCheckStatus} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : (
                <View style={styles.btnContent}>
                  <CheckCircle size={20} color="#fff" style={styles.btnIcon} />
                  <Text style={styles.btnText}>Saya Sudah Verifikasi</Text>
                </View>
              )}
            </Pressable>
          </View>

          <Pressable style={styles.resendBtn} onPress={handleResend} disabled={resending}>
            {resending ? <ActivityIndicator color={GREEN} /> : (
              <View style={styles.btnContent}>
                <RefreshCcw size={16} color={GREEN} style={styles.btnIcon} />
                <Text style={styles.resendText}>Kirim Ulang Link</Text>
              </View>
            )}
          </Pressable>

          <View style={styles.divider} />

          <Pressable style={styles.logoutBtn} onPress={handleLogout}>
            <LogOut size={18} color="#6B7280" style={styles.btnIcon} />
            <Text style={styles.logoutText}>Keluar / Masuk dengan akun lain</Text>
          </Pressable>
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
  iconCircle: { width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  appName: { color: '#fff', fontSize: 28, fontWeight: '800', letterSpacing: 1 },
  tagline: { color: 'rgba(255,255,255,0.85)', fontSize: 15, marginTop: 4 },
  card: { backgroundColor: '#fff', borderTopLeftRadius: 32, borderTopRightRadius: 32, flex: 1, padding: 28, paddingTop: 40 },
  title: { fontSize: 24, fontWeight: '700', color: '#1F2937', marginBottom: 12, textAlign: 'center' },
  subtitle: { color: '#6B7280', marginBottom: 32, fontSize: 15, textAlign: 'center', lineHeight: 22 },
  emailText: { fontWeight: '700', color: '#1F2937' },
  btnRow: { marginTop: 8 },
  btn: { backgroundColor: GREEN, borderRadius: 14, paddingVertical: 16, alignItems: 'center', shadowColor: GREEN, shadowOpacity: 0.4, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  btnContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  btnIcon: { marginRight: 8 },
  resendBtn: { marginTop: 24, paddingVertical: 12, alignItems: 'center' },
  resendText: { color: GREEN, fontWeight: '700', fontSize: 15 },
  divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 32 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  logoutText: { color: '#6B7280', fontSize: 14, fontWeight: '500' },
});
