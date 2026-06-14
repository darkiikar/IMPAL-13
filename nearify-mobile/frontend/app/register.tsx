import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { colors, gradient, spacing, radius } from '@/src/theme';
import { useAuth } from '@/src/auth';
import { useToast } from '../src/toast';

export default function Register() {
  const router = useRouter();
  const { register } = useAuth();
  const toast = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async () => {
    setErr(null);
    if (password.length < 6) { setErr('Password minimal 6 karakter'); return; }
    setBusy(true);
    try {
      await register(email.trim(), password, name.trim() || 'Pengguna');
      toast.show('Akun berhasil dibuat, selamat datang di Nearify', 'success');
      router.replace('/(app)');
    } catch (e: any) { setErr(e?.message || 'Pendaftaran gagal'); }
    finally { setBusy(false); }
  };

  return (
    <LinearGradient colors={gradient.brand} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            <Pressable onPress={() => router.back()} hitSlop={10}><Ionicons name="chevron-back" size={28} color="#fff" /></Pressable>
            <Text style={styles.title}>Daftar Akun</Text>
            <Text style={styles.subtitle}>Bergabung dengan komunitas Nearify Purwokerto</Text>

            <View style={styles.card}>
              <Text style={styles.label}>Nama</Text>
              <TextInput testID="register-name-input" value={name} onChangeText={setName} placeholder="Nama lengkap" style={styles.input} placeholderTextColor={colors.muted} />
              <Text style={styles.label}>Email</Text>
              <TextInput testID="register-email-input" value={email} onChangeText={setEmail} placeholder="kamu@email.com" autoCapitalize="none" keyboardType="email-address" style={styles.input} placeholderTextColor={colors.muted} />
              <Text style={styles.label}>Password</Text>
              <TextInput testID="register-password-input" value={password} onChangeText={setPassword} placeholder="Min. 6 karakter" secureTextEntry style={styles.input} placeholderTextColor={colors.muted} />
              {err && <Text style={styles.err} testID="register-error">{err}</Text>}
              <Pressable testID="register-submit-btn" style={styles.btn} onPress={onSubmit} disabled={busy}>
                {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Daftar Sekarang</Text>}
              </Pressable>
              <View style={styles.footer}>
                <Text style={{ color: colors.muted }}>Sudah punya akun? </Text>
                <Link href="/login" style={{ color: colors.brand, fontWeight: '600' }}>Masuk</Link>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.lg, flexGrow: 1 },
  title: { fontSize: 32, color: '#fff', fontWeight: '500', marginTop: spacing.lg },
  subtitle: { color: 'rgba(255,255,255,0.85)', marginTop: 4, marginBottom: spacing.lg },
  card: { backgroundColor: '#fff', borderRadius: radius.lg, padding: spacing.lg, marginTop: spacing.md },
  label: { color: colors.onSurface, fontWeight: '500', marginBottom: 6, marginTop: spacing.sm },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: 14, fontSize: 15, color: colors.onSurface },
  btn: { backgroundColor: colors.brand, paddingVertical: 16, borderRadius: radius.pill, alignItems: 'center', marginTop: spacing.lg },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.lg },
  err: { color: colors.error, marginTop: spacing.sm },
});
