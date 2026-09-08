import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchProductByHandle,
  fetchProducts,
  productImage,
  sizedImage,
  type ShopifyVariant,
} from "@/lib/shopify";
import { useI18n } from "@/lib/i18n";
import { useCurrency } from "@/lib/currency";
import { useCart } from "@/lib/cart";
import { useCartStore } from "@/stores/cartStore";
import { buildCheckoutUrl } from "@/lib/commerce";
import { playTap } from "@/lib/sound";
import { reactRobot } from "@/stores/robotStore";
import { secondPhoto } from "@/lib/product-photos";
import { prewarmCutoutQueue, PDP_CUTOUT_DIMENSION } from "@/hooks/useCutoutImage";
import { ShippingCalculator } from "@/components/ShippingCalculator";
import { ProductStage } from "@/components/product/ProductStage";
import { ProductConsole } from "@/components/product/ProductConsole";
import { ProductFilmstrip } from "@/components/product/ProductFilmstrip";

const PARADELA_URL = "https://www.instagram.com/paradela___/";

/** Espera antes de adiantar o resto da collab — ver o efeito que a usa. */
const NEIGHBOUR_PREWARM_MS = 1200;

function ParadelaLink() {
  return (
    <a href={PARADELA_URL} target="_blank" rel="noreferrer noopener" className="pdp-link">
      @paradela
    </a>
  );
}

function SpecText({ text }: { text: string }) {
  if (!text.includes("@paradela")) return <>{text}</>;
  const [before] = text.split("@paradela");
  return (
    <>
      {before}
      <ParadelaLink />
    </>
  );
}

export const Route = createFileRoute("/shop_/$handle")({
  head: ({ params }) => ({
    meta: [{ title: `${params.handle} — RHYTMO` }],
  }),
  component: ProductDetail,
});

