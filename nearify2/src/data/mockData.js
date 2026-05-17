export const MOCK_USERS = [
  { id: 1, name: 'Fikar', email: 'fikar@email.com', password: 'password123', saldo: 100000, role: 'user' },
  { id: 2, name: 'Admin Nearify', email: 'admin@nearify.com', password: 'admin123', saldo: 0, role: 'admin' },
]

export const WARUNG_LIST = [
  {
    id: 1, name: 'Warung Bu Sari', category: 'Masakan Rumah',
    address: 'Jl. Kaliputih No. 12, Purwokerto', distance: '0,3 km', emoji: '🍱', bg: '#1e2a45', isOpen: true,
    menu: [
      { id: 101, name: 'Nasi Pecel',        price: 8000,  emoji: '🥗' },
      { id: 102, name: 'Nasi Sayur Lodeh',  price: 9000,  emoji: '🍲' },
      { id: 103, name: 'Tempe Goreng',       price: 3000,  emoji: '🟫' },
      { id: 104, name: 'Tahu Goreng',        price: 3000,  emoji: '🟡' },
      { id: 105, name: 'Es Teh Manis',       price: 3000,  emoji: '🧋' },
      { id: 106, name: 'Es Jeruk',           price: 4000,  emoji: '🍊' },
    ],
  },
  {
    id: 2, name: 'Warung Pak Budi', category: 'Nasi & Lauk',
    address: 'Jl. Overste Isdiman No. 5, Purwokerto', distance: '0,5 km', emoji: '🍛', bg: '#2a1a10', isOpen: true,
    menu: [
      { id: 201, name: 'Nasi Rames',         price: 10000, emoji: '🍛' },
      { id: 202, name: 'Nasi Goreng Biasa',  price: 12000, emoji: '🍳' },
      { id: 203, name: 'Ayam Goreng',        price: 13000, emoji: '🍗' },
      { id: 204, name: 'Lele Goreng',        price: 12000, emoji: '🐟' },
      { id: 205, name: 'Sayur Sop',          price: 5000,  emoji: '🥣' },
      { id: 206, name: 'Es Teh Manis',       price: 3000,  emoji: '🧋' },
    ],
  },
  {
    id: 3, name: 'Warung Mie Mbak Eni', category: 'Mie & Bakso',
    address: 'Jl. Kampus No. 8, Purwokerto', distance: '0,7 km', emoji: '🍜', bg: '#1a2a1a', isOpen: true,
    menu: [
      { id: 301, name: 'Mie Ayam Biasa',    price: 10000, emoji: '🍜' },
      { id: 302, name: 'Mie Ayam Bakso',    price: 13000, emoji: '🍜' },
      { id: 303, name: 'Bakso Biasa',       price: 10000, emoji: '🥣' },
      { id: 304, name: 'Bakso Urat',        price: 13000, emoji: '🥣' },
      { id: 305, name: 'Mie Goreng',        price: 12000, emoji: '🍝' },
      { id: 306, name: 'Es Teh',            price: 3000,  emoji: '🧋' },
    ],
  },
  {
    id: 4, name: 'Warung Soto Pak Hasan', category: 'Soto & Sup',
    address: 'Jl. Sudirman No. 22, Purwokerto', distance: '1,1 km', emoji: '🍲', bg: '#1a1a2e', isOpen: false,
    menu: [
      { id: 401, name: 'Soto Ayam',         price: 12000, emoji: '🍲' },
      { id: 402, name: 'Soto Daging',       price: 15000, emoji: '🍲' },
      { id: 403, name: 'Kerupuk',           price: 2000,  emoji: '🫓' },
      { id: 404, name: 'Es Teh',            price: 3000,  emoji: '🧋' },
    ],
  },
  {
    id: 5, name: 'Warung Pecel Bu Tini', category: 'Masakan Rumah',
    address: 'Jl. Cendrawasih No. 3, Purwokerto', distance: '0,4 km', emoji: '🥗', bg: '#1c2a1c', isOpen: true,
    menu: [
      { id: 501, name: 'Nasi Pecel Lengkap', price: 12000, emoji: '🥗' },
      { id: 502, name: 'Nasi Pecel Biasa',   price: 9000,  emoji: '🥗' },
      { id: 503, name: 'Tahu Tempe Bacem',   price: 4000,  emoji: '🟫' },
      { id: 504, name: 'Es Teh Manis',       price: 3000,  emoji: '🧋' },
    ],
  },
  {
    id: 6, name: 'Warung Nasi Goreng Mas Dedi', category: 'Nasi Goreng',
    address: 'Jl. dr. Angka No. 15, Purwokerto', distance: '0,8 km', emoji: '🍳', bg: '#2a2010', isOpen: true,
    menu: [
      { id: 601, name: 'Nasi Goreng Biasa',   price: 12000, emoji: '🍳' },
      { id: 602, name: 'Nasi Goreng Spesial', price: 15000, emoji: '🍳' },
      { id: 603, name: 'Nasi Goreng Seafood', price: 18000, emoji: '🦐' },
      { id: 604, name: 'Mie Goreng',          price: 12000, emoji: '🍝' },
      { id: 605, name: 'Es Teh',              price: 3000,  emoji: '🧋' },
    ],
  },
]

