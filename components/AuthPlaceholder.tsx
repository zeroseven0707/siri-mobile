import React from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { useRouter } from 'expo-router';
import * as LucideIcons from 'lucide-react-native';

const GREEN = '#2ECC71';

interface AuthPlaceholderProps {
  title: string;
  description: string;
  icon: keyof typeof LucideIcons;
}

export default function AuthPlaceholder({ title, description, icon }: AuthPlaceholderProps) {
  const router = useRouter();
  const IconComp = (LucideIcons[icon] as any) || LucideIcons.Info;

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <IconComp size={60} color={GREEN} />
        </View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
        
        <Pressable 
          style={styles.loginBtn}
          onPress={() => router.push('/(auth)/login')}
        >
          <Text style={styles.loginBtnText}>Masuk Sekarang</Text>
        </Pressable>

        <Pressable 
          style={styles.registerBtn}
          onPress={() => router.push('/(auth)/register')}
        >
          <Text style={styles.registerBtnText}>Daftar Akun Baru</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', padding: 32 },
  content: { alignItems: 'center', width: '100%' },
  iconCircle: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#F0FDF4', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  title: { fontSize: 22, fontWeight: '800', color: '#1F2937', marginBottom: 12, textAlign: 'center' },
  description: { fontSize: 15, color: '#6B7280', textAlign: 'center', marginBottom: 40, lineHeight: 22 },
  loginBtn: { backgroundColor: GREEN, width: '100%', paddingVertical: 16, borderRadius: 16, alignItems: 'center', shadowColor: GREEN, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
  loginBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  registerBtn: { marginTop: 16, padding: 12 },
  registerBtnText: { color: GREEN, fontWeight: '700', fontSize: 14 },
});
