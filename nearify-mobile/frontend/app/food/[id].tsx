import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing, radius, shadow, formatIDR } from '@/src/theme';
import { apiFetch } from '@/src/api';
import { useCart } from '@/src/cart';

const FAVORITES_KEY = 'nearify_favorites';

export default function RestaurantDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const cart = useCart();
  const [r, setR] = useState<any>(null);
  const [menu, setMenu] = useState<any[]>([]);
  const [busy, setBusy] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    Promise.all([apiFetch(`/restaurants/${id}`), apiFetch(`/restaurants/${id}/menu`)])
      .then(([rr, mm]) => { setR(rr); setMenu(mm); })
      .finally(() => setBusy(false));
    checkFavorite();
  }, [id]);

  const checkFavorite = async () => {
    try {
      const stored = await AsyncStorage.getItem(FAVORITES_KEY);
      if (stored) {
        const favorites = JSON.parse(stored);
        setIsFavorite(favorites.some((f: any) => f.id === id && f.type === 'restaurant'));
      }
    } catch (e) {}
  };

  const toggleFavorite = async () => {
    if (!r) return;
    try {
      const stored = await AsyncStorage.getItem(FAVORITES_KEY);
      let favorites = stored ? JSON.parse(stored) : [];
      
      if (isFavorite) {
        favorites = favorites.filter((f: any) => !(f.id === id && f.type === 'restaurant'));
      } else {
        favorites.push({
          id: r.id,
          type: 'restaurant',
          name: r.name,
          image: r.image,
          addedAt: new Date().toISOString(),
        });
      }
      
      await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
      setIsFavorite(!isFavorite);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    } catch (e) {
      console.warn('Failed to toggle favorite:', e);
    }
  };

  if (busy || !r) return <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={colors.brand} /></SafeAreaView>;

  const onAdd = (item: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    cart.add(r.id, r.name, { menu_item_id: item.id, name: item.name, price: item.price, image: item.image });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surface }} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}><Ionicons name="chevron-back" size={26} color={colors.onSurface} /></Pressable>
        <Text style={styles.title} numberOfLines={1}>{r.name}</Text>
        <Pressable onPress={toggleFavorite}>
          <Ionicons name={isFavorite ? "heart" : "heart-outline"} size={26} color={isFavorite ? colors.error : colors.onSurface} />
        </Pressable>
      </View>
      <FlatList
        data={menu}
        keyExtractor={(m) => m.id}
        ListHeaderComponent={
          <View>
            <Image source={{ uri: r.image }} style={styles.cover} />
            <View style={{ padding: spacing.lg }}>
              <Text style={styles.name}>{r.name}</Text>
              <Text style={{ color: colors.muted, marginTop: 4 }}>{r.description}</Text>
              <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: 8, flexWrap: 'wrap' }}>
                <View style={styles.metaItem}>
                  <Ionicons name="star" size={14} color="#F59E0B" />
                  <Text style={styles.meta}>{r.rating}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="time-outline" size={14} color={colors.muted} />
                  <Text style={styles.meta}>{r.delivery_time_min} menit</Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="location-outline" size={14} color={colors.muted} />
                  <Text style={styles.meta}>{r.address}</Text>
                </View>
              </View>
              <View style={styles.deliveryInfo}>
                <Ionicons name="bicycle-outline" size={18} color={colors.brand} />
                <Text style={styles.deliveryText}>Ongkir Rp 3.000/2km dari restoran</Text>
              </View>
              <Text style={[styles.section]}>Menu</Text>
            </View>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 120 }}
        renderItem={({ item }) => (
          <View style={styles.menuRow} testID={`menu-${item.id}`}>
            <Image source={{ uri: item.image }} style={styles.menuImg} />
            <View style={{ flex: 1 }}>
              <Text style={styles.menuName}>{item.name}</Text>
              <Text style={{ color: colors.muted, fontSize: 12 }}>{item.description}</Text>
              <Text style={styles.price}>{formatIDR(item.price)}</Text>
            </View>
            <Pressable style={styles.addBtn} onPress={() => onAdd(item)} testID={`add-${item.id}`}>
              <Ionicons name="add" size={22} color="#fff" />
            </Pressable>
          </View>
        )}
      />
      {cart.count > 0 && (
        <Pressable style={styles.checkout} onPress={() => router.push('/food/cart')} testID="goto-cart-btn">
          <Text style={styles.checkoutText}>{cart.count} item · {formatIDR(cart.subtotal)}</Text>
          <Text style={[styles.checkoutText, { fontWeight: '700' }]}>Lihat Keranjang →</Text>
        </Pressable>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: colors.border },
  title: { fontSize: 16, fontWeight: '600', color: colors.onSurface, flex: 1, textAlign: 'center' },
  cover: { width: '100%', height: 180, backgroundColor: colors.border },
  name: { fontSize: 22, fontWeight: '600', color: colors.onSurface },
  section: { marginTop: spacing.lg, fontWeight: '600', fontSize: 16, color: colors.onSurface },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  meta: { color: colors.muted, fontSize: 12 },
  deliveryInfo: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: spacing.md, backgroundColor: colors.brandLight, padding: spacing.sm, paddingHorizontal: spacing.md, borderRadius: radius.md },
  deliveryText: { color: colors.brandDark, fontSize: 12, fontWeight: '500' },
  menuRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: spacing.md, backgroundColor: '#fff', marginHorizontal: spacing.lg, marginBottom: spacing.sm, borderRadius: radius.md, ...shadow.sm },
  menuImg: { width: 64, height: 64, borderRadius: 12, backgroundColor: colors.border },
  menuName: { fontWeight: '600', color: colors.onSurface },
  price: { color: colors.brandDark, marginTop: 4, fontWeight: '600' },
  addBtn: { backgroundColor: colors.brand, width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  checkout: { position: 'absolute', left: spacing.lg, right: spacing.lg, bottom: 24, backgroundColor: colors.brand, padding: spacing.md, borderRadius: radius.pill, flexDirection: 'row', justifyContent: 'space-between', ...shadow.md },
  checkoutText: { color: '#fff', fontWeight: '500' },
});
