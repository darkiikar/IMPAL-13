import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, TextInput, ActivityIndicator, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as Location from 'expo-location';
import { colors, spacing, radius, shadow, formatIDR } from '@/src/theme';
import { useCart } from '@/src/cart';
import { apiFetch } from '@/src/api';

// Koordinat restoran default (Purwokerto pusat)
const DEFAULT_REST_COORDS = { lat: -7.42, lng: 109.24 };

// Hitung jarak menggunakan formula Haversine
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Radius bumi dalam km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Hitung ongkir: Rp 3.000 per 2km
const calculateDeliveryFee = (distanceKm: number): number => {
  const units = Math.ceil(distanceKm / 2); // Setiap 2km
  return units * 3000;
};

export default function Cart() {
  const router = useRouter();
  const cart = useCart();
  const [address, setAddress] = useState('');
  const [method, setMethod] = useState<'qris' | 'card' | 'cash'>('qris');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [distance, setDistance] = useState<number>(2); // Default 2km
  const [deliveryFee, setDeliveryFee] = useState(3000); // Default Rp 3.000

  useEffect(() => {
    getUserLocation();
  }, []);

  const getUserLocation = async () => {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const coords = { lat: location.coords.latitude, lng: location.coords.longitude };
        setUserLocation(coords);
        
        // Hitung jarak dari restoran ke user
        const dist = calculateDistance(
          DEFAULT_REST_COORDS.lat, 
          DEFAULT_REST_COORDS.lng, 
          coords.lat, 
          coords.lng
        );
        setDistance(Math.max(1, dist)); // Minimal 1km
        setDeliveryFee(calculateDeliveryFee(dist));
      }
    } catch (e) {
      console.warn('Failed to get location:', e);
    }
  };

  const total = cart.subtotal + (cart.items.length > 0 ? deliveryFee : 0);

  const onCheckout = async () => {
    if (!cart.items.length || !cart.restaurantId) return;
    if (!address.trim()) { setMsg('Alamat pengiriman wajib diisi'); return; }
    setMsg(null); setBusy(true);
    try {
      const order: any = await apiFetch('/food-orders', {
        method: 'POST',
        body: JSON.stringify({
          restaurant_id: cart.restaurantId,
          restaurant_name: cart.restaurantName,
          items: cart.items,
          delivery_address: address.trim(),
          payment_method: method,
          delivery_fee: deliveryFee,
        }),
      });
      if (method === 'card') {
        try {
          const r: any = await apiFetch('/payments/checkout', { method: 'POST', body: JSON.stringify({ amount: total, description: `Pesanan ${order.restaurant_name}`, order_id: order.id }) });
          if (r.checkout_url) {
            if (Platform.OS === 'web') (globalThis as any).location.href = r.checkout_url;
            else await WebBrowser.openBrowserAsync(r.checkout_url);
          }
        } catch (e: any) { setMsg('Stripe: ' + e.message); setBusy(false); return; }
      }
      cart.clear();
      router.replace('/(app)/pesanan');
    } catch (e: any) { setMsg(e.message || 'Gagal checkout'); }
    finally { setBusy(false); }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surface }} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}><Ionicons name="chevron-back" size={26} color={colors.onSurface} /></Pressable>
        <Text style={styles.title}>Keranjang</Text>
        <View style={{ width: 26 }} />
      </View>
      <FlatList
        data={cart.items}
        keyExtractor={(it) => it.menu_item_id}
        ListEmptyComponent={<Text style={{ textAlign: 'center', color: colors.muted, padding: spacing.xl }}>Keranjang kosong</Text>}
        ListHeaderComponent={!!cart.restaurantName ? <Text style={styles.restName}>{cart.restaurantName}</Text> : null}
        renderItem={({ item }) => (
          <View style={styles.row} testID={`cart-item-${item.menu_item_id}`}>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={{ color: colors.brandDark, fontWeight: '600' }}>{formatIDR(item.price)}</Text>
            </View>
            <View style={styles.qty}>
              <Pressable onPress={() => cart.setQty(item.menu_item_id, item.qty - 1)} hitSlop={10}><Ionicons name="remove-circle" size={26} color={colors.brand} /></Pressable>
              <Text style={styles.qtyN}>{item.qty}</Text>
              <Pressable onPress={() => cart.setQty(item.menu_item_id, item.qty + 1)} hitSlop={10}><Ionicons name="add-circle" size={26} color={colors.brand} /></Pressable>
            </View>
          </View>
        )}
        ListFooterComponent={
          cart.items.length === 0 ? null : (
            <View style={{ padding: spacing.lg, gap: spacing.md }}>
              <Text style={styles.label}>Alamat Pengiriman</Text>
              <TextInput testID="cart-address-input" value={address} onChangeText={setAddress} placeholder="Contoh: Jl. HR Bunyamin No. 5" style={styles.input} placeholderTextColor={colors.muted} />
              
              <Text style={styles.label}>Metode Pembayaran</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {(['qris', 'card', 'cash'] as const).map(m => (
                  <Pressable key={m} testID={`pay-${m}`} onPress={() => setMethod(m)} style={[styles.pmBtn, method === m && { backgroundColor: colors.brand, borderColor: colors.brand }]}>
                    <Text style={[styles.pmTxt, method === m && { color: '#fff' }]}>{m === 'qris' ? 'QRIS' : m === 'card' ? 'Kartu' : 'Bayar di Tempat'}</Text>
                  </Pressable>
                ))}
              </View>
              
              <View style={styles.summary}>
                <Row label="Subtotal" v={formatIDR(cart.subtotal)} />
                <Row label={`Ongkir (±${distance.toFixed(1)} km)`} v={formatIDR(deliveryFee)} />
                <View style={styles.divider} />
                <Row label="Total" v={formatIDR(total)} bold />
              </View>
              
              <View style={styles.deliveryNote}>
                <Ionicons name="information-circle-outline" size={16} color={colors.brand} />
                <Text style={styles.deliveryNoteText}>Ongkir dihitung Rp 3.000 per 2 km dari lokasi restoran</Text>
              </View>
              
              {msg && <Text style={{ color: colors.error }}>{msg}</Text>}
              <Pressable testID="checkout-btn" style={styles.checkout} onPress={onCheckout} disabled={busy}>
                {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.checkoutText}>Bayar {formatIDR(total)}</Text>}
              </Pressable>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}

