import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';

export type CartItem = {
  menu_item_id: string;
  name: string;
  price: number;
  qty: number;
  image?: string;
};

type Ctx = {
  restaurantId: string | null;
  restaurantName: string | null;
  items: CartItem[];
  add: (rid: string, rname: string, item: Omit<CartItem, 'qty'>) => void;
  remove: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
  subtotal: number;
  count: number;
};

const C = createContext<Ctx | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [restaurantId, setRid] = useState<string | null>(null);
  const [restaurantName, setRname] = useState<string | null>(null);
  const [items, setItems] = useState<CartItem[]>([]);

  const add: Ctx['add'] = useCallback((rid, rname, item) => {
    setItems(prev => {
      if (restaurantId && restaurantId !== rid) {
        setRid(rid); setRname(rname);
        return [{ ...item, qty: 1 }];
      }
      if (!restaurantId) { setRid(rid); setRname(rname); }
      const existing = prev.find(p => p.menu_item_id === item.menu_item_id);
      if (existing) return prev.map(p => p.menu_item_id === item.menu_item_id ? { ...p, qty: p.qty + 1 } : p);
      return [...prev, { ...item, qty: 1 }];
    });
  }, [restaurantId]);

  const remove = useCallback((id: string) => {
    setItems(prev => prev.filter(p => p.menu_item_id !== id));
  }, []);

  const setQty = useCallback((id: string, qty: number) => {
    setItems(prev => qty <= 0 ? prev.filter(p => p.menu_item_id !== id) : prev.map(p => p.menu_item_id === id ? { ...p, qty } : p));
  }, []);

  const clear = useCallback(() => { setItems([]); setRid(null); setRname(null); }, []);

  const subtotal = useMemo(() => items.reduce((s, i) => s + i.price * i.qty, 0), [items]);
  const count = useMemo(() => items.reduce((s, i) => s + i.qty, 0), [items]);

  return <C.Provider value={{ restaurantId, restaurantName, items, add, remove, setQty, clear, subtotal, count }}>{children}</C.Provider>;
}

export const useCart = () => {
  const c = useContext(C);
  if (!c) throw new Error('useCart needs CartProvider');
  return c;
};
