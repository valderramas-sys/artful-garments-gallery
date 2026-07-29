export const SHOPIFY_API_VERSION = "2025-07";
export const SHOPIFY_STORE_PERMANENT_DOMAIN = "ywbqs6-gd.myshopify.com";
export const SHOPIFY_STOREFRONT_URL = `https://${SHOPIFY_STORE_PERMANENT_DOMAIN}/api/${SHOPIFY_API_VERSION}/graphql.json`;
export const SHOPIFY_STOREFRONT_TOKEN = "a751ce3fa983e0d857ebaa82e1a4c0de";

export type Money = { amount: string; currencyCode: string };

export type ShopifyVariant = {
  id: string;
  title: string;
  price: Money;
  availableForSale: boolean;
  quantityAvailable?: number | null;
  selectedOptions: Array<{ name: string; value: string }>;
};

export type ShopifyProduct = {
  node: {
    id: string;
    title: string;
    description: string;
    handle: string;
    priceRange: { minVariantPrice: Money };
    images: { edges: Array<{ node: { url: string; altText: string | null } }> };
    variants: { edges: Array<{ node: ShopifyVariant }> };
    options: Array<{ name: string; values: string[] }>;
  };
};

export const PRODUCT_FIELDS = `
  id
  title
  description
  handle
  priceRange { minVariantPrice { amount currencyCode } }
  images(first: 5) { edges { node { url altText } } }
  variants(first: 20) {
    edges {
      node {
        id
        title
        price { amount currencyCode }
        availableForSale
        quantityAvailable
        selectedOptions { name value }
      }
    }
  }
  options { name values }
`;

export const STOREFRONT_QUERY = `
  query GetProducts($first: Int!, $query: String) {
    products(first: $first, query: $query) {
      edges { node { ${PRODUCT_FIELDS} } }
    }
  }
`;

export const PRODUCT_BY_HANDLE_QUERY = `
  query GetProduct($handle: String!) {
    product(handle: $handle) { ${PRODUCT_FIELDS} }
  }
`;

export async function storefrontApiRequest(query: string, variables: Record<string, unknown> = {}) {
  const response = await fetch(SHOPIFY_STOREFRONT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": SHOPIFY_STOREFRONT_TOKEN,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (response.status === 402) {
    console.error(
      "Shopify: payment required. Storefront API access needs an active Shopify billing plan (https://admin.shopify.com).",
    );
    return null;
  }

  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

  const data = (await response.json()) as {
    data?: Record<string, unknown>;
    errors?: Array<{ message: string }>;
  };

  if (data.errors?.length) {
    throw new Error(`Error calling Shopify: ${data.errors.map((e) => e.message).join(", ")}`);
  }

  return data;
}

export async function fetchProducts(first = 50, query?: string): Promise<ShopifyProduct[]> {
  const data = await storefrontApiRequest(STOREFRONT_QUERY, { first, query: query ?? null });
  const edges = (data?.data as { products?: { edges?: ShopifyProduct[] } } | undefined)?.products
    ?.edges;
  return edges ?? [];
}

export async function fetchProductByHandle(handle: string): Promise<ShopifyProduct | null> {
  const data = await storefrontApiRequest(PRODUCT_BY_HANDLE_QUERY, { handle });
  const product = (data?.data as { product?: ShopifyProduct["node"] | null } | undefined)?.product;
  return product ? { node: product } : null;
}

export const productImage = (product: ShopifyProduct) =>
  product.node.images.edges[0]?.node.url ?? null;

export const firstAvailableVariant = (product: ShopifyProduct) =>
  product.node.variants.edges.find((v) => v.node.availableForSale)?.node ??
  product.node.variants.edges[0]?.node ??
  null;
