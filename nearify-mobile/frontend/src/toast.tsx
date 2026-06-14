import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, shadow } from './theme';

type ToastKind = 'success' | 'error' | 'info';
type Toast = { id: number; msg: string; kind: ToastKind };

const Ctx = createContext<{ show: (msg: string, kind?: ToastKind) => void } | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<Toast | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const idRef = useRef(0);

  const show = useCallback((msg: string, kind: ToastKind = 'success') => {
    idRef.current += 1;
    const id = idRef.current;
    setToast({ id, msg, kind });
    Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    setTimeout(() => {
      Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true }).start(({ finished }) => {
        if (finished) setToast(t => (t?.id === id ? null : t));
      });
    }, 2500);
  }, [opacity]);

  const icon = toast?.kind === 'error' ? 'alert-circle' : toast?.kind === 'info' ? 'information-circle' : 'checkmark-circle';
  const accent = toast?.kind === 'error' ? colors.error : toast?.kind === 'info' ? colors.brand : colors.success;

  return (
    <Ctx.Provider value={{ show }}>
      {children}
      {toast && (
        <Animated.View pointerEvents="none" style={[styles.wrap, { opacity }]}>
          <View style={styles.toast} testID="toast">
            <Ionicons name={icon as any} size={20} color={accent} />
            <Text style={styles.msg}>{toast.msg}</Text>
          </View>
        </Animated.View>
      )}
    </Ctx.Provider>
  );
}

export const useToast = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error('useToast needs ToastProvider');
  return c;
};

const styles = StyleSheet.create({
  wrap: { position: 'absolute', top: 60, left: 0, right: 0, alignItems: 'center', zIndex: 9999 },
  toast: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 12, borderRadius: radius.pill, maxWidth: '90%', ...shadow.md, borderWidth: 1, borderColor: colors.border },
  msg: { color: colors.onSurface, fontSize: 14, fontWeight: '500' },
});
