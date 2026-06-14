import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';

// This page is the redirect target for the Google popup window.
// It captures the session_id from URL hash and notifies the opener, then closes.
export default function GoogleCallback() {
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    try {
      const hash = (globalThis as any).location?.hash || '';
      const sp = new URLSearchParams(hash.replace(/^#/, ''));
      const sid = sp.get('session_id');
      const opener = (globalThis as any).opener;
      if (sid && opener) {
        // The opener polls our URL, so just keep this window open briefly.
        setTimeout(() => { try { (globalThis as any).close(); } catch {} }, 200);
      }
    } catch { /* noop */ }
  }, []);

  return (
    <View style={styles.c}>
      <Text style={styles.t}>Sedang menyelesaikan login Google…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  c: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0B1B3D' },
  t: { color: '#fff', fontSize: 16 },
});