function ProductDetail() {
  const { handle } = Route.useParams();
  const navigate = useNavigate();
  const { t, product: content, localize, lang } = useI18n();
  const { formatFrom, currency } = useCurrency();
  const { open } = useCart();
  const addItem = useCartStore((s) => s.addItem);
  const checkoutUrl = useCartStore((s) => s.checkoutUrl);
  const loading = useCartStore((s) => s.loading);

  const {
    data: product,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["shopify", "product", handle],
    queryFn: () => fetchProductByHandle(handle),
    staleTime: 1000 * 60 * 5,
  });

  // Mesma chave que a loja usa, então na navegação normal isto vem do cache
  // e a tira inferior aparece sem nenhuma requisição a mais.
  const { data: siblings } = useQuery({
    queryKey: ["shopify", "products"],
    queryFn: () => fetchProducts(),
    staleTime: 1000 * 60 * 5,
  });

  const variants = useMemo(() => product?.node.variants.edges.map((e) => e.node) ?? [], [product]);
  const [variantId, setVariantId] = useState<string | undefined>(undefined);
  const [quantity, setQuantity] = useState(1);
  const [slide, setSlide] = useState(0);

  /**
   * Qual foto a próxima página deve abrir, quando a chegada veio das setas do
   * palco. Andando para a frente é sempre a primeira, mas andando para trás é a
   * ÚLTIMA do produto anterior — senão a seta da esquerda pularia as editoriais
   * no caminho de volta. Fora das setas fica nulo e vale o padrão de sempre.
   */
  const pendingPhoto = useRef<number | null>(null);

  useEffect(() => {
    if (product) {
      const first = variants.find((v) => v.availableForSale) ?? variants[0];
      setVariantId(first?.id);
      setSlide(pendingPhoto.current ?? 0);
      pendingPhoto.current = null;
      setQuantity(1);
    }
    // Sem reação do robô aqui. Este efeito dispara a cada troca de produto, e
    // as setas do palco trocam de produto o tempo todo — ele piscava o visor a
    // cada clique. Ele continua reagindo ao que é decisão do cliente: clicar
    // numa bolha na loja, mexer no carrinho, ir para o checkout.
    //
    // Only re-run when the product itself changes, not on every variants
    // array identity change (variants is derived fresh from `product`).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product]);

  const variant: ShopifyVariant | undefined =
    variants.find((v) => v.id === variantId) ?? variants[0];
  const maxQty = 10;
  const image = product ? productImage(product) : null;

  /**
   * As duas fotos — o gorro sobre fundo branco e a editorial com a modelo —
   * passam pelo mesmo recorte. A editorial só passou a funcionar depois de
   * dois ajustes no pipeline (ver useCutoutImage): a referência de fundo
   * virou a mediana da borda, porque o enquadramento é fechado e os cantos de
   * baixo são o cabelo da modelo; e a tolerância caiu de 34 para 18 por
   * canal, porque a pele clara do colo fica a apenas 68 do branco do estúdio.
   *
   * 1536 é o tamanho da foto-mestra da Shopify: é ela que a lente amplia.
   */
  const gallery = useMemo(() => {
    const list: string[] = [];
    const full = sizedImage(image, 1536);
    if (full) list.push(full);
    const second = product ? secondPhoto(product.node.title, product.node.handle) : null;
    if (second) list.push(second);
    return list;
  }, [image, product]);

  const family = useMemo(
    () =>
      (siblings ?? []).map((p) => ({
        handle: p.node.handle,
        title: localize(p.node.title),
        // 320 e não 160: a miniatura também é recortada, e o recorte precisa
        // de pixels para achar a silhueta.
        image: sizedImage(productImage(p), 320),
      })),
    [siblings, localize],
  );

  /**
   * O percurso das setas: TODAS as fotos de TODOS os gorros da collab, em
   * ordem e em círculo.
   *
   * Antes as setas pulavam de produto em produto e as fotos editoriais só
   * existiam na tira de miniaturas — quem só usava as setas nunca via as
   * modelos. Agora é uma coisa só: gorro 0.1 na foto de produto, gorro 0.1 na
   * modelo, gorro 0.2 na foto de produto, e assim por diante, dando a volta no
   * fim. Sai daqui, e não do `gallery` do produto aberto, porque o percurso
   * precisa conhecer as fotos dos OUTROS produtos antes de navegar até eles —
   * e as duas fontes (a foto da Shopify e a editorial local) são deriváveis da
   * lista da loja, que já está em cache.
   */
  const roll = useMemo(() => {
    const items: Array<{ handle: string; photo: number; src: string }> = [];
    for (const p of siblings ?? []) {
      const main = sizedImage(productImage(p), 1536);
      if (main) items.push({ handle: p.node.handle, photo: 0, src: main });
      const second = secondPhoto(p.node.title, p.node.handle);
      if (second) items.push({ handle: p.node.handle, photo: 1, src: second });
    }
    return items;
  }, [siblings]);

  const rollAt = useMemo(
    () => roll.findIndex((r) => r.handle === handle && r.photo === slide),
    [roll, handle, slide],
  );

  const goRoll = (dir: 1 | -1) => {
    if (roll.length < 2 || rollAt < 0) return;
    const target = roll[(rollAt + dir + roll.length) % roll.length];
    if (target.handle === handle) {
      setSlide(target.photo);
      return;
    }
    pendingPhoto.current = target.photo;
    navigate({ to: "/shop/$handle", params: { handle: target.handle } });
  };

  /**
   * Deixa o percurso inteiro pronto antes de alguém andar por ele.
   *
   * O recorte é o que custa caro, e uma foto fria no meio do caminho aparece
   * como uma travada entre a peça sair de cena e a próxima entrar. São oito
   * fotos na collab; a fila as processa uma a uma, com respiro, então o custo
   * se dilui em vez de segurar a linha principal de uma vez só. Começa com
   * atraso para não disputar com o recorte da foto que está na tela agora, e o
   * cache é do módulo: isto acontece uma vez por sessão, não por navegação.
   */
  const queryClient = useQueryClient();
  useEffect(() => {
    if (roll.length === 0) return;
    // A partir da posição atual e dando a volta — o que vem a seguir esquenta
    // primeiro.
    const from = Math.max(0, rollAt);
    const ordered = roll.map((_, i) => roll[(from + i) % roll.length]);
    const timer = window.setTimeout(() => {
      for (const h of new Set(ordered.map((r) => r.handle))) {
        void queryClient.prefetchQuery({
          queryKey: ["shopify", "product", h],
          queryFn: () => fetchProductByHandle(h),
          staleTime: 1000 * 60 * 5,
        });
      }
    }, NEIGHBOUR_PREWARM_MS);
    const cancel = prewarmCutoutQueue(
      ordered.map((r) => r.src),
      PDP_CUTOUT_DIMENSION,
    );
    return () => {
      window.clearTimeout(timer);
      cancel();
    };
    // Só a composição do percurso importa aqui; refazer a fila a cada troca de
    // foto cancelaria o adiantamento no meio, que é o oposto do objetivo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roll, queryClient]);

  const priceLabel = product
    ? variant
      ? formatFrom(Number(variant.price.amount), variant.price.currencyCode)
      : formatFrom(
          Number(product.node.priceRange.minVariantPrice.amount),
          product.node.priceRange.minVariantPrice.currencyCode,
        )
    : "";

  const addToCart = async () => {
    if (!product || !variant) return;
    await addItem({
      variantId: variant.id,
      productId: product.node.id,
      handle: product.node.handle,
      title: product.node.title,
      variantTitle: variant.title,
      image,
      price: Number(variant.price.amount),
      currencyCode: variant.price.currencyCode,
      quantity,
    });
  };

  const goBack = () => {
    playTap();
    navigate({ to: "/shop" });
  };

  if (isLoading) {
    return (
      <main className="pdp-stage">
        <div className="pdp-stage-media">
          <div className="pdp-light" aria-hidden />
          <div className="pdp-photo-frame">
            <span className="pdp-photo-placeholder" />
          </div>
        </div>
      </main>
    );
  }

  if (isError || !product) {
    return (
      <main className="pdp-stage pdp-stage-empty">
        <p className="pdp-copy">{t("cart.empty")}</p>
        <Link to="/shop" className="pdp-back">
          {t("nav.shop")}
        </Link>
      </main>
    );
  }

  return (
    <main className="pdp-stage animate-fade-in">
      <button type="button" onClick={goBack} className="pdp-back">
        <svg
          viewBox="0 0 24 24"
          className="h-3 w-3"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden
        >
          <path d="M15 6 9 12l6 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {t("checkout.back")}
      </button>

      <ProductStage
        photos={gallery}
        index={slide}
        onIndexChange={setSlide}
        alt={localize(product.node.title)}
        hint={t("product.zoom")}
        scanLabel={t("product.scanning")}
        onPrev={roll.length > 1 ? () => goRoll(-1) : undefined}
        onNext={roll.length > 1 ? () => goRoll(1) : undefined}
        prevLabel={t("product.prev")}
        nextLabel={t("product.next")}
      />

      <ProductFilmstrip
        photos={gallery}
        index={slide}
        onSelect={setSlide}
        siblings={family}
        currentHandle={product.node.handle}
        photosLabel={t("product.photos")}
        familyLabel={t("product.family")}
      />

      <ProductConsole
        collab={
          <>
            {t("product.collab")}: RHYTMO × <ParadelaLink />
          </>
        }
        title={localize(product.node.title)}
        price={priceLabel}
        inStock={Boolean(variant?.availableForSale)}
        overview={content.overview}
        specs={content.specs.map((spec) => (
          <SpecText key={spec} text={spec} />
        ))}
        care={content.care}
        shippingText={content.shipping}
        shippingCalculator={<ShippingCalculator variantId={variant?.id} quantity={quantity} />}
        variantSelector={
          variants.length > 1 ? (
            <fieldset className="pdp-variants">
              <legend className="pdp-field">
                {product.node.options[0]?.name ?? t("cart.size")}
              </legend>
              <div className="pdp-variant-chips">
                {variants.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => {
                      playTap();
                      setVariantId(v.id);
                    }}
                    aria-pressed={variant?.id === v.id}
                    disabled={!v.availableForSale}
                    data-active={variant?.id === v.id || undefined}
                    className="pdp-variant-chip font-num"
                  >
                    {v.title}
                  </button>
                ))}
              </div>
            </fieldset>
          ) : null
        }
        quantity={quantity}
        maxQuantity={maxQty}
        onQuantityChange={setQuantity}
        busy={loading}
        onAdd={async () => {
          playTap();
          await addToCart();
          open();
        }}
        onBuy={async () => {
          playTap();
          await addToCart();
          const url = buildCheckoutUrl(useCartStore.getState().checkoutUrl ?? checkoutUrl, {
            currency,
            lang,
          });
          if (url) window.location.href = url;
        }}
      />
    </main>
  );
}
