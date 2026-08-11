import { useI18n } from "@/lib/i18n";
import { useCurrency } from "@/lib/currency";
import { useCart } from "@/lib/cart";
import { useCartStore } from "@/stores/cartStore";
import { firstAvailableVariant, productImage, type ShopifyProduct } from "@/lib/shopify";
import { playClick } from "@/lib/sound";

export function ProductCard({
  product,
  onQuickView,
}: {
  product: ShopifyProduct;
  onQuickView: (product: ShopifyProduct) => void;
}) {
  const { t, localize } = useI18n();
  const { formatFrom } = useCurrency();
  const { open } = useCart();
  const addItem = useCartStore((s) => s.addItem);
  const loading = useCartStore((s) => s.loading);

  const node = product.node;
  const image = productImage(product);
  const variant = firstAvailableVariant(product);
  const price = node.priceRange.minVariantPrice;

  return (
    <article className="group card-float rounded-3xl">
      <button
        type="button"
        onClick={() => onQuickView(product)}
        aria-label={localize(node.title)}
        className="block w-full rounded-3xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-pink"
      >
        {image ? (
          <img
            src={image}
            alt={node.images.edges[0]?.node.altText ?? node.title}
            loading="lazy"
            decoding="async"
            className="aspect-4/5 w-full rounded-3xl bg-surface object-cover"
          />
        ) : (
          <div className="card-float-media aspect-4/5 w-full rounded-3xl bg-surface-2" />
        )}
      </button>

      <div className="mt-5 flex flex-col gap-1 sm:grid sm:grid-cols-[minmax(0,1fr)_auto] sm:items-baseline sm:gap-3">
        <h2 className="text-sm leading-snug font-bold tracking-tight text-white">
          {localize(node.title)}
        </h2>
        <p className="font-num shrink-0 text-sm text-white">
          {formatFrom(Number(price.amount), price.currencyCode)}
        </p>
      </div>


      <button
        type="button"
        disabled={!variant || !variant.availableForSale || loading}
        onClick={async () => {
          if (!variant) return;
          playClick();
          await addItem({
            variantId: variant.id,
            productId: node.id,
            handle: node.handle,
            title: node.title,
            variantTitle: variant.title,
            image,
            price: Number(variant.price.amount),
            currencyCode: variant.price.currencyCode,
            quantity: 1,
          });
          open();
        }}
        className="glass-btn-ink label-xs mt-3 w-full rounded-full px-3 py-3 leading-tight break-words whitespace-normal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink disabled:opacity-50"
      >
        {variant?.availableForSale ? t("product.add") : t("product.soldout")}
      </button>
    </article>
  );
}
