import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

interface Props {
  title: string;
  onPress: () => void;
  loading?: boolean;
  variant?: 'primary' | 'outline';
  disabled?: boolean;
}

export default function Button({ title, onPress, loading, variant = 'primary', disabled }: Props) {
  const isPrimary = variant === 'primary';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={[styles.base, isPrimary ? styles.primary : styles.outline, (disabled || loading) && styles.disabled]}
    >
      {loading
        ? <ActivityIndicator color={isPrimary ? '#fff' : '#6C63FF'} />
        : <Text style={[styles.text, !isPrimary && styles.textOutline]}>{title}</Text>
      }
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: 16, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  primary: { backgroundColor: '#6C63FF' },
  outline: { borderWidth: 2, borderColor: '#6C63FF', backgroundColor: 'transparent' },
  disabled: { opacity: 0.5 },
  text: { fontWeight: '600', fontSize: 16, color: '#fff' },
  textOutline: { color: '#6C63FF' },
});
