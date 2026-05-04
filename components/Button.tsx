import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface Props {
  title: string;
  onPress: () => void;
  loading?: boolean;
  variant?: 'primary' | 'outline';
  disabled?: boolean;
  style?: ViewStyle;
}

export default function Button({ title, onPress, loading, variant = 'primary', disabled, style }: Props) {
  const isPrimary = variant === 'primary';
  
  const content = (
    <View style={styles.content}>
      {loading ? (
        <ActivityIndicator color={isPrimary ? '#fff' : '#2ECC71'} />
      ) : (
        <Text style={[styles.text, !isPrimary && styles.textOutline]}>{title}</Text>
      )}
    </View>
  );

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        !isPrimary && styles.outline,
        (disabled || loading) && styles.disabled,
        pressed && styles.pressed,
        style
      ]}
    >
      {isPrimary ? (
        <LinearGradient
          colors={['#2ECC71', '#27AE60']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradient}
        >
          {content}
        </LinearGradient>
      ) : (
        content
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#2ECC71',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  gradient: {
    width: '100%',
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    width: '100%',
  },
  outline: {
    borderWidth: 2,
    borderColor: '#2ECC71',
    backgroundColor: 'transparent',
    elevation: 0,
    shadowOpacity: 0,
  },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
  text: { fontWeight: '700', fontSize: 16, color: '#fff', letterSpacing: 0.3 },
  textOutline: { color: '#2ECC71' },
});
