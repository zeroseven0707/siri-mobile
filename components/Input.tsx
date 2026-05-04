import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';

interface Props extends TextInputProps {
  label?: string;
  error?: string;
  isPassword?: boolean;
}

export default function Input({ label, error, isPassword, ...props }: Props) {
  const [show, setShow] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.wrapper}>
      {label && <Text style={[styles.label, isFocused && styles.labelFocused]}>{label}</Text>}
      <View style={[
        styles.inputRow, 
        error ? styles.inputError : (isFocused ? styles.inputFocused : styles.inputNormal)
      ]}>
        <TextInput
          style={styles.input}
          placeholderTextColor="#9CA3AF"
          secureTextEntry={isPassword && !show}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
        {isPassword && (
          <Pressable onPress={() => setShow(!show)} style={styles.eyeIcon}>
            {show ? <EyeOff size={20} color={isFocused ? '#2ECC71' : '#9CA3AF'} /> : <Eye size={20} color={isFocused ? '#2ECC71' : '#9CA3AF'} />}
          </Pressable>
        )}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 18 },
  label: { fontSize: 13, fontWeight: '700', color: '#4B5563', marginBottom: 6, marginLeft: 4 },
  labelFocused: { color: '#2ECC71' },
  inputRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    borderWidth: 1.5, 
    borderRadius: 16, 
    paddingHorizontal: 16, 
    backgroundColor: '#fff',
    minHeight: 56,
  },
  inputNormal: { borderColor: '#E5E7EB' },
  inputFocused: { borderColor: '#2ECC71', backgroundColor: '#F0FDF4' },
  inputError: { borderColor: '#F87171', backgroundColor: '#FEF2F2' },
  input: { flex: 1, paddingVertical: 12, fontSize: 15, color: '#1F2937', fontWeight: '500' },
  eyeIcon: { padding: 4 },
  errorText: { color: '#EF4444', fontSize: 12, marginTop: 6, marginLeft: 4, fontWeight: '600' },
});
