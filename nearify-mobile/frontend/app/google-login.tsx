import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Pressable, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';

import { colors, gradient, spacing } from '@/src/theme';
import { useAuth } from '@/src/auth';
import { useToast } from '../src/toast';

WebBrowser.maybeCompleteAuthSession();

const FRONTEND = process.env.EXPO_PUBLIC_BACKEND_URL || '';
const REDIRECT_URL = FRONTEND + '/google-callback';
const AUTH_URL = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(REDIRECT_URL)}`;

export default function GoogleLogin() {
  const router = useRouter();
  const { loginWithGoogleSession } = useAuth();
  const toast = useToast();
  const [err, setErr] = useState<string | null>(null);
  const handled = useRef(false);

  useEffect(() => {
    const run = async () => {
      if (handled.current) return;
      handled.current = true;

      if (Platform.OS === 'web') {
        // Open popup window inside the same browser tab; the app stays mounted.
        const w = 480, h = 640;
        const left = ((globalThis as any).screen?.width || w) / 2 - w / 2;
        const top = ((globalThis as any).screen?.height || h) / 2 - h / 2;
        const popup = (globalThis as any).open(
          AUTH_URL, 'nearify_google',
          `width=${w},height=${h},left=${left},top=${top},resizable=yes,scrollbars=yes`,
        );
        if (!popup) { setErr('Popup diblokir browser. Izinkan popup lalu coba lagi.'); return; }

        const timer = setInterval(async () => {
          try {
            if (popup.closed) { clearInterval(timer); router.back(); return; }
            const href = popup.location?.href || '';
            if (href && href.includes('/google-callback')) {
              const hash = href.split('#')[1] || href.split('?')[1] || '';
              const sid = new URLSearchParams(hash).get('session_id');
              if (sid) {
                clearInterval(timer);
                popup.close();
                try {
                  await loginWithGoogleSession(sid);
                  toast.show('Berhasil masuk dengan Google', 'success');
                  router.replace('/(app)');
                } catch (e: any) {
                  setErr(e?.message || 'Login gagal');
                }
              }
            }
          } catch { /* cross-origin while on emergent domain – ignore */ }
        }, 400);
        return;
      }

      // Native: in-app auth session (stays inside the app)
      try {
        const result = await WebBrowser.openAuthSessionAsync(AUTH_URL, REDIRECT_URL, { showInRecents: false });
        if (result.type === 'success' && result.url) {
          const hash = result.url.split('#')[1] || result.url.split('?')[1] || '';
          const sid = new URLSearchParams(hash).get('session_id');
          if (sid) {
            await loginWithGoogleSession(sid);
            toast.show('Berhasil masuk dengan Google', 'success');
            router.replace('/(app)');
            return;
          }
          setErr('Sesi Google tidak ditemukan');
        } else {
          router.back();
        }
      } catch (e: any) { setErr(e?.message || 'Login gagal'); }
    };
    run();
  }, [loginWithGoogleSession, router, toast]);

  return (
    <LinearGradient colors={gradient.brand} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={{ padding: spacing.md }}>
          <Ionicons name="chevron-back" size={28} color="#fff" />
        </Pressable>
        <View style={styles.center}>
          <ActivityIndicator color="#fff" size="large" />
          <Text style={styles.t}>Menghubungkan ke Google…</Text>
          <Text style={styles.hint}>Selesaikan login di jendela yang muncul. Halaman ini akan otomatis berlanjut.</Text>
          {err && <Text style={styles.err} testID="google-err">{err}</Text>}
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, paddingHorizontal: spacing.lg },
  t: { color: '#fff', fontSize: 16, fontWeight: '500' },
  hint: { color: 'rgba(255,255,255,0.75)', fontSize: 13, textAlign: 'center', maxWidth: 280 },
  err: { color: '#fff', backgroundColor: colors.error, padding: spacing.sm, borderRadius: 8, textAlign: 'center' },
});