const Row = ({ label, v, bold }: any) => (
  <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
    <Text style={{ color: colors.muted, fontWeight: bold ? '600' : '400' }}>{label}</Text>
    <Text style={{ color: colors.onSurface, fontWeight: bold ? '700' : '500' }}>{v}</Text>
  </View>
);

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: colors.border },
  title: { fontSize: 16, fontWeight: '600' },
  restName: { padding: spacing.lg, paddingBottom: 0, fontWeight: '600', color: colors.onSurface, fontSize: 16 },
  row: { flexDirection: 'row', padding: spacing.md, marginHorizontal: spacing.lg, marginTop: spacing.sm, backgroundColor: '#fff', borderRadius: radius.md, alignItems: 'center', ...shadow.sm },
  itemName: { color: colors.onSurface, fontWeight: '500' },
  qty: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qtyN: { fontWeight: '600', minWidth: 16, textAlign: 'center', color: colors.onSurface },
  label: { fontWeight: '600', color: colors.onSurface },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, color: colors.onSurface },
  pmBtn: { flex: 1, borderWidth: 1, borderColor: colors.border, padding: 10, borderRadius: radius.pill, alignItems: 'center' },
  pmTxt: { color: colors.onSurface, fontSize: 12 },
  summary: { backgroundColor: '#fff', padding: spacing.md, borderRadius: radius.md, ...shadow.sm },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.sm },
  deliveryNote: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.brandLight, padding: spacing.sm, paddingHorizontal: spacing.md, borderRadius: radius.md },
  deliveryNoteText: { color: colors.brandDark, fontSize: 12, flex: 1 },
  checkout: { backgroundColor: colors.brand, padding: spacing.md, borderRadius: radius.pill, alignItems: 'center', marginTop: spacing.sm },
  checkoutText: { color: '#fff', fontWeight: '600', fontSize: 15 },
});
