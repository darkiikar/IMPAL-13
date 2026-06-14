import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator, ScrollView, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, shadow, formatIDR } from '@/src/theme';
import { apiFetch } from '@/src/api';
import { useCart } from '@/src/cart';

const CATS = ['Semua', 'Nasi', 'Mie', 'Minuman', 'Snack'];

export default function FoodList() {
  const router = useRouter();
  const cart = useCart();
  const [cat, setCat] = useState('Semua');
  const [items, setItems] = useState<any[]>([]);
  const [busy, setBusy] = useState(true);
  
  useEffect(() => { 
    setBusy(true); 
    apiFetch(`/restaurants${cat !== 'Semua' ? `?category=${cat}` : ''}`)
      .then(setItems)
      .finally(() => setBusy(false)); 
  }, [cat]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surface }} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}><Ionicons name="chevron-back" size={26} color={colors.onSurface} /></Pressable>
        <Text style={styles.title}>Makanan</Text>
        <Pressable onPress={() => router.push('/food/cart')} hitSlop={10} testID="cart-icon">
          <Ionicons name="cart" size={24} color={colors.brand} />
          {cart.count > 0 && <View style={styles.badge}><Text style={styles.badgeText}>{cart.count}</Text></View>}
        </Pressable>
      </View>
      <View style={{ height: 56 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: 8, paddingVertical: 10 }}>
          {CATS.map(c => (
            <Pressable key={c} testID={`cat-${c}`} onPress={() => setCat(c)} style={[styles.chip, cat === c && styles.chipActive, { flexShrink: 0 }]}>
              <Text style={[styles.chipText, cat === c && { color: '#fff' }]}>{c}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
      {busy ? <ActivityIndicator color={colors.brand} style={{ marginTop: 40 }} /> : (
        <FlatList
          data={items}
          keyExtractor={(it) => it.id}
          contentContainerStyle={{ padding: spacing.lg, paddingBottom: 100 }}
          renderItem={({ item }) => (
            <Pressable testID={`restaurant-${item.id}`} style={styles.card} onPress={() => router.push(`/food/${item.id}` as any)}>
              <Image source={{ uri: item.image }} style={styles.img} />
              <View style={{ padding: spacing.md }}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.desc} numberOfLines={1}>{item.description}</Text>
                <View style={{ flexDirection: 'row', gap: 12, marginTop: 6, alignItems: 'center' }}>
                  <View style={styles.metaItem}>
                    <Ionicons name="star" size={12} color="#F59E0B" />
                    <Text style={styles.meta}>{item.rating}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Ionicons name="time-outline" size={12} color={colors.muted} />
                    <Text style={styles.meta}>{item.delivery_time_min} mnt</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Ionicons name="bicycle-outline" size={12} color={colors.muted} />
                    <Text style={styles.meta}>Rp 3rb/2km</Text>
                  </View>
                </View>
              </View>
            </Pressable>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="restaurant-outline" size={48} color={colors.muted} />
              <Text style={styles.emptyText}>Tidak ada restoran ditemukan</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: colors.border },
  title: { fontSize: 18, fontWeight: '600', color: colors.onSurface },
  badge: { position: 'absolute', top: -4, right: -6, backgroundColor: colors.error, borderRadius: 999, paddingHorizontal: 5, minWidth: 16, alignItems: 'center' },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  chip: { height: 36, paddingHorizontal: 16, borderRadius: 999, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  chipActive: { backgroundColor: colors.brand, borderColor: colors.brand },
  chipText: { color: colors.onSurface, fontWeight: '500', fontSize: 13 },
  card: { backgroundColor: '#fff', borderRadius: radius.md, marginBottom: spacing.md, overflow: 'hidden', ...shadow.sm },
  img: { width: '100%', height: 140, backgroundColor: colors.border },
  name: { fontSize: 16, fontWeight: '600', color: colors.onSurface },
  desc: { color: colors.muted, marginTop: 2, fontSize: 13 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  meta: { fontSize: 12, color: colors.muted },
  emptyContainer: { alignItems: 'center', paddingTop: 60 },
  emptyText: { color: colors.muted, marginTop: spacing.md },
});
