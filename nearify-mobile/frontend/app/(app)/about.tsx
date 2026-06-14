import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Linking, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, radius, shadow, gradient } from '@/src/theme';

const APP_VERSION = '1.0.0';

export default function About() {
  const router = useRouter();

  const handleLink = (url: string) => {
    Linking.openURL(url);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surface }} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={26} color={colors.onSurface} />
        </Pressable>
        <Text style={styles.title}>Tentang Nearify</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Hero */}
        <LinearGradient colors={gradient.brand} style={styles.hero}>
          <View style={styles.logoContainer}>
            <Ionicons name="location" size={40} color="#fff" />
          </View>
          <Text style={styles.appName}>Nearify</Text>
          <Text style={styles.tagline}>Super App untuk Purwokerto</Text>
          <Text style={styles.version}>Versi {APP_VERSION}</Text>
        </LinearGradient>

        <View style={{ padding: spacing.lg }}>
          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tentang Kami</Text>
            <Text style={styles.description}>
              Nearify adalah aplikasi super app yang dirancang khusus untuk memenuhi kebutuhan mahasiswa dan warga Purwokerto. Kami menyediakan berbagai layanan dalam satu aplikasi yang terintegrasi.
            </Text>
            <Text style={styles.description}>
              Dengan Nearify, Anda dapat dengan mudah memesan makanan dari restoran favorit, mencari kost yang sesuai kebutuhan, dan menggunakan layanan laundry tanpa repot.
            </Text>
          </View>

          {/* Services */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Layanan Kami</Text>
            <View style={styles.servicesGrid}>
              <View style={styles.serviceItem}>
                <View style={[styles.serviceIcon, { backgroundColor: '#FB923C20' }]}>
                  <Ionicons name="restaurant" size={24} color="#FB923C" />
                </View>
                <Text style={styles.serviceName}>Nearify Food</Text>
                <Text style={styles.serviceDesc}>Pesan makanan dari berbagai restoran</Text>
              </View>
              <View style={styles.serviceItem}>
                <View style={[styles.serviceIcon, { backgroundColor: '#06B6D420' }]}>
                  <Ionicons name="shirt" size={24} color="#06B6D4" />
                </View>
                <Text style={styles.serviceName}>Nearify Laundry</Text>
                <Text style={styles.serviceDesc}>Layanan cuci pakaian praktis</Text>
              </View>
              <View style={styles.serviceItem}>
                <View style={[styles.serviceIcon, { backgroundColor: '#8B5CF620' }]}>
                  <Ionicons name="bed" size={24} color="#8B5CF6" />
                </View>
                <Text style={styles.serviceName}>Nearify Kost</Text>
                <Text style={styles.serviceDesc}>Temukan kost impian Anda</Text>
              </View>
              <View style={styles.serviceItem}>
                <View style={[styles.serviceIcon, { backgroundColor: '#0EA5E920' }]}>
                  <Ionicons name="book" size={24} color="#0EA5E9" />
                </View>
                <Text style={styles.serviceName}>Al-Quran</Text>
                <Text style={styles.serviceDesc}>Baca Al-Quran digital</Text>
              </View>
            </View>
          </View>

          {/* Contact */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Hubungi Kami</Text>
            <View style={styles.contactList}>
              <Pressable style={styles.contactItem} onPress={() => handleLink('mailto:support@nearify.id')}>
                <Ionicons name="mail-outline" size={20} color={colors.brand} />
                <Text style={styles.contactText}>support@nearify.id</Text>
                <Ionicons name="open-outline" size={16} color={colors.muted} />
              </Pressable>
              <Pressable style={styles.contactItem} onPress={() => handleLink('https://wa.me/6281234567890')}>
                <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
                <Text style={styles.contactText}>+62 812-3456-7890</Text>
                <Ionicons name="open-outline" size={16} color={colors.muted} />
              </Pressable>
              <Pressable style={styles.contactItem} onPress={() => handleLink('https://instagram.com/nearify.id')}>
                <Ionicons name="logo-instagram" size={20} color="#E4405F" />
                <Text style={styles.contactText}>@nearify.id</Text>
                <Ionicons name="open-outline" size={16} color={colors.muted} />
              </Pressable>
            </View>
          </View>

          {/* Legal */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Legal</Text>
            <View style={styles.legalList}>
              <Pressable style={styles.legalItem}>
                <Text style={styles.legalText}>Syarat & Ketentuan</Text>
                <Ionicons name="chevron-forward" size={18} color={colors.muted} />
              </Pressable>
              <Pressable style={styles.legalItem}>
                <Text style={styles.legalText}>Kebijakan Privasi</Text>
                <Ionicons name="chevron-forward" size={18} color={colors.muted} />
              </Pressable>
            </View>
          </View>

          {/* Footer */}
          <Text style={styles.footer}>© 2026 Nearify. All rights reserved.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: colors.border },
  title: { fontSize: 16, fontWeight: '600' },
  hero: { alignItems: 'center', padding: spacing.xl, paddingTop: 40, paddingBottom: 40 },
  logoContainer: { width: 80, height: 80, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  appName: { fontSize: 28, fontWeight: '700', color: '#fff' },
  tagline: { color: 'rgba(255,255,255,0.9)', marginTop: 4 },
  version: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 8 },
  section: { marginBottom: spacing.xl },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: colors.onSurface, marginBottom: spacing.md },
  description: { color: colors.muted, lineHeight: 22, marginBottom: spacing.sm },
  servicesGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  serviceItem: { width: '48%', backgroundColor: '#fff', padding: spacing.md, borderRadius: radius.md, marginBottom: spacing.md, ...shadow.sm },
  serviceIcon: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  serviceName: { fontWeight: '600', color: colors.onSurface, fontSize: 13 },
  serviceDesc: { color: colors.muted, fontSize: 11, marginTop: 2 },
  contactList: { backgroundColor: '#fff', borderRadius: radius.md, ...shadow.sm },
  contactItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  contactText: { flex: 1, color: colors.onSurface },
  legalList: { backgroundColor: '#fff', borderRadius: radius.md, ...shadow.sm },
  legalItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  legalText: { color: colors.onSurface },
  footer: { textAlign: 'center', color: colors.muted, marginTop: spacing.lg },
});
