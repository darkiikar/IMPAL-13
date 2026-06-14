import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, gradient, spacing, radius, shadow } from '@/src/theme';
import { apiFetch } from '@/src/api';

export default function SurahReader() {
  const { number } = useLocalSearchParams<{ number: string }>();
  const router = useRouter();
  const [data, setData] = useState<any>(null);

  useEffect(() => { apiFetch(`/quran/surah/${number}`).then(setData).catch(() => {}); }, [number]);

  if (!data) return <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={colors.brand} /></SafeAreaView>;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surface }} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}><Ionicons name="chevron-back" size={26} color={colors.onSurface} /></Pressable>
        <Text style={styles.title}>{data.namaLatin}</Text>
        <View style={{ width: 26 }} />
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: 60 }}>
        <LinearGradient colors={gradient.brand} style={styles.banner}>
          <Text style={styles.arabicTitle}>{data.nama}</Text>
          <Text style={styles.latinTitle}>{data.namaLatin}</Text>
          <Text style={styles.subBanner}>{data.arti} · {data.jumlahAyat} ayat · {data.tempatTurun}</Text>
        </LinearGradient>
        <View style={{ padding: spacing.lg, gap: spacing.md }}>
          {(data.ayat || []).map((a: any) => (
            <View key={a.nomorAyat} style={styles.ayat} testID={`ayat-${a.nomorAyat}`}>
              <View style={styles.ayatHead}>
                <View style={styles.ayatNum}><Text style={styles.ayatNumTxt}>{a.nomorAyat}</Text></View>
              </View>
              <Text style={styles.arab}>{a.teksArab}</Text>
              <Text style={styles.latin}>{a.teksLatin}</Text>
              <Text style={styles.terj}>{a.teksIndonesia}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: colors.border },
  title: { fontSize: 16, fontWeight: '600' },
  banner: { padding: spacing.xl, alignItems: 'center' },
  arabicTitle: { fontSize: 38, color: '#fff' },
  latinTitle: { fontSize: 22, color: '#fff', fontWeight: '500', marginTop: 6 },
  subBanner: { color: 'rgba(255,255,255,0.85)', marginTop: 4, fontSize: 12 },
  ayat: { backgroundColor: '#fff', padding: spacing.md, borderRadius: radius.md, ...shadow.sm },
  ayatHead: { flexDirection: 'row', marginBottom: 8 },
  ayatNum: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.brandLight, alignItems: 'center', justifyContent: 'center' },
  ayatNumTxt: { color: colors.brandDark, fontWeight: '600', fontSize: 12 },
  arab: { fontSize: 26, textAlign: 'right', lineHeight: 48, color: colors.onSurface, fontWeight: '500' },
  latin: { color: colors.muted, marginTop: 8, fontStyle: 'italic', fontSize: 13 },
  terj: { color: colors.onSurface, marginTop: 8, lineHeight: 20 },
});
