import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, ActivityIndicator, FlatList, Dimensions, Linking, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { colors, spacing, radius, shadow, formatIDR } from '@/src/theme';
import { apiFetch } from '@/src/api';

const { width } = Dimensions.get('window');
const FAVORITES_KEY = 'nearify_favorites';

interface LaundryShop {
  id: string;
  name: string;
  description: string;
  images: string[];
  address: string;
  location: string;
  rating: number;
  services: { id: string; name: string; price_per_kg: number; description: string }[];
  contact: string;
  open_hours: string;
}

// Filter gambar untuk menghilangkan gambar alamat/info
const filterImages = (images: string[]): string[] => {
  // Ambil hanya gambar yang bukan alamat/info (biasanya gambar dengan ukuran/karakteristik tertentu)
  // Untuk saat ini, kita skip gambar pertama jika ada lebih dari 2 gambar (karena biasanya info/alamat)
  if (!images || images.length === 0) return [];
  return images;
};

export default function Laundry() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [shops, setShops] = useState<LaundryShop[]>([]);
  const [busy, setBusy] = useState(true);
  const [selectedShop, setSelectedShop] = useState<LaundryShop | null>(null);
  const [q, setQ] = useState('');

  useEffect(() => {
    loadShops();
  }, []);

  useEffect(() => {
    if (params.shopId && shops.length > 0) {
      const shop = shops.find(s => s.id === params.shopId);
      if (shop) setSelectedShop(shop);
    }
  }, [params.shopId, shops]);

  const loadShops = async () => {
    setBusy(true);
    try {
      const data = await apiFetch('/laundry-shops');
      setShops(data);
    } catch (e) {
      console.warn(e);
    } finally {
      setBusy(false);
    }
  };

  const filteredShops = q.trim() 
    ? shops.filter(s => s.name.toLowerCase().includes(q.toLowerCase()) || s.location.toLowerCase().includes(q.toLowerCase()))
    : shops;

  const renderShopCard = useCallback(({ item: shop }: { item: LaundryShop }) => {
    const images = filterImages(shop.images);
    return (
      <Pressable 
        key={shop.id}
        testID={`laundry-shop-${shop.id}`}
        style={styles.shopCard}
        onPress={() => setSelectedShop(shop)}
      >
        {images.length > 0 ? (
          <Image 
            source={{ uri: images[0] }} 
            style={styles.shopImage} 
            contentFit="cover"
            placeholder="L5H2EC=PM+yV0g-mq.wG9c010J}I"
          />
        ) : (
          <View style={[styles.shopImage, styles.noImage]}>
            <Ionicons name="storefront-outline" size={40} color={colors.muted} />
          </View>
        )}
        {images.length > 1 && (
          <View style={styles.imageCount}>
            <Ionicons name="images" size={12} color="#fff" />
            <Text style={styles.imageCountText}>{images.length}</Text>
          </View>
        )}
        <View style={styles.shopInfo}>
          <Text style={styles.shopName} numberOfLines={1}>{shop.name}</Text>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={14} color="#F59E0B" />
            <Text style={styles.rating}>{shop.rating.toFixed(1)}</Text>
            <View style={styles.dot} />
            <Text style={styles.location} numberOfLines={1}>{shop.location}</Text>
          </View>
          <View style={styles.infoLine}>
            <Ionicons name="time-outline" size={12} color={colors.muted} />
            <Text style={styles.infoText}>{shop.open_hours}</Text>
          </View>
          <View style={styles.infoLine}>
            <Ionicons name="location-outline" size={12} color={colors.muted} />
            <Text style={styles.infoText} numberOfLines={1}>{shop.address}</Text>
          </View>
        </View>
      </Pressable>
    );
  }, []);

  // Shop Detail View
  if (selectedShop) {
    return (
      <ShopDetail 
        shop={selectedShop} 
        onBack={() => setSelectedShop(null)}
        router={router}
      />
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surface }} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={26} color={colors.onSurface} />
        </Pressable>
        <Text style={styles.title}>Laundry Terdekat</Text>
        <View style={{ width: 26 }} />
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color={colors.muted} />
        <TextInput
          testID="laundry-search"
          value={q}
          onChangeText={setQ}
          placeholder="Cari laundry..."
          style={styles.searchInput}
          placeholderTextColor={colors.muted}
        />
      </View>

      {busy ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.brand} />
        </View>
      ) : (
        <FlatList
          data={filteredShops}
          renderItem={renderShopCard}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="storefront-outline" size={48} color={colors.muted} />
              <Text style={styles.emptyText}>Tidak ada laundry ditemukan</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

function ShopDetail({ shop, onBack, router }: { shop: LaundryShop; onBack: () => void; router: any }) {
  const images = filterImages(shop.images);
  const [currentImage, setCurrentImage] = useState(0);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [address, setAddress] = useState('');
  const [pickupDate, setPickupDate] = useState(new Date(Date.now() + 24*3600*1000));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [slot, setSlot] = useState('08:00 - 10:00');
  const [notes, setNotes] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  const SLOTS = ['08:00 - 10:00', '10:00 - 12:00', '13:00 - 15:00', '15:00 - 17:00', '17:00 - 19:00'];

  useEffect(() => {
    checkFavorite();
  }, []);

  const checkFavorite = async () => {
    try {
      const stored = await AsyncStorage.getItem(FAVORITES_KEY);
      if (stored) {
        const favorites = JSON.parse(stored);
        setIsFavorite(favorites.some((f: any) => f.id === shop.id && f.type === 'laundry'));
      }
    } catch (e) {}
  };

  const toggleFavorite = async () => {
    try {
      const stored = await AsyncStorage.getItem(FAVORITES_KEY);
      let favorites = stored ? JSON.parse(stored) : [];
      
      if (isFavorite) {
        favorites = favorites.filter((f: any) => !(f.id === shop.id && f.type === 'laundry'));
      } else {
        favorites.push({
          id: shop.id,
          type: 'laundry',
          name: shop.name,
          image: images[0],
          addedAt: new Date().toISOString(),
        });
      }
      
      await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
      setIsFavorite(!isFavorite);
    } catch (e) {
      console.warn('Failed to toggle favorite:', e);
    }
  };

  const handleWhatsApp = () => {
    if (shop.contact && shop.contact !== '-') {
      const phone = shop.contact.replace(/^0/, '62').replace(/[^0-9]/g, '');
      Linking.openURL(`https://wa.me/${phone}?text=Halo, saya tertarik dengan layanan laundry di ${shop.name}`);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  };

  const submit = async () => {
    if (!selectedService) { setMsg('Pilih jenis layanan'); return; }
    if (!address.trim()) { setMsg('Alamat penjemputan wajib diisi'); return; }
    setMsg(null); setSubmitting(true);
    try {
      await apiFetch('/laundry-orders', { method: 'POST', body: JSON.stringify({
        service_id: selectedService.id, 
        service_name: selectedService.name, 
        price_per_kg: selectedService.price_per_kg,
        estimated_kg: 0,
        pickup_address: address.trim(), 
        pickup_date: pickupDate.toISOString().slice(0, 10), 
        pickup_time_slot: slot, 
        notes,
        shop_id: shop.id,
        shop_name: shop.name,
      })});
      router.replace('/(app)/pesanan');
    } catch (e: any) { setMsg(e.message); }
    finally { setSubmitting(false); }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surface }} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={onBack}>
          <Ionicons name="chevron-back" size={26} color={colors.onSurface} />
        </Pressable>
        <Text style={styles.title} numberOfLines={1}>{shop.name}</Text>
        <Pressable onPress={toggleFavorite}>
          <Ionicons name={isFavorite ? "heart" : "heart-outline"} size={26} color={isFavorite ? colors.error : colors.onSurface} />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image Carousel */}
        <View style={styles.carouselContainer}>
          {images.length > 0 ? (
            <>
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
                {images.map((img, idx) => (
                  <Image
                    key={idx}
                    source={{ uri: img }}
                    style={styles.carouselImage}
                    contentFit="cover"
                  />
                ))}
              </ScrollView>
              {images.length > 1 && (
                <>
                  <View style={styles.dots}>
                    {images.map((_, idx) => (
                      <View 
                        key={idx} 
                        style={[styles.dotIndicator, currentImage === idx && styles.dotActive]} 
                      />
                    ))}
                  </View>
                  <View style={styles.imageCounter}>
                    <Ionicons name="images" size={14} color="#fff" />
                    <Text style={styles.imageCounterText}>{currentImage + 1}/{images.length}</Text>
                  </View>
                </>
              )}
            </>
          ) : (
            <View style={[styles.carouselImage, styles.noImage]}>
              <Ionicons name="storefront-outline" size={60} color={colors.muted} />
              <Text style={{ color: colors.muted, marginTop: 8 }}>Tidak ada foto</Text>
            </View>
          )}
        </View>

        <View style={styles.detailContent}>
          {/* Shop Info */}
          <View style={styles.shopHeader}>
            <Text style={styles.shopDetailName}>{shop.name}</Text>
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={16} color="#F59E0B" />
              <Text style={[styles.rating, { fontSize: 14 }]}>{shop.rating.toFixed(1)}</Text>
            </View>
          </View>
          
          <Text style={styles.shopDescription}>{shop.description}</Text>

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={18} color={colors.brand} />
              <Text style={styles.infoTextLarge}>{shop.address}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="time-outline" size={18} color={colors.brand} />
              <Text style={styles.infoTextLarge}>{shop.open_hours}</Text>
            </View>
            {shop.contact && shop.contact !== '-' && (
              <Pressable style={styles.infoRow} onPress={handleWhatsApp}>
                <Ionicons name="logo-whatsapp" size={18} color="#25D366" />
                <Text style={[styles.infoTextLarge, { color: '#25D366' }]}>{shop.contact}</Text>
                <Ionicons name="open-outline" size={14} color="#25D366" />
              </Pressable>
            )}
          </View>

          {/* Services */}
          <Text style={styles.section}>Pilih Layanan</Text>
          {shop.services.map(svc => (
            <Pressable 
              key={svc.id} 
              testID={`service-${svc.id}`}
              style={[styles.svcCard, selectedService?.id === svc.id && styles.svcCardSelected]}
              onPress={() => setSelectedService(svc)}
            >
              <View style={styles.iconBox}>
                <Ionicons name="shirt" size={22} color={colors.brand} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.svcName}>{svc.name}</Text>
                <Text style={styles.svcDesc}>{svc.description}</Text>
              </View>
              <Text style={styles.svcPrice}>{formatIDR(svc.price_per_kg)}/kg</Text>
            </Pressable>
          ))}

          {/* Simplified Order Form */}
          <Text style={styles.section}>Alamat Penjemputan</Text>
          <TextInput 
            testID="laundry-address-input" 
            value={address} 
            onChangeText={setAddress} 
            placeholder="Masukkan alamat lengkap penjemputan..." 
            style={[styles.input, { height: 80, textAlignVertical: 'top' }]} 
            placeholderTextColor={colors.muted}
            multiline
          />

          <Text style={styles.section}>Tanggal Penjemputan</Text>
          <Pressable 
            style={styles.datePickerBtn}
            onPress={() => setShowDatePicker(true)}
          >
            <Ionicons name="calendar-outline" size={20} color={colors.brand} />
            <Text style={styles.dateText}>{formatDate(pickupDate)}</Text>
          </Pressable>
          {showDatePicker && (
            <DateTimePicker
              value={pickupDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              minimumDate={new Date()}
              onChange={(event, date) => {
                setShowDatePicker(Platform.OS === 'ios');
                if (date) setPickupDate(date);
              }}
            />
          )}

          <Text style={styles.section}>Jam Penjemputan</Text>
          <View style={styles.slotsContainer}>
            {SLOTS.map(s => (
              <Pressable 
                key={s} 
                onPress={() => setSlot(s)} 
                style={[styles.slotBtn, slot === s && styles.slotActive]}
                testID={`slot-${s}`}
              >
                <Text style={[styles.slotTxt, slot === s && { color: '#fff' }]}>{s}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.section}>Catatan (opsional)</Text>
          <TextInput 
            value={notes} 
            onChangeText={setNotes} 
            placeholder="Mis: pisahkan pakaian putih" 
            style={[styles.input, { height: 80, textAlignVertical: 'top' }]} 
            placeholderTextColor={colors.muted} 
            multiline 
          />

          {/* Info Note */}
          <View style={styles.noteCard}>
            <Ionicons name="information-circle-outline" size={20} color={colors.brand} />
            <Text style={styles.noteText}>
              Estimasi berat dan total harga akan dihitung oleh pihak laundry setelah pakaian dijemput.
            </Text>
          </View>

          {msg && <Text style={styles.errorText}>{msg}</Text>}
          
          <Pressable 
            testID="laundry-submit-btn" 
            onPress={submit} 
            style={styles.submitBtn} 
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitText}>Pesan Penjemputan Laundry</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: spacing.lg, 
    backgroundColor: '#fff', 
    borderBottomWidth: 1, 
    borderBottomColor: colors.border 
  },
  title: { fontSize: 16, fontWeight: '600', flex: 1, textAlign: 'center' },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: spacing.lg,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: { flex: 1, padding: spacing.md, color: colors.onSurface },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: spacing.lg, paddingTop: spacing.sm },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100 },
  emptyText: { color: colors.muted, marginTop: spacing.md },

  // Shop Card
  shopCard: {
    backgroundColor: '#fff',
    borderRadius: radius.lg,
    marginBottom: spacing.md,
    overflow: 'hidden',
    ...shadow.md,
  },
  shopImage: { width: '100%', height: 160 },
  noImage: { backgroundColor: colors.border, justifyContent: 'center', alignItems: 'center' },
  imageCount: { 
    position: 'absolute', 
    top: 130, 
    right: 12, 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 4, 
    backgroundColor: 'rgba(0,0,0,0.6)', 
    paddingHorizontal: 8, 
    paddingVertical: 4, 
    borderRadius: 12 
  },
  imageCountText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  shopInfo: { padding: spacing.md },
  shopName: { fontSize: 16, fontWeight: '600', color: colors.onSurface, marginBottom: 4 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6 },
  rating: { fontWeight: '600', color: colors.onSurface },
  dot: { width: 3, height: 3, borderRadius: 2, backgroundColor: colors.muted, marginHorizontal: 4 },
  location: { color: colors.muted, fontSize: 12 },
  infoLine: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  infoText: { color: colors.muted, fontSize: 12, flex: 1 },

  // Carousel
  carouselContainer: { position: 'relative' },
  carouselImage: { width, height: 250 },
  dots: { 
    flexDirection: 'row', 
    justifyContent: 'center', 
    position: 'absolute', 
    bottom: 12, 
    left: 0, 
    right: 0 
  },
  dotIndicator: { 
    width: 8, 
    height: 8, 
    borderRadius: 4, 
    backgroundColor: 'rgba(255,255,255,0.5)', 
    marginHorizontal: 3 
  },
  dotActive: { backgroundColor: '#fff', width: 20 },
  imageCounter: { 
    position: 'absolute', 
    bottom: 12, 
    right: 16, 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 4, 
    backgroundColor: 'rgba(0,0,0,0.6)', 
    paddingHorizontal: 10, 
    paddingVertical: 5, 
    borderRadius: 20 
  },
  imageCounterText: { color: '#fff', fontSize: 12, fontWeight: '600' },

  // Detail
  detailContent: { padding: spacing.lg },
  shopHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: spacing.sm 
  },
  shopDetailName: { fontSize: 20, fontWeight: '700', color: colors.onSurface, flex: 1 },
  shopDescription: { color: colors.muted, lineHeight: 20, marginBottom: spacing.md },
  
  infoCard: { 
    backgroundColor: '#fff', 
    padding: spacing.md, 
    borderRadius: radius.md, 
    ...shadow.sm,
    gap: spacing.sm,
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  infoTextLarge: { color: colors.onSurface, fontSize: 14, flex: 1 },

  section: { fontWeight: '600', color: colors.onSurface, marginTop: spacing.lg, marginBottom: spacing.sm },
  svcCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#fff', 
    padding: spacing.md, 
    borderRadius: radius.md, 
    marginBottom: spacing.sm, 
    gap: 12, 
    borderWidth: 1, 
    borderColor: colors.border 
  },
  svcCardSelected: { borderColor: colors.brand, borderWidth: 2 },
  iconBox: { 
    width: 42, 
    height: 42, 
    borderRadius: 12, 
    backgroundColor: colors.brandLight, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  svcName: { fontWeight: '600', color: colors.onSurface },
  svcDesc: { color: colors.muted, fontSize: 12, marginTop: 2 },
  svcPrice: { color: colors.brandDark, fontWeight: '600' },
  
  input: { 
    borderWidth: 1, 
    borderColor: colors.border, 
    borderRadius: radius.md, 
    padding: spacing.md, 
    backgroundColor: '#fff', 
    color: colors.onSurface 
  },
  datePickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1, 
    borderColor: colors.border, 
    borderRadius: radius.md, 
    padding: spacing.md, 
    backgroundColor: '#fff',
  },
  dateText: { color: colors.onSurface, fontSize: 14 },
  slotsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  slotBtn: { 
    paddingHorizontal: 14, 
    paddingVertical: 8, 
    borderRadius: 999, 
    borderWidth: 1, 
    borderColor: colors.border, 
    backgroundColor: '#fff' 
  },
  slotActive: { backgroundColor: colors.brand, borderColor: colors.brand },
  slotTxt: { fontSize: 12, color: colors.onSurface },

  noteCard: { 
    flexDirection: 'row', 
    alignItems: 'flex-start', 
    gap: 10, 
    backgroundColor: colors.brandLight, 
    padding: spacing.md, 
    borderRadius: radius.md, 
    marginTop: spacing.lg 
  },
  noteText: { color: colors.brandDark, fontSize: 13, flex: 1, lineHeight: 18 },

  errorText: { color: colors.error, marginTop: 8 },
  submitBtn: { 
    backgroundColor: colors.brand, 
    padding: spacing.md, 
    borderRadius: radius.pill, 
    alignItems: 'center', 
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
  submitText: { color: '#fff', fontWeight: '600' },
});
