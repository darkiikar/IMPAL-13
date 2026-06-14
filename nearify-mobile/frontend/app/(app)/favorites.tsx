import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing, radius, shadow, formatIDR } from '@/src/theme';
import { apiFetch } from '@/src/api';

const FAVORITES_KEY = 'nearify_favorites';

type FavoriteType = 'restaurant' | 'kost' | 'laundry';

interface FavoriteItem {
  id: string;
  type: FavoriteType;
  name: string;
  image?: string;
  addedAt: string;
}

export default function Favorites() {
  const router = useRouter();
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FavoriteType | 'all'>('all');

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      const stored = await AsyncStorage.getItem(FAVORITES_KEY);
      if (stored) {
        setFavorites(JSON.parse(stored));
      }
    } catch (e) {
      console.warn('Failed to load favorites', e);
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (id: string) => {
    const updated = favorites.filter(f => f.id !== id);
    await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
    setFavorites(updated);
  };

  const navigateToDetail = (item: FavoriteItem) => {
    if (item.type === 'restaurant') {
      router.push(`/food/${item.id}` as any);
    } else if (item.type === 'kost') {
      router.push(`/kost/${item.id}` as any);
    } else if (item.type === 'laundry') {
      router.push(`/laundry?shopId=${item.id}` as any);
    }
  };

  const filteredFavorites = activeTab === 'all' 
    ? favorites 
    : favorites.filter(f => f.type === activeTab);

  const getTypeLabel = (type: FavoriteType) => {
    switch (type) {
      case 'restaurant': return 'Restoran';
      case 'kost': return 'Kost';
      case 'laundry': return 'Laundry';
    }
  };

  const getTypeIcon = (type: FavoriteType) => {
    switch (type) {
      case 'restaurant': return 'restaurant';
      case 'kost': return 'bed';
      case 'laundry': return 'shirt';
    }
  };

  const getTypeColor = (type: FavoriteType) => {
    switch (type) {
      case 'restaurant': return '#FB923C';
      case 'kost': return '#8B5CF6';
      case 'laundry': return '#06B6D4';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.brand} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surface }} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={26} color={colors.onSurface} />
        </Pressable>
        <Text style={styles.title}>Favorit</Text>
        <View style={{ width: 26 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: 8 }}>
          {(['all', 'restaurant', 'kost', 'laundry'] as const).map(tab => (
            <Pressable
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab === 'all' ? 'Semua' : getTypeLabel(tab)}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: spacing.lg }}>
        {filteredFavorites.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="heart-outline" size={48} color={colors.muted} />
            <Text style={styles.emptyText}>Belum ada favorit</Text>
            <Text style={styles.emptySubText}>Tambahkan restoran, kost, atau laundry ke favorit untuk akses cepat</Text>
          </View>
        ) : (
          filteredFavorites.map(item => (
            <Pressable key={item.id} style={styles.card} onPress={() => navigateToDetail(item)}>
              {item.image ? (
                <Image source={{ uri: item.image }} style={styles.cardImage} contentFit="cover" />
              ) : (
                <View style={[styles.cardImage, styles.cardImagePlaceholder]}>
                  <Ionicons name={getTypeIcon(item.type) as any} size={30} color={colors.muted} />
                </View>
              )}
              <View style={styles.cardContent}>
                <View style={[styles.typeBadge, { backgroundColor: getTypeColor(item.type) + '20' }]}>
                  <Ionicons name={getTypeIcon(item.type) as any} size={12} color={getTypeColor(item.type)} />
                  <Text style={[styles.typeBadgeText, { color: getTypeColor(item.type) }]}>{getTypeLabel(item.type)}</Text>
                </View>
                <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
              </View>
              <Pressable style={styles.removeBtn} onPress={() => removeFavorite(item.id)}>
                <Ionicons name="heart" size={22} color={colors.error} />
              </Pressable>
            </Pressable>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: colors.border },
  title: { fontSize: 16, fontWeight: '600' },
  tabs: { paddingVertical: spacing.md, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: colors.border },
  tab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  tabActive: { backgroundColor: colors.brand, borderColor: colors.brand },
  tabText: { color: colors.muted, fontSize: 13 },
  tabTextActive: { color: '#fff', fontWeight: '600' },
  emptyContainer: { alignItems: 'center', paddingTop: 60 },
  emptyText: { color: colors.onSurface, fontWeight: '600', marginTop: spacing.md },
  emptySubText: { color: colors.muted, marginTop: 4, textAlign: 'center', paddingHorizontal: spacing.xl },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: radius.md, marginBottom: spacing.md, overflow: 'hidden', ...shadow.sm },
  cardImage: { width: 80, height: 80 },
  cardImagePlaceholder: { backgroundColor: colors.border, justifyContent: 'center', alignItems: 'center' },
  cardContent: { flex: 1, padding: spacing.md },
  typeBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, alignSelf: 'flex-start', marginBottom: 6 },
  typeBadgeText: { fontSize: 10, fontWeight: '600' },
  cardName: { fontWeight: '600', color: colors.onSurface },
  removeBtn: { padding: spacing.md },
});