export const LAUNDRY_LIST = [
  {
    id: 1, name: 'Laundry 57 Unsoed',
    address: 'Jl. Cendrawasih No. 57, Purwokerto', distance: '0,6 km', emoji: '🫧', bg: '#1c2a1c', isOpen: true,
    services: [
      { id: 'cuci-setrika', name: 'Cuci + Setrika', pricePerKg: 7000 },
      { id: 'cuci-saja',    name: 'Cuci Saja',      pricePerKg: 5000 },
      { id: 'setrika-saja', name: 'Setrika Saja',   pricePerKg: 4000 },
    ],
  },
  {
    id: 2, name: 'Maxi Laundry',
    address: 'Jl. dr. Angka No. 10, Purwokerto', distance: '0,4 km', emoji: '🧺', bg: '#1a2a20', isOpen: true,
    services: [
      { id: 'cuci-setrika', name: 'Cuci + Setrika', pricePerKg: 8000 },
      { id: 'cuci-saja',    name: 'Cuci Saja',      pricePerKg: 6000 },
      { id: 'setrika-saja', name: 'Setrika Saja',   pricePerKg: 4000 },
    ],
  },
  {
    id: 3, name: 'Crystal Laundry',
    address: 'Jl. Overste Isdiman No. 9, Purwokerto', distance: '0,6 km', emoji: '✨', bg: '#1e1e2e', isOpen: true,
    services: [
      { id: 'cuci-setrika', name: 'Cuci + Setrika', pricePerKg: 7500 },
      { id: 'cuci-saja',    name: 'Cuci Saja',      pricePerKg: 5500 },
      { id: 'setrika-saja', name: 'Setrika Saja',   pricePerKg: 4000 },
    ],
  },
  {
    id: 4, name: 'Fresh Laundry',
    address: 'Jl. Kampus No. 3, Purwokerto', distance: '0,9 km', emoji: '👕', bg: '#1a1a30', isOpen: false,
    services: [
      { id: 'cuci-setrika', name: 'Cuci + Setrika', pricePerKg: 7000 },
      { id: 'cuci-saja',    name: 'Cuci Saja',      pricePerKg: 5000 },
    ],
  },
]

export const ORDER_STATUSES = [
  'Menunggu Konfirmasi',
  'Dikonfirmasi',
  'Sedang Diproses',
  'Sedang Diantar',
  'Selesai',
  'Dibatalkan',
]

export const formatRupiah = (amount) => {
  const num = Number(amount)
  if (isNaN(num)) return '0'
  return new Intl.NumberFormat('id-ID').format(num)
}
