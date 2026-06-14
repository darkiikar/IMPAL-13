// Nearify design tokens
export const colors = {
  surface: '#F8FAFC',
  surfaceSecondary: '#FFFFFF',
  surfaceTertiary: '#F1F5F9',
  onSurface: '#1E293B',
  onSurfaceSecondary: '#0F172A',
  muted: '#64748B',
  brand: '#00A896',
  brandDark: '#007A6D',
  brandLight: '#E6F6F4',
  navy: '#0B1B3D',
  navyMid: '#05626A',
  white: '#FFFFFF',
  border: '#E2E8F0',
  borderStrong: '#CBD5E1',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  glassWhite: 'rgba(255,255,255,0.18)',
  glassBorder: 'rgba(255,255,255,0.30)',
};

export const gradient = {
  brand: ['#0B1B3D', '#05626A', '#00A896'] as const,
  brandSoft: ['#E6F6F4', '#FFFFFF'] as const,
  brandReverse: ['#00A896', '#05626A', '#0B1B3D'] as const,
};

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 40, xxxl: 48 };
export const radius = { sm: 8, md: 16, lg: 24, xl: 28, pill: 999 };

export const shadow = {
  sm: {
    shadowColor: '#0B1B3D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  md: {
    shadowColor: '#0B1B3D',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 4,
  },
};

export const formatIDR = (n: number) => `Rp${(n || 0).toLocaleString('id-ID')}`;
