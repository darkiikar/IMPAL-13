import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, ScrollView, ActivityIndicator, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { colors, spacing, radius, shadow, formatIDR } from '@/src/theme';
import { apiFetch } from '@/src/api';

const { width } = Dimensions.get('window');
const GENDERS = ['semua', 'putra', 'putri', 'campur'];
// Hanya lokasi di area Purwokerto yang relevan dengan data kost
const LOCS = ['Semua', 'Berkoh', 'Sokaraja', 'Arcawinangun'];

export default function KostList() {
  const router = useRouter();
  const [gender, setGender] = useState('semua');
  const [loc, setLoc] = useState('Semua');
  const [items, setItems] = useState<any[]>([]);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    setBusy(true);
    const params = new URLSearchParams();
    if (gender !== 'semua') params.set('gender', gender);
    if (loc !== 'Semua') params.set('location', loc);
    apiFetch(`/kost?${params}`).then(setItems).finally(() => setBusy(false));
  }, [gender, loc]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surface }} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}><Ionicons name="chevron-back" size={26} color={colors.onSurface} /></Pressable>
        <Text style={styles.title}>Rekomendasi Kost</Text>
        <View style={{ width: 26 }} />
      </View>
      <View style={{ height: 56 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: 8, paddingVertical: 10 }}>
          {GENDERS.map(g => (
            <Pressable key={g} testID={`gender-${g}`} onPress={() => setGender(g)} style={[styles.chip, gender === g && styles.chipActive, { flexShrink: 0 }]}>
              <Text style={[styles.chipText, gender === g && { color: '#fff' }]}>{g === 'semua' ? 'Semua' : g.charAt(0).toUpperCase() + g.slice(1)}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
      <View style={{ height: 48 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: 8 }}>
          {LOCS.map(l => (
            <Pressable key={l} testID={`loc-${l}`} onPress={() => setLoc(l)} style={[styles.locChip, loc === l && { backgroundColor: colors.brandLight, borderColor: colors.brand }, { flexShrink: 0 }]}>
              <Ionicons name="location" size={12} color={loc === l ? colors.brandDark : colors.muted} />
              <Text style={[styles.locTxt, loc === l && { color: colors.brandDark, fontWeight: '600' }]}>{l}</Text>
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
            <Pressable testID={`kost-${item.id}`} style={styles.card} onPress={() => router.push(`/kost/${item.id}` as any)}>
              <Image source={{ uri: item.images?.[0] }} style={styles.img} contentFit="cover" />
              {item.images?.length > 1 && (
                <View style={styles.imageCount}>
                  <Ionicons name="images" size={12} color="#fff" />
                  <Text style={styles.imageCountText}>{item.images.length}</Text>
                </View>
              )}
              <View style={{ padding: spacing.md }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.price}>{formatIDR(item.price_per_month)}<Text style={{ color: colors.muted, fontSize: 11 }}>/bln</Text></Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                  <Ionicons name="star" size={12} color="#F59E0B" />
                  <Text style={[styles.meta, { marginLeft: 4 }]}>{item.rating?.toFixed(1) || '4.5'}</Text>
                  <Text style={styles.meta}> · <Ionicons name="location" size={11} color={colors.muted} /> {item.location} · {item.gender}</Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                  {(item.facilities || []).slice(0, 3).map((f: string) => <View key={f} style={styles.tag}><Text style={styles.tagTxt}>{f}</Text></View>)}
                </View>
              </View>
            </Pressable>
          )}
          ListEmptyComponent={<Text style={{ textAlign: 'center', color: colors.muted, padding: spacing.xl }}>Tidak ada kost sesuai filter</Text>}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: colors.border },
  title: { fontSize: 16, fontWeight: '600' },
  chip: { height: 36, paddingHorizontal: 16, borderRadius: 999, backgroundColor: '#fff', borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  chipActive: { backgroundColor: colors.brand, borderColor: colors.brand },
  chipText: { color: colors.onSurface, fontSize: 13 },
  locChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: colors.border, backgroundColor: '#fff', height: 32 },
  locTxt: { fontSize: 12, color: colors.muted },
  card: { backgroundColor: '#fff', borderRadius: radius.md, marginBottom: spacing.md, overflow: 'hidden', ...shadow.sm },
  img: { width: '100%', height: 180, backgroundColor: colors.border },
  imageCount: { position: 'absolute', top: 150, right: 12, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  imageCountText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  name: { fontSize: 16, fontWeight: '600', color: colors.onSurface, flex: 1 },
  price: { fontWeight: '700', color: colors.brandDark },
  meta: { color: colors.muted, fontSize: 12 },
  tag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, backgroundColor: colors.brandLight },
  tagTxt: { color: colors.brandDark, fontSize: 11 },
});
