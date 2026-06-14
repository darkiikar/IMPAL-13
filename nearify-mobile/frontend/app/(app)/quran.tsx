import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, TextInput, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { colors, spacing, radius, shadow } from '@/src/theme';
import { apiFetch } from '@/src/api';

type Surah = { nomor: number; nama: string; namaLatin: string; jumlahAyat: number; arti: string; tempatTurun: string };

export default function QuranList() {
  const router = useRouter();
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [busy, setBusy] = useState(true);
  const [q, setQ] = useState('');

  useEffect(() => {
    apiFetch('/quran/surahs')
      .then((data: any) => setSurahs(data || []))
      .catch(() => setSurahs([]))
      .finally(() => setBusy(false));
  }, []);

  const filtered = q.trim()
    ? surahs.filter(s => s.namaLatin.toLowerCase().includes(q.toLowerCase()) || s.arti.toLowerCase().includes(q.toLowerCase()) || String(s.nomor) === q.trim())
    : surahs;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surface }} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Al-Quran Digital</Text>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={colors.muted} />
          <TextInput testID="quran-search-input" value={q} onChangeText={setQ} placeholder="Cari surah…" style={styles.searchInput} placeholderTextColor={colors.muted} />
        </View>
      </View>
      {busy ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={colors.brand} /></View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(it) => String(it.nomor)}
          contentContainerStyle={{ padding: spacing.lg, paddingBottom: 100 }}
          renderItem={({ item }) => (
            <Pressable testID={`surah-${item.nomor}`} style={styles.row} onPress={() => router.push(`/quran/${item.nomor}` as any)}>
              <View style={styles.num}><Text style={styles.numTxt}>{item.nomor}</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.namaLatin}</Text>
                <Text style={styles.sub}>{item.arti} · {item.jumlahAyat} ayat · {item.tempatTurun}</Text>
              </View>
              <Text style={styles.arabic}>{item.nama}</Text>
            </Pressable>
          )}
          ListEmptyComponent={<Text style={{ color: colors.muted, textAlign: 'center', padding: spacing.xl }}>Surah tidak ditemukan</Text>}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { padding: spacing.lg, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: colors.border },
  title: { fontSize: 20, fontWeight: '600', color: colors.onSurface, marginBottom: spacing.md },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.surface, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 10 },
  searchInput: { flex: 1, color: colors.onSurface },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: spacing.md, borderRadius: radius.md, marginBottom: spacing.sm, gap: spacing.md, ...shadow.sm },
  num: { width: 38, height: 38, borderRadius: 12, backgroundColor: colors.brandLight, alignItems: 'center', justifyContent: 'center' },
  numTxt: { color: colors.brandDark, fontWeight: '600' },
  name: { fontSize: 15, fontWeight: '600', color: colors.onSurface },
  sub: { color: colors.muted, fontSize: 12, marginTop: 2 },
  arabic: { fontSize: 22, color: colors.brandDark, fontWeight: '500' },
});
