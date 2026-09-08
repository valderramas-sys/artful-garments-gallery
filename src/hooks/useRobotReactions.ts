import { useEffect, useRef } from "react";
import { useCartStore, cartCount } from "@/stores/cartStore";
import { reactRobot } from "@/stores/robotStore";

// Quantidade total a partir da qual o robô passa a comentar que o carrinho
// está "crescendo" em vez de reagir com a felicidade padrão.
const CART_GROWING_THRESHOLD = 4;

// Tempo parado com itens no carrinho antes do robô comentar (uma única vez
// por sessão) — nunca deve virar pop-up insistente.
const ABANDONED_CART_MS = 90_000;

/**
 * Observa o carrinho (via zustand, sem re-render) e a inatividade do usuário
 * para acionar as reações do robô descritas nas seções 19–23 do briefing:
 * produto adicionado, produto removido e "carrinho abandonado".
 *
 * Deve ser montado uma única vez, próximo à raiz do app.
 */
export function useRobotReactions() {
  const previousCount = useRef<number | null>(null);
  const abandonedTimer = useRef<number | undefined>(undefined);
  const hasPromptedAbandon = useRef(false);

  useEffect(() => {
    const armAbandonTimer = (count: number) => {
      if (abandonedTimer.current) window.clearTimeout(abandonedTimer.current);
      if (count === 0 || hasPromptedAbandon.current) return;
      abandonedTimer.current = window.setTimeout(() => {
        hasPromptedAbandon.current = true;
        reactRobot("curious");
      }, ABANDONED_CART_MS);
    };

    // Estado inicial (ex.: carrinho restaurado do localStorage).
    previousCount.current = cartCount(useCartStore.getState().lines);
    armAbandonTimer(previousCount.current);

    const unsubscribe = useCartStore.subscribe((s) => {
      const count = cartCount(s.lines);
      const previous = previousCount.current ?? count;
      previousCount.current = count;

      if (count > previous) {
        reactRobot(count >= CART_GROWING_THRESHOLD ? "surprised" : "happy");
      } else if (count < previous) {
        reactRobot("angry");
      }

      // A marca NÃO é zerada aqui. Zerá-la rearmava o lembrete a cada mexida no
      // carrinho, o que contradizia o "uma única vez por sessão" logo acima: em
      // uma visita longa ele cutucava várias vezes.
      armAbandonTimer(count);
    });

    return () => {
      unsubscribe();
      if (abandonedTimer.current) window.clearTimeout(abandonedTimer.current);
    };
  }, []);
}
