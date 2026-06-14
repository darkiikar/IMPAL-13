import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';

import { colors, gradient, spacing, radius, shadow } from '@/src/theme';
import { useAuth } from '@/src/auth';
import { apiFetch } from '@/src/api';

const SERVICES = [
  { key: 'food', label: 'Makanan', icon: 'restaurant', path: '/food', color: '#FB923C' },
  { key: 'laundry', label: 'Laundry', icon: 'shirt', path: '/laundry', color: '#06B6D4' },
  { key: 'kost', label: 'Kost', icon: 'bed', path: '/kost', color: '#8B5CF6' },
  { key: 'quran', label: 'Al-Quran', icon: 'book', path: '/(app)/quran', color: '#0EA5E9' },
] as const;

export default function Home() {
  const router = useRouter();
  const { user } = useAuth();
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);
  const [locationName, setLocationName] = useState('Purwokerto');

  useEffect(() => {
    const getLocation = async () => {
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status === 'granted') {
          const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
          const geocode = await Location.reverseGeocodeAsync({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });
          if (geocode.length > 0) {
            const loc = geocode[0];
            setLocationName(loc.subregion || loc.city || 'Purwokerto');
          }
        }
      } catch (e) {
        console.warn('Location fetch failed:', e);
      }
    };
    getLocation();
  }, []);

  const onSearch = async () => {
    if (!q.trim()) return;
    setBusy(true); setAiResult(null);
    try {
      const r = await apiFetch('/ai/search', { method: 'POST', body: JSON.stringify({ query: q, scope: 'all' }) });
      setAiResult(r);
    } catch (e) { console.warn(e); }
    finally { setBusy(false); }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <LinearGradient colors={gradient.brand} style={styles.header}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.hi}>Halo, {user?.name?.split(' ')[0] || 'Sahabat'}</Text>
              <Text style={styles.loc}><Ionicons name="location" size={12} color="#fff" /> {locationName}</Text>
            </View>
            <Pressable onPress={() => router.push('/(app)/profile')} testID="home-avatar-btn">
              <View style={styles.avatar}><Ionicons name="person" size={20} color="#fff" /></View>
            </Pressable>
          </View>

          <View style={styles.searchBar} testID="home-search-bar">
            <Ionicons name="search" size={18} color={colors.brand} />
            <TextInput
              testID="home-search-input"
              value={q}
              onChangeText={setQ}
              onSubmitEditing={onSearch}
              placeholder="Cari makanan, restoran, atau kost…"
              style={styles.searchInput}
              placeholderTextColor={colors.muted}
              returnKeyType="search"
            />
            {busy ? <ActivityIndicator size="small" color={colors.brand} /> : (
              <Pressable onPress={onSearch} testID="home-search-btn"><Ionicons name="arrow-forward-circle" size={26} color={colors.brand} /></Pressable>
            )}
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: spacing.lg, paddingBottom: 100 }}>
        {aiResult && (
          <View style={styles.aiCard} testID="ai-result-card">
            <Text style={styles.aiTitle}>Hasil Pencarian</Text>
            <Text style={styles.aiSub}>{(aiResult.food?.length || 0)} restoran · {(aiResult.kost?.length || 0)} kost</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
              <Pressable style={[styles.aiBtn, { backgroundColor: colors.brand }]} onPress={() => router.push('/food')}><Text style={{ color: '#fff', fontWeight: '600' }}>Lihat Makanan</Text></Pressable>
              <Pressable style={[styles.aiBtn, { backgroundColor: colors.navy }]} onPress={() => router.push('/kost')}><Text style={{ color: '#fff', fontWeight: '600' }}>Lihat Kost</Text></Pressable>
            </View>
          </View>
        )}

        <Text style={styles.section}>Layanan Nearify</Text>
        <View style={styles.grid}>
          {SERVICES.map((s) => (
            <Pressable
              key={s.key}
              testID={`service-${s.key}`}
              style={styles.serviceCard}
              onPress={() => router.push(s.path as any)}
            >
              <View style={[styles.serviceIcon, { backgroundColor: s.color + '20' }]}>
                <Ionicons name={s.icon as any} size={28} color={s.color} />
              </View>
              <Text style={styles.serviceLabel}>{s.label}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.sm },
  hi: { color: '#fff', fontSize: 18, fontWeight: '500' },
  loc: { color: 'rgba(255,255,255,0.85)', fontSize: 12, marginTop: 2 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 10, marginTop: spacing.lg, gap: 8, ...shadow.md },
  searchInput: { flex: 1, color: colors.onSurface, fontSize: 14 },
  section: { fontSize: 16, fontWeight: '600', color: colors.onSurface, marginBottom: spacing.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  serviceCard: { width: '48%', backgroundColor: '#fff', borderRadius: radius.lg, padding: spacing.lg, alignItems: 'center', marginBottom: spacing.md, ...shadow.sm },
  serviceIcon: { width: 60, height: 60, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  serviceLabel: { fontSize: 14, fontWeight: '600', color: colors.onSurface },
  aiCard: { backgroundColor: colors.brandLight, padding: spacing.md, borderRadius: radius.md, marginBottom: spacing.lg, borderWidth: 1, borderColor: colors.brand + '40' },
  aiTitle: { fontWeight: '600', color: colors.brandDark },
  aiSub: { color: colors.muted, marginTop: 4, fontSize: 12 },
  aiBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: radius.pill },
});
