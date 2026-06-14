import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, ActivityIndicator, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing, radius, shadow } from '@/src/theme';

const STORAGE_KEY = 'nearify_addresses';

interface Address {
  id: string;
  label: string;
  address: string;
  latitude?: number;
  longitude?: number;
  isDefault?: boolean;
}

export default function Addresses() {
  const router = useRouter();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [label, setLabel] = useState('');
  const [addressText, setAddressText] = useState('');
  const [gpsLoading, setGpsLoading] = useState(false);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  useEffect(() => {
    loadAddresses();
  }, []);

  const loadAddresses = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setAddresses(JSON.parse(stored));
      }
    } catch (e) {
      console.warn('Failed to load addresses', e);
    } finally {
      setLoading(false);
    }
  };

  const saveAddresses = async (newAddresses: Address[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newAddresses));
      setAddresses(newAddresses);
    } catch (e) {
      console.warn('Failed to save addresses', e);
    }
  };

  const getGPSLocation = async () => {
    setGpsLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Izin Ditolak', 'Mohon izinkan akses lokasi untuk menggunakan GPS');
        setGpsLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setLatitude(location.coords.latitude);
      setLongitude(location.coords.longitude);

      // Reverse geocode to get address
      const geocode = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (geocode.length > 0) {
        const loc = geocode[0];
        const parts = [
          loc.street,
          loc.streetNumber,
          loc.district,
          loc.subregion,
          loc.city,
          loc.region,
          loc.postalCode,
        ].filter(Boolean);
        setAddressText(parts.join(', '));
      }
    } catch (e) {
      Alert.alert('Error', 'Gagal mendapatkan lokasi. Pastikan GPS aktif.');
      console.warn(e);
    } finally {
      setGpsLoading(false);
    }
  };

  const handleSave = () => {
    if (!label.trim() || !addressText.trim()) {
      Alert.alert('Error', 'Label dan alamat wajib diisi');
      return;
    }

    const newAddress: Address = {
      id: editingAddress?.id || Date.now().toString(),
      label: label.trim(),
      address: addressText.trim(),
      latitude: latitude || undefined,
      longitude: longitude || undefined,
      isDefault: addresses.length === 0,
    };

    let updated;
    if (editingAddress) {
      updated = addresses.map(a => a.id === editingAddress.id ? newAddress : a);
    } else {
      updated = [...addresses, newAddress];
    }

    saveAddresses(updated);
    resetForm();
  };

  const handleDelete = (id: string) => {
    Alert.alert('Hapus Alamat', 'Yakin ingin menghapus alamat ini?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: () => {
          const updated = addresses.filter(a => a.id !== id);
          saveAddresses(updated);
        },
      },
    ]);
  };

  const handleEdit = (address: Address) => {
    setEditingAddress(address);
    setLabel(address.label);
    setAddressText(address.address);
    setLatitude(address.latitude || null);
    setLongitude(address.longitude || null);
    setShowForm(true);
  };

  const setAsDefault = (id: string) => {
    const updated = addresses.map(a => ({ ...a, isDefault: a.id === id }));
    saveAddresses(updated);
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingAddress(null);
    setLabel('');
    setAddressText('');
    setLatitude(null);
    setLongitude(null);
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
        <Text style={styles.title}>Alamat Tersimpan</Text>
        <View style={{ width: 26 }} />
      </View>

      {showForm ? (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: spacing.lg }}>
          <Text style={styles.formTitle}>{editingAddress ? 'Edit Alamat' : 'Tambah Alamat Baru'}</Text>

          <Text style={styles.label}>Label</Text>
          <TextInput
            style={styles.input}
            placeholder="Mis: Rumah, Kost, Kantor"
            value={label}
            onChangeText={setLabel}
            placeholderTextColor={colors.muted}
          />

          <Text style={styles.label}>Alamat Lengkap</Text>
          <TextInput
            style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
            placeholder="Masukkan alamat lengkap..."
            value={addressText}
            onChangeText={setAddressText}
            placeholderTextColor={colors.muted}
            multiline
          />

          <Pressable style={styles.gpsBtn} onPress={getGPSLocation} disabled={gpsLoading}>
            {gpsLoading ? (
              <ActivityIndicator size="small" color={colors.brand} />
            ) : (
              <>
                <Ionicons name="locate" size={20} color={colors.brand} />
                <Text style={styles.gpsBtnText}>Gunakan Lokasi GPS Saya</Text>
              </>
            )}
          </Pressable>

          {latitude && longitude && (
            <View style={styles.coordsInfo}>
              <Ionicons name="checkmark-circle" size={16} color="#10B981" />
              <Text style={styles.coordsText}>Koordinat GPS tersimpan</Text>
            </View>
          )}

          <View style={styles.formActions}>
            <Pressable style={styles.cancelBtn} onPress={resetForm}>
              <Text style={styles.cancelBtnText}>Batal</Text>
            </Pressable>
            <Pressable style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveBtnText}>Simpan</Text>
            </Pressable>
          </View>
        </ScrollView>
      ) : (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: spacing.lg }}>
          {addresses.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="location-outline" size={48} color={colors.muted} />
              <Text style={styles.emptyText}>Belum ada alamat tersimpan</Text>
              <Text style={styles.emptySubText}>Tambahkan alamat untuk mempermudah pesanan</Text>
            </View>
          ) : (
            addresses.map(addr => (
              <View key={addr.id} style={styles.addressCard}>
                <View style={styles.addressHeader}>
                  <View style={styles.labelBadge}>
                    <Text style={styles.labelBadgeText}>{addr.label}</Text>
                  </View>
                  {addr.isDefault && (
                    <View style={styles.defaultBadge}>
                      <Text style={styles.defaultBadgeText}>Utama</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.addressText}>{addr.address}</Text>
                {addr.latitude && addr.longitude && (
                  <View style={styles.gpsIndicator}>
                    <Ionicons name="locate" size={12} color={colors.brand} />
                    <Text style={styles.gpsText}>Dengan koordinat GPS</Text>
                  </View>
                )}
                <View style={styles.addressActions}>
                  {!addr.isDefault && (
                    <Pressable style={styles.actionBtn} onPress={() => setAsDefault(addr.id)}>
                      <Ionicons name="star-outline" size={16} color={colors.brand} />
                      <Text style={styles.actionBtnText}>Jadikan Utama</Text>
                    </Pressable>
                  )}
                  <Pressable style={styles.actionBtn} onPress={() => handleEdit(addr)}>
                    <Ionicons name="create-outline" size={16} color={colors.brand} />
                    <Text style={styles.actionBtnText}>Edit</Text>
                  </Pressable>
                  <Pressable style={styles.actionBtn} onPress={() => handleDelete(addr.id)}>
                    <Ionicons name="trash-outline" size={16} color={colors.error} />
                    <Text style={[styles.actionBtnText, { color: colors.error }]}>Hapus</Text>
                  </Pressable>
                </View>
              </View>
            ))
          )}

          <Pressable style={styles.addBtn} onPress={() => setShowForm(true)}>
            <Ionicons name="add" size={22} color="#fff" />
            <Text style={styles.addBtnText}>Tambah Alamat Baru</Text>
          </Pressable>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: colors.border },
  title: { fontSize: 16, fontWeight: '600' },
  formTitle: { fontSize: 18, fontWeight: '600', marginBottom: spacing.lg, color: colors.onSurface },
  label: { fontWeight: '600', color: colors.onSurface, marginBottom: spacing.xs, marginTop: spacing.md },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, backgroundColor: '#fff', color: colors.onSurface, fontSize: 14 },
  gpsBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.brand, marginTop: spacing.lg },
  gpsBtnText: { color: colors.brand, fontWeight: '600' },
  coordsInfo: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing.sm },
  coordsText: { color: '#10B981', fontSize: 13 },
  formActions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xl },
  cancelBtn: { flex: 1, padding: spacing.md, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  cancelBtnText: { color: colors.onSurface, fontWeight: '600' },
  saveBtn: { flex: 1, padding: spacing.md, borderRadius: radius.pill, backgroundColor: colors.brand, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '600' },
  emptyContainer: { alignItems: 'center', paddingTop: 60 },
  emptyText: { color: colors.onSurface, fontWeight: '600', marginTop: spacing.md },
  emptySubText: { color: colors.muted, marginTop: 4, textAlign: 'center' },
  addressCard: { backgroundColor: '#fff', padding: spacing.md, borderRadius: radius.md, marginBottom: spacing.md, ...shadow.sm },
  addressHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  labelBadge: { backgroundColor: colors.brandLight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  labelBadgeText: { color: colors.brandDark, fontSize: 12, fontWeight: '600' },
  defaultBadge: { backgroundColor: '#10B981', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  defaultBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  addressText: { color: colors.onSurface, lineHeight: 20 },
  gpsIndicator: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  gpsText: { color: colors.brand, fontSize: 11 },
  addressActions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionBtnText: { color: colors.brand, fontSize: 12 },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.brand, padding: spacing.md, borderRadius: radius.pill, marginTop: spacing.md },
  addBtnText: { color: '#fff', fontWeight: '600' },
});
