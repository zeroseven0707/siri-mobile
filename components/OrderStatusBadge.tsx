import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Order } from '../types';

const STATUS: Record<Order['status'], { label: string; bg: string; color: string }> = {
  pending:     { label: 'Menunggu',   bg: '#FEF9C3', color: '#A16207' },
  accepted:    { label: 'Diterima',   bg: '#DBEAFE', color: '#1D4ED8' },
  on_progress: { label: 'Diproses',   bg: '#EDE9FE', color: '#6D28D9' },
  completed:   { label: 'Selesai',    bg: '#DCFCE7', color: '#15803D' },
  cancelled:   { label: 'Dibatalkan', bg: '#FEE2E2', color: '#B91C1C' },
};

export default function OrderStatusBadge({ status }: { status: Order['status'] }) {
  const cfg = STATUS[status];
  return (
    <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
      <Text style={[styles.text, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  text: { fontSize: 12, fontWeight: '600' },
});
