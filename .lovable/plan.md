## Cause (confirmed from the live network requests)

The Shopify Storefront API is returning your 4 beanies correctly, but alongside them it returns errors:

`Access denied for quantityAvailable field. Required access: unauthenticated_read_product_inventory access scope.`

Our product query in `src/lib/shopify.ts` asks for `quantityAvailable` (stock count, used in the quick-view modal). The storefront token doesn't have the inventory scope, so Shopify returns partial data plus an error entry. Our `storefrontApiRequest` helper throws whenever `data.errors` is non-empty — so a harmless partial error turns the whole shop page into "Products could not be loaded right now."

So: nothing is wrong with the products, images, or the store. It's the inventory field + strict error handling.

## Fix

1. **Remove `quantityAvailable` from `PRODUCT_FIELDS`** in `src/lib/shopify.ts` — the token can't read it, so it never returns a value anyway.
2. **Make `storefrontApiRequest` tolerant of partial errors**: only throw when there is no `data` payload at all. When data exists alongside errors, log a warning and return the data.
3. **Adjust `src/components/QuickView.tsx`**: `stock` is always null now, so fall back to the `availableForSale` flag ("In stock" / "Sold out") instead of showing a numeric count.

## Optional (your side, not code)

If you want real stock numbers displayed, enable the `unauthenticated_read_product_inventory` scope on the storefront app in Shopify admin; then we can re-add the field.
