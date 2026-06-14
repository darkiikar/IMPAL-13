import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, shadow } from '@/src/theme';

const FAQ_DATA = [
  {
    category: 'Umum',
    items: [
      {
        q: 'Apa itu Nearify?',
        a: 'Nearify adalah aplikasi super app untuk mahasiswa dan warga Purwokerto yang menyediakan layanan pesan makanan, cari kost, dan laundry dalam satu aplikasi.',
      },
      {
        q: 'Apakah Nearify gratis?',
        a: 'Ya, mengunduh dan menggunakan aplikasi Nearify sepenuhnya gratis. Anda hanya membayar untuk produk atau layanan yang Anda pesan.',
      },
      {
        q: 'Bagaimana cara menghubungi customer service?',
        a: 'Anda dapat menghubungi kami melalui WhatsApp di nomor 081234567890 atau email ke support@nearify.id',
      },
    ],
  },
  {
    category: 'Nearify Food',
    items: [
      {
        q: 'Bagaimana cara memesan makanan?',
        a: 'Pilih menu Food di halaman utama, pilih restoran, pilih menu yang diinginkan, tambahkan ke keranjang, lalu checkout dengan mengisi alamat pengiriman.',
      },
      {
        q: 'Berapa biaya ongkos kirim?',
        a: 'Biaya ongkos kirim bervariasi tergantung jarak, mulai dari Rp 3.000 - Rp 10.000 untuk area Purwokerto.',
      },
      {
        q: 'Berapa lama waktu pengiriman?',
        a: 'Estimasi waktu pengiriman 15-45 menit tergantung jarak dan kondisi lalu lintas.',
      },
    ],
  },
  {
    category: 'Nearify Laundry',
    items: [
      {
        q: 'Bagaimana cara menggunakan layanan laundry?',
        a: 'Pilih menu Laundry, pilih tempat laundry, pilih jenis layanan, isi alamat penjemputan dan waktu, lalu submit pesanan. Pihak laundry akan menjemput pakaian Anda.',
      },
      {
        q: 'Kapan pakaian saya selesai?',
        a: 'Waktu penyelesaian tergantung jenis layanan. Regular 2-3 hari, Express 6 jam.',
      },
      {
        q: 'Bagaimana cara mengetahui harga total?',
        a: 'Harga total akan dihitung setelah pihak laundry menimbang pakaian Anda. Anda akan mendapat notifikasi konfirmasi harga.',
      },
    ],
  },
  {
    category: 'Nearify Kost',
    items: [
      {
        q: 'Bagaimana cara mencari kost?',
        a: 'Pilih menu Kost, gunakan filter untuk memilih lokasi, tipe (putra/putri/campur), dan budget yang sesuai.',
      },
      {
        q: 'Bagaimana cara booking kost?',
        a: 'Setelah menemukan kost yang sesuai, Anda dapat langsung menghubungi pemilik kost melalui WhatsApp yang tersedia di halaman detail.',
      },
      {
        q: 'Apakah harga kost sudah termasuk fasilitas?',
        a: 'Informasi fasilitas yang termasuk dalam harga dapat dilihat di halaman detail masing-masing kost.',
      },
    ],
  },
  {
    category: 'Pembayaran',
    items: [
      {
        q: 'Metode pembayaran apa saja yang tersedia?',
        a: 'Saat ini kami mendukung pembayaran melalui QRIS, Transfer Bank, dan Cash on Delivery (COD).',
      },
      {
        q: 'Apakah pembayaran aman?',
        a: 'Ya, semua transaksi pembayaran diproses melalui gateway pembayaran yang aman dan terenkripsi.',
      },
    ],
  },
];

interface FAQItemProps {
  q: string;
  a: string;
}

function FAQItem({ q, a }: FAQItemProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Pressable style={styles.faqItem} onPress={() => setExpanded(!expanded)}>
      <View style={styles.faqHeader}>
        <Text style={styles.question}>{q}</Text>
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={20} color={colors.brand} />
      </View>
      {expanded && <Text style={styles.answer}>{a}</Text>}
    </Pressable>
  );
}

export default function FAQ() {
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surface }} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={26} color={colors.onSurface} />
        </Pressable>
        <Text style={styles.title}>Bantuan & FAQ</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: spacing.lg, paddingBottom: 100 }}>
        <View style={styles.contactCard}>
          <Ionicons name="headset-outline" size={32} color={colors.brand} />
          <View style={{ flex: 1, marginLeft: spacing.md }}>
            <Text style={styles.contactTitle}>Butuh Bantuan Langsung?</Text>
            <Text style={styles.contactSubtitle}>Tim support kami siap membantu 24/7</Text>
          </View>
          <Pressable style={styles.contactBtn}>
            <Ionicons name="logo-whatsapp" size={20} color="#fff" />
          </Pressable>
        </View>

        {FAQ_DATA.map((section, idx) => (
          <View key={idx}>
            <Text style={styles.categoryTitle}>{section.category}</Text>
            <View style={styles.faqContainer}>
              {section.items.map((item, i) => (
                <FAQItem key={i} q={item.q} a={item.a} />
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: colors.border },
  title: { fontSize: 16, fontWeight: '600' },
  contactCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.brandLight, padding: spacing.lg, borderRadius: radius.lg, marginBottom: spacing.lg },
  contactTitle: { fontWeight: '600', color: colors.brandDark },
  contactSubtitle: { color: colors.brand, fontSize: 12, marginTop: 2 },
  contactBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#25D366', alignItems: 'center', justifyContent: 'center' },
  categoryTitle: { fontSize: 16, fontWeight: '600', color: colors.onSurface, marginTop: spacing.lg, marginBottom: spacing.sm },
  faqContainer: { backgroundColor: '#fff', borderRadius: radius.lg, ...shadow.sm, overflow: 'hidden' },
  faqItem: { padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  faqHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  question: { fontWeight: '500', color: colors.onSurface, flex: 1, marginRight: spacing.sm },
  answer: { color: colors.muted, marginTop: spacing.sm, lineHeight: 20 },
});
