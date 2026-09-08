import { useEffect, useState } from "react";

/**
 * GIF que sempre volta a tocar do primeiro quadro — depois de um refresh, de
 * uma restauração de bfcache, ou quando a aba volta a ficar visível no Safari
 * do iPhone. O arquivo não é tocado; só o elemento <img> é reprimido.
 *
 * A reinicialização precisa de uma URL DIFERENTE a cada vez, senão o decodificador
 * reaproveita o GIF já decodificado e o mantém congelado. Antes isso era um
 * `?p=N` na própria URL, o que funcionava — e cobrava um download inteiro por
 * reinício, porque para o navegador é outro recurso. Medido: o gif do robô
 * ocioso baixava três vezes numa única visita à página do produto.
 *
 * Aqui a foto é baixada UMA vez e vira um Blob; cada reinício é um
 * createObjectURL novo sobre o mesmo Blob. URL distinta, decodificador
 * reiniciado, zero bytes na rede.
 */

/** Um download por arquivo, compartilhado por todas as instâncias e estados do robô. */
const blobs = new Map<string, Promise<Blob | null>>();

function loadGif(src: string) {
  const hit = blobs.get(src);
  if (hit) return hit;
  const request = fetch(src)
    .then((response) => (response.ok ? response.blob() : null))
    .catch(() => null);
  blobs.set(src, request);
  return request;
}

export function AnimatedGif({
  src,
  className = "",
  fetchPriority,
}: {
  src: string;
  className?: string;
  fetchPriority?: "high" | "low" | "auto";
}) {
  // Começa na URL do arquivo: é o que o servidor renderiza, então a hidratação
  // casa. A troca para a blob: URL acontece depois, já no cliente.
  const [url, setUrl] = useState(src);

  useEffect(() => {
    let live = true;
    let current: string | null = null;
    // Ao trocar de estado (o robô muda de gif), volta para a URL do arquivo
    // enquanto o Blob do novo não chega: a limpeza abaixo já revogou a blob:
    // URL do estado anterior, e ficar apontando para ela seria imagem quebrada.
    setUrl(src);

    const restart = async () => {
      const blob = await loadGif(src);
      if (!live || !blob) return;
      const next = URL.createObjectURL(blob);
      if (current) URL.revokeObjectURL(current);
      current = next;
      setUrl(next);
    };

    // Primeira preparação depois da hidratação, para o caso de o GIF já estar
    // em cache e decodificado — que é quando o Safari o pinta parado.
    void restart();

    const onVisible = () => {
      if (document.visibilityState === "visible") void restart();
    };
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) void restart();
    };

    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("pageshow", onPageShow);
    return () => {
      live = false;
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("pageshow", onPageShow);
      if (current) URL.revokeObjectURL(current);
    };
  }, [src]);

  return (
    <img
      key={url}
      src={url}
      alt=""
      aria-hidden
      decoding="async"
      fetchPriority={fetchPriority}
      className={className}
    />
  );
}
