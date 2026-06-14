import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { Alert } from 'react-native';

import { useIconFonts } from '@/src/hooks/use-icon-fonts';
import { AuthProvider } from '@/src/auth';
import { CartProvider } from '@/src/cart';
import { ToastProvider } from '../src/toast';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useIconFonts();

  useEffect(() => {
    if (loaded || error) SplashScreen.hideAsync();
  }, [loaded, error]);

  // Request GPS permission on app start
  useEffect(() => {
    const requestLocationPermission = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'Izin Lokasi',
            'Nearify membutuhkan akses lokasi untuk menghitung ongkos kirim dan menampilkan tempat terdekat. Anda dapat mengaktifkannya di pengaturan.',
            [{ text: 'OK' }]
          );
        }
      } catch (e) {
        console.warn('Location permission request failed:', e);
      }
    };
    requestLocationPermission();
  }, []);

  if (!loaded && !error) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <CartProvider>
            <ToastProvider>
              <StatusBar style="light" />
              <Stack screenOptions={{ headerShown: false, animation: 'fade' }} />
            </ToastProvider>
          </CartProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
