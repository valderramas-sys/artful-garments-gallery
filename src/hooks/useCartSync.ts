import { useEffect } from "react";
import { useCartStore } from "@/stores/cartStore";

/** Re-fetch the Shopify cart when the tab regains focus (checkout may have completed elsewhere). */
export function useCartSync() {
  const syncCart = useCartStore((s) => s.syncCart);

  useEffect(() => {
    syncCart();
    const onVisible = () => {
      if (document.visibilityState === "visible") syncCart();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [syncCart]);
}
