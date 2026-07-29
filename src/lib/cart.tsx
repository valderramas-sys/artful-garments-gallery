import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { cartCount, cartSubtotal, useCartStore } from "@/stores/cartStore";

type CartUIValue = {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  count: number;
  subtotal: number;
  currencyCode: string;
};

const CartContext = createContext<CartUIValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const lines = useCartStore((s) => s.lines);

  const value = useMemo<CartUIValue>(
    () => ({
      isOpen,
      open: () => setIsOpen(true),
      close: () => setIsOpen(false),
      count: cartCount(lines),
      subtotal: cartSubtotal(lines),
      currencyCode: lines[0]?.currencyCode ?? "BRL",
    }),
    [isOpen, lines],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
