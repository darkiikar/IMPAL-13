import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Linking, ActivityIndicator, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing, radius, shadow, formatIDR } from '@/src/theme';
import { apiFetch } from '@/src/api';

const { width } = Dimensions.get('window');
const FAVORITES_KEY = 'nearify_favorites';

export default function KostDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [k, setK] = useState<any>(null);
  const [currentImage, setCurrentImage] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  
  useEffect(() => { 
    apiFetch(`/kost/${id}`).then(setK).catch(() => {}); 
    checkFavorite();
  }, [id]);

  const checkFavorite = async () => {
    try {
      const stored = await AsyncStorage.getItem(FAVORITES_KEY);
      if (stored) {
        const favorites = JSON.parse(stored);
        setIsFavorite(favorites.some((f: any) => f.id === id && f.type === 'kost'));
      }
    } catch (e) {}
  };

  const toggleFavorite = async () => {
    try {
      const stored = await AsyncStorage.getItem(FAVORITES_KEY);
      let favorites = stored ? JSON.parse(stored) : [];
      
      if (isFavorite) {
        favorites = favorites.filter((f: any) => !(f.id === id && f.type === 'kost'));
      } else {
        favorites.push({
          id: k.id,
          type: 'kost',
          name: k.name,
          image: k.images?.[0],
          addedAt: new Date().toISOString(),
        });
      }
      
      await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
      setIsFavorite(!isFavorite);
    } catch (e) {
      console.warn('Failed to toggle favorite:', e);
    }
  };

  if (!k) return <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={colors.brand} /></SafeAreaView>;

  const openWhatsApp = () => {
    if (k.contact && k.contact !== '-') {
      const phone = k.contact.replace(/^0/, '62').replace(/[^0-9]/g, '');
      Linking.openURL(`https://wa.me/${phone}?text=Halo, saya tertarik dengan ${k.name}`);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surface }} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}><Ionicons name="chevron-back" size={26} color={colors.onSurface} /></Pressable>
        <Text style={styles.title} numberOfLines={1}>{k.name}</Text>
        <Pressable onPress={toggleFavorite}>
          <Ionicons name={isFavorite ? "heart" : "heart-outline"} size={26} color={isFavorite ? colors.error : colors.onSurface} />
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        {/* Image Carousel */}
        <View style={styles.carouselContainer}>
          <ScrollView 
            horizontal 
            pagingEnabled 
            showsHorizontalScrollIndicator={false}
            onScroll={(e) => {
              const idx = Math.round(e.nativeEvent.contentOffset.x / width);
              setCurrentImage(idx);
            }}
            scrollEventThrottle={16}
          >
            {k.images.map((u: string, i: number) => (
              <Image key={i} source={{ uri: u }} style={styles.img} contentFit="cover" />
            ))}
          </ScrollView>
          {/* Dots Indicator */}
          <View style={styles.dots}>
            {k.images.map((_: string, idx: number) => (
              <View key={idx} style={[styles.dot, currentImage === idx && styles.dotActive]} />
            ))}
          </View>
          {/* Image Counter */}
          <View style={styles.imageCounter}>
            <Ionicons name="images" size={14} color="#fff" />
            <Text style={styles.imageCounterText}>{currentImage + 1}/{k.images.length}</Text>
          </View>
        </View>

        <View style={{ padding: spacing.lg }}>
          {/* Header Info */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{k.name}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
                <Ionicons name="star" size={16} color="#F59E0B" />
                <Text style={styles.rating}>{k.rating?.toFixed(1) || '4.5'}</Text>
                <View style={styles.genderBadge}>
                  <Text style={styles.genderText}>{k.gender?.charAt(0).toUpperCase() + k.gender?.slice(1)}</Text>
                </View>
              </View>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.price}>{formatIDR(k.price_per_month)}</Text>
              <Text style={styles.priceLabel}>/bulan</Text>
            </View>
          </View>

          {/* Location */}
          <View style={styles.infoRow}>
            <Ionicons name="location" size={18} color={colors.brand} />
            <View style={{ flex: 1 }}>
              <Text style={styles.locationText}>{k.location}</Text>
              <Text style={styles.addressText}>{k.address}</Text>
            </View>
          </View>

          {/* Description */}
          <Text style={styles.description}>{k.description}</Text>

          {/* Availability */}
          <View style={styles.availabilityCard}>
            <Ionicons name="bed-outline" size={24} color={colors.brand} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.availabilityTitle}>{k.available_rooms} Kamar Tersedia</Text>
              <Text style={styles.availabilitySubtitle}>Siap untuk dihuni</Text>
            </View>
            <View style={styles.availabilityBadge}>
              <Text style={styles.availabilityBadgeText}>TERSEDIA</Text>
            </View>
          </View>

          {/* Facilities */}
          <Text style={styles.section}>Fasilitas</Text>
          <View style={styles.facilitiesGrid}>
            {k.facilities.map((f: string) => (
              <View key={f} style={styles.facilityTag}>
                <Ionicons name="checkmark-circle" size={14} color={colors.brand} />
                <Text style={styles.facilityText}>{f}</Text>
              </View>
            ))}
          </View>

          {/* Contact Info */}
          <Text style={styles.section}>Kontak Pemilik</Text>
          <Pressable style={styles.contactCard} onPress={openWhatsApp}>
            <Ionicons name="logo-whatsapp" size={22} color="#25D366" />
            <Text style={styles.contactText}>{k.contact || '-'}</Text>
            {k.contact && k.contact !== '-' && (
              <Text style={styles.contactHint}>Ketuk untuk chat</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: colors.border },
  title: { fontSize: 16, fontWeight: '600', flex: 1, textAlign: 'center' },
  carouselContainer: { position: 'relative' },
  img: { width, height: 280, backgroundColor: colors.border },
  dots: { flexDirection: 'row', justifyContent: 'center', position: 'absolute', bottom: 16, left: 0, right: 0 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.5)', marginHorizontal: 3 },
  dotActive: { backgroundColor: '#fff', width: 24 },
  imageCounter: { position: 'absolute', bottom: 16, right: 16, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  imageCounterText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  name: { fontSize: 24, fontWeight: '700', color: colors.onSurface },
  rating: { fontWeight: '600', marginLeft: 4, color: colors.onSurface },
  genderBadge: { marginLeft: 12, backgroundColor: colors.brandLight, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999 },
  genderText: { color: colors.brandDark, fontSize: 12, fontWeight: '600' },
  price: { fontSize: 22, fontWeight: '700', color: colors.brandDark },
  priceLabel: { color: colors.muted, fontSize: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: spacing.lg, gap: 10 },
  locationText: { fontWeight: '600', color: colors.onSurface },
  addressText: { color: colors.muted, fontSize: 13, marginTop: 2 },
  description: { marginTop: spacing.md, color: colors.onSurface, lineHeight: 22 },
  availabilityCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: spacing.md, borderRadius: radius.md, marginTop: spacing.lg, ...shadow.sm },
  availabilityTitle: { fontWeight: '600', color: colors.onSurface },
  availabilitySubtitle: { color: colors.muted, fontSize: 12, marginTop: 2 },
  availabilityBadge: { backgroundColor: '#10B981', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  availabilityBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  section: { marginTop: spacing.xl, marginBottom: spacing.sm, fontWeight: '600', color: colors.onSurface, fontSize: 16 },
  facilitiesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  facilityTag: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: colors.brandLight },
  facilityText: { color: colors.brandDark, fontSize: 13 },
  contactCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', padding: spacing.md, borderRadius: radius.md, ...shadow.sm },
  contactText: { flex: 1, color: colors.onSurface, fontSize: 15, fontWeight: '500' },
  contactHint: { color: '#25D366', fontSize: 12 },
});
