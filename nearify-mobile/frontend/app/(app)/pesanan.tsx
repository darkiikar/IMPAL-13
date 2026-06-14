import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, FlatList, RefreshControl, ActivityIndicator } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, spacing, radius, shadow, formatIDR } from '@/src/theme';
import { apiFetch } from '@/src/api';

export default function Pesanan() {
  const [food, setFood] = useState<any[]>([]);
  const [laundry, setLaundry] = useState<any[]>([]);
  const [busy, setBusy] = useState(true);

  const load = useCallback(async () => {
    setBusy(true);
    try {
      const [f, l] = await Promise.all([
        apiFetch('/food-orders').catch(() => []),
        apiFetch('/laundry-orders').catch(() => []),
      ]);
      setFood(f || []); setLaundry(l || []);
    } finally { setBusy(false); }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surface }} edges={['top']}>
      <View style={styles.header}><Text style={styles.title}>Pesanan Saya</Text></View>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 100 }} refreshControl={<RefreshControl refreshing={busy} onRefresh={load} />}>
        <Text style={styles.section}>Pesanan Makanan</Text>
        {food.length === 0 ? <Text style={styles.empty}>Belum ada pesanan makanan</Text> : food.map(o => (
          <View key={o.id} style={styles.card} testID={`food-order-${o.id}`}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={styles.cardTitle}>{o.restaurant_name}</Text>
              <View style={[styles.badge, { backgroundColor: colors.brandLight }]}><Text style={[styles.badgeText, { color: colors.brandDark }]}>{o.status}</Text></View>
            </View>
            <Text style={styles.muted}>{o.items.length} item · {formatIDR(o.total)}</Text>
            <Text style={styles.muted}>📍 {o.delivery_address}</Text>
          </View>
        ))}

        <Text style={[styles.section, { marginTop: spacing.lg }]}>Pesanan Laundry</Text>
        {laundry.length === 0 ? <Text style={styles.empty}>Belum ada pesanan laundry</Text> : laundry.map(o => (
          <View key={o.id} style={styles.card} testID={`laundry-order-${o.id}`}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={styles.cardTitle}>{o.service_name}</Text>
              <View style={[styles.badge, { backgroundColor: colors.brandLight }]}><Text style={[styles.badgeText, { color: colors.brandDark }]}>{o.status}</Text></View>
            </View>
            <Text style={styles.muted}>≈ {o.estimated_kg} kg · {formatIDR(o.estimated_total)}</Text>
            <Text style={styles.muted}>📅 {o.pickup_date} · {o.pickup_time_slot}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: colors.border },
  title: { fontSize: 20, fontWeight: '600', color: colors.onSurface },
  section: { fontSize: 14, fontWeight: '600', color: colors.muted, marginBottom: spacing.sm },
  empty: { color: colors.muted, fontStyle: 'italic', textAlign: 'center', padding: spacing.lg },
  card: { backgroundColor: '#fff', padding: spacing.md, borderRadius: radius.md, marginBottom: spacing.sm, ...shadow.sm },
  cardTitle: { fontWeight: '600', color: colors.onSurface, fontSize: 15 },
  muted: { color: colors.muted, marginTop: 4, fontSize: 12 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  badgeText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
});
