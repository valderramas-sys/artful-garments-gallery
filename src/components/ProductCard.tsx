import { useI18n } from "@/lib/i18n";
import { useCurrency } from "@/lib/currency";
import { useCart } from "@/lib/cart";
import { useCartStore } from "@/stores/cartStore";
import { firstAvailableVariant, productImage, type ShopifyProduct } from "@/lib/shopify";

export function ProductCard({
  product,
  onQuickView,
}: {
  product: ShopifyProduct;
  onQuickView: (product: ShopifyProduct) => void;
}) {
  const { t } = useI18n();
  const { formatFrom } = useCurrency();
  const { open } = useCart();
  const addItem = useCartStore((s) => s.addItem);
  const loading = useCartStore((s) => s.loading);

  const node = product.node;
  const image = productImage(product);
  const variant = firstAvailableVariant(product);
  const price = node.priceRange.minVariantPrice;

  return (
    <article className="group rounded-3xl">
      <button
        type="button"
        onClick={() => onQuickView(product)}
        aria-label={`${t("product.quickview")} ${node.title}`}
        className="block w-full overflow-hidden rounded-3xl bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink"
      >
        {image ? (
          <img
            src={image}
            alt={node.images.edges[0]?.node.altText ?? node.title}
            loading="lazy"
            decoding="async"
            className="aspect-4/5 w-full rounded-3xl object-cover transition-transform duration-[600ms] ease-[var(--ease-out-soft)] group-hover:scale-[1.025]"
          />
        ) : (
          <div className="aspect-4/5 w-full rounded-3xl bg-surface-2" />
        )}
      </button>

      <div className="mt-4 grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-3">
        <h2 className="truncate text-sm font-bold tracking-tight">{node.title}</h2>
        <p className="font-num shrink-0 text-sm text-muted-foreground">
          {formatFrom(Number(price.amount), price.currencyCode)}
        </p>
      </div>

      <button
        type="button"
        disabled={!variant || !variant.availableForSale || loading}
        onClick={async () => {
          if (!variant) return;
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
        className="label-xs mt-3 w-full rounded-full border border-pink-mist bg-pink-mist/50 py-2.5 text-pink transition-all duration-250 ease-[var(--ease-out-soft)] hover:bg-pink hover:text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink active:scale-[0.99] disabled:opacity-50"
      >
        {variant?.availableForSale ? t("product.add") : t("product.soldout")}
      </button>
    </article>
  );
}
