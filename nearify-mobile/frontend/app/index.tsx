import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, Redirect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';

import { colors, gradient, spacing, radius, shadow } from '@/src/theme';
import { useAuth } from '@/src/auth';

const LOGO_URI = 'https://customer-assets.emergentagent.com/job_f7d0d890-8dfa-4d93-a2d4-7e78bdbaf469/artifacts/6f870qg3_Logo%20icon%20nearify.svg';

export default function Splash() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/restaurants`).catch(() => {});
  }, []);

  if (loading) {
    return (
      <LinearGradient colors={gradient.brand} style={styles.full}>
        <ActivityIndicator color="#fff" size="large" />
      </LinearGradient>
    );
  }

  if (user) return <Redirect href="/(app)" />;

  const press = (path: '/login' | '/register' | '/google-login') => () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    router.push(path);
  };

  return (
    <LinearGradient colors={gradient.brand} style={styles.full}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.logoWrap}>
          <Image source={{ uri: LOGO_URI }} style={styles.logoImg} contentFit="contain" />
          <Text style={styles.tagline}>Tempatnya Mahasiswa</Text>
        </View>

        <View style={styles.ctaWrap}>
          <Pressable
            onPress={press('/login')}
            testID="splash-login-btn"
            style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] }]}
          >
            <Text style={styles.primaryBtnText}>Masuk</Text>
            <Ionicons name="arrow-forward" size={18} color={colors.navy} />
          </Pressable>

          <Pressable
            onPress={press('/register')}
            testID="splash-signup-btn"
            style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] }]}
          >
            <Text style={styles.secondaryBtnText}>Daftar Akun Baru</Text>
          </Pressable>

          <Text style={styles.version}>V 1.00</Text>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  full: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  safe: { flex: 1, justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.xl, width: '100%' },
  logoWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  logoImg: { width: 240, height: 240 },
  tagline: { fontSize: 14, color: 'rgba(255,255,255,0.85)', marginTop: spacing.sm, letterSpacing: 2 },
  ctaWrap: { width: '100%', paddingHorizontal: spacing.lg, gap: 12, alignItems: 'stretch' },
  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#fff', paddingVertical: 16, borderRadius: radius.pill,
    ...shadow.md,
  },
  primaryBtnText: { color: colors.navy, fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },
  secondaryBtn: {
    paddingVertical: 16, borderRadius: radius.pill, alignItems: 'center',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.6)',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  secondaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '600', letterSpacing: 0.3 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 4 },
  divider: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.3)' },
  dividerText: { color: 'rgba(255,255,255,0.85)', fontSize: 12 },
  googleBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12,
    backgroundColor: '#fff', paddingVertical: 14, borderRadius: radius.pill,
    ...shadow.sm,
  },
  googleIconBox: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  googleG: { color: '#4285F4', fontWeight: '700', fontSize: 16, includeFontPadding: false, marginTop: -2 },
  googleText: { color: '#1F2937', fontSize: 15, fontWeight: '600' },
  version: { color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: spacing.md, textAlign: 'center' },
});
