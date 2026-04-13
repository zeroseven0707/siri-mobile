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
  return (
    <View style={styles.wrapper}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.inputRow, error ? styles.inputError : styles.inputNormal]}>
        <TextInput
          style={styles.input}
          placeholderTextColor="#9CA3AF"
          secureTextEntry={isPassword && !show}
          {...props}
        />
        {isPassword && (
          <Pressable onPress={() => setShow(!show)}>
            {show ? <EyeOff size={20} color="#9CA3AF" /> : <Eye size={20} color="#9CA3AF" />}
          </Pressable>
        )}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 4 },
  inputRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, backgroundColor: '#fff' },
  inputNormal: { borderColor: '#E5E7EB' },
  inputError: { borderColor: '#F87171' },
  input: { flex: 1, paddingVertical: 14, fontSize: 16, color: '#1F2937' },
  errorText: { color: '#EF4444', fontSize: 12, marginTop: 4 },
});
