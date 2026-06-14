import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { colors, spacing, radius, shadow } from '@/src/theme';
import { useAuth } from '@/src/auth';

export default function Profile() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const onLogout = async () => {
    await logout();
    router.replace('/');
  };

  const rows = [
    { icon: 'receipt-outline', label: 'Pesanan Saya', onPress: () => router.push('/(app)/pesanan') },
    { icon: 'heart-outline', label: 'Favorit', onPress: () => router.push('/(app)/favorites') },
    { icon: 'location-outline', label: 'Alamat Tersimpan', onPress: () => router.push('/(app)/addresses') },
    { icon: 'help-circle-outline', label: 'Bantuan & FAQ', onPress: () => router.push('/(app)/faq') },
    { icon: 'information-circle-outline', label: 'Tentang Nearify', onPress: () => router.push('/(app)/about') },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surface }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 100 }}>
        <View style={styles.headerCard}>
          <View style={styles.avatar}><Ionicons name="person" size={36} color="#fff" /></View>
          <Text style={styles.name} testID="profile-name">{user?.name}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          <View style={styles.providerBadge}><Text style={styles.providerText}>{user?.provider === 'google' ? 'Akun Google' : 'Akun Email'}</Text></View>
        </View>

        <View style={styles.menu}>
          {rows.map((r, i) => (
            <Pressable key={i} style={[styles.row, i < rows.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]} onPress={r.onPress}>
              <Ionicons name={r.icon as any} size={22} color={colors.brand} />
              <Text style={styles.rowText}>{r.label}</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.muted} />
            </Pressable>
          ))}
        </View>

        <Pressable testID="profile-logout-btn" style={styles.logoutBtn} onPress={onLogout}>
          <Ionicons name="log-out-outline" size={20} color={colors.error} />
          <Text style={styles.logoutText}>Keluar</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerCard: { alignItems: 'center', backgroundColor: '#fff', borderRadius: radius.lg, padding: spacing.lg, ...shadow.sm },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 18, fontWeight: '600', marginTop: spacing.md, color: colors.onSurface },
  email: { color: colors.muted, marginTop: 4 },
  providerBadge: { marginTop: spacing.sm, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: colors.brandLight },
  providerText: { fontSize: 11, color: colors.brandDark, fontWeight: '500' },
  menu: { backgroundColor: '#fff', borderRadius: radius.lg, marginTop: spacing.lg, ...shadow.sm },
  row: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, gap: spacing.md },
  rowText: { flex: 1, color: colors.onSurface, fontSize: 14 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: spacing.md, marginTop: spacing.lg, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.error + '40', backgroundColor: '#fff' },
  logoutText: { color: colors.error, fontWeight: '600' },
});
