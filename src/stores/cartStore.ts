import { create } from "zustand";
import { persist } from "zustand/middleware";
import { storefrontApiRequest } from "@/lib/shopify";

export type CartLine = {
  lineId: string;
  variantId: string;
  productId: string;
  handle: string;
  title: string;
  variantTitle: string;
  image: string | null;
  price: number;
  currencyCode: string;
  quantity: number;
};

type CartState = {
  cartId: string | null;
  checkoutUrl: string | null;
  lines: CartLine[];
  cost: CartCost | null;
  discountCodes: Array<{ code: string; applicable: boolean }>;
  loading: boolean;
  applyDiscount: (code: string) => Promise<void>;
  addItem: (line: Omit<CartLine, "lineId">) => Promise<void>;
  updateQuantity: (lineId: string, quantity: number) => Promise<void>;
  removeItem: (lineId: string) => Promise<void>;
  syncCart: () => Promise<void>;
  clear: () => void;
};

const CART_FIELDS = `
  id
  checkoutUrl
  totalQuantity
  discountCodes { code applicable }
  cost {
    subtotalAmount { amount currencyCode }
    totalAmount { amount currencyCode }
    totalTaxAmount { amount currencyCode }
  }
  lines(first: 100) {
    edges {
      node {
        id
        quantity
        merchandise {
          ... on ProductVariant {
            id
            title
            price { amount currencyCode }
            image { url }
            product { id title handle }
          }
        }
      }
    }
  }
`;

export type CartCost = {
  subtotalAmount: { amount: string; currencyCode: string };
  totalAmount: { amount: string; currencyCode: string };
  totalTaxAmount: { amount: string; currencyCode: string } | null;
};

type RemoteCart = {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  discountCodes: Array<{ code: string; applicable: boolean }>;
  cost: CartCost;
  lines: {
    edges: Array<{
      node: {
        id: string;
        quantity: number;
        merchandise: {
          id: string;
          title: string;
          price: { amount: string; currencyCode: string };
          image: { url: string } | null;
          product: { id: string; title: string; handle: string };
        };
      };
    }>;
  };
};

const mapLines = (cart: RemoteCart): CartLine[] =>
  cart.lines.edges.map(({ node }) => ({
    lineId: node.id,
    variantId: node.merchandise.id,
    productId: node.merchandise.product.id,
    handle: node.merchandise.product.handle,
    title: node.merchandise.product.title,
    variantTitle: node.merchandise.title,
    image: node.merchandise.image?.url ?? null,
    price: Number(node.merchandise.price.amount),
    currencyCode: node.merchandise.price.currencyCode,
    quantity: node.quantity,
  }));

const fromCart = (cart: RemoteCart) => ({
  cartId: cart.id,
  checkoutUrl: cart.checkoutUrl,
  lines: mapLines(cart),
  cost: cart.cost ?? null,
  discountCodes: cart.discountCodes ?? [],
});

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      cartId: null,
      checkoutUrl: null,
      lines: [],
      cost: null,
      discountCodes: [],
      loading: false,

      applyDiscount: async (code) => {
        const { cartId } = get();
        if (!cartId) return;
        set({ loading: true });
        try {
          const res = await storefrontApiRequest(
            `mutation CartDiscountCodesUpdate($cartId: ID!, $discountCodes: [String!]) {
              cartDiscountCodesUpdate(cartId: $cartId, discountCodes: $discountCodes) {
                cart { ${CART_FIELDS} }
                userErrors { message }
              }
            }`,
            { cartId, discountCodes: code ? [code] : [] },
          );
          const cart = (res?.data as { cartDiscountCodesUpdate?: { cart?: RemoteCart } })
            ?.cartDiscountCodesUpdate?.cart;
          if (cart) set(fromCart(cart));
        } catch (error) {
          console.error("Shopify applyDiscount failed", error);
        } finally {
          set({ loading: false });
        }
      },

      addItem: async (line) => {
        set({ loading: true });
        try {
          const { cartId } = get();
          if (!cartId) {
            const res = await storefrontApiRequest(
              `mutation CartCreate($input: CartInput!) {
                cartCreate(input: $input) {
                  cart { ${CART_FIELDS} }
                  userErrors { message }
                }
              }`,
              { input: { lines: [{ merchandiseId: line.variantId, quantity: line.quantity }] } },
            );
            const cart = (res?.data as { cartCreate?: { cart?: RemoteCart } })?.cartCreate?.cart;
            if (cart) set(fromCart(cart));
          } else {
            const res = await storefrontApiRequest(
              `mutation CartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
                cartLinesAdd(cartId: $cartId, lines: $lines) {
                  cart { ${CART_FIELDS} }
                  userErrors { message }
                }
              }`,
              { cartId, lines: [{ merchandiseId: line.variantId, quantity: line.quantity }] },
            );
            const cart = (res?.data as { cartLinesAdd?: { cart?: RemoteCart } })?.cartLinesAdd?.cart;
            if (cart) set(fromCart(cart));
          }
        } catch (error) {
          console.error("Shopify addItem failed", error);
        } finally {
          set({ loading: false });
        }
      },

      updateQuantity: async (lineId, quantity) => {
        const { cartId } = get();
        if (!cartId) return;
        if (quantity <= 0) return get().removeItem(lineId);
        set({ loading: true });
        try {
          const res = await storefrontApiRequest(
            `mutation CartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
              cartLinesUpdate(cartId: $cartId, lines: $lines) {
                cart { ${CART_FIELDS} }
                userErrors { message }
              }
            }`,
            { cartId, lines: [{ id: lineId, quantity }] },
          );
          const cart = (res?.data as { cartLinesUpdate?: { cart?: RemoteCart } })?.cartLinesUpdate
            ?.cart;
          if (cart) set(fromCart(cart));
        } catch (error) {
          console.error("Shopify updateQuantity failed", error);
        } finally {
          set({ loading: false });
        }
      },

      removeItem: async (lineId) => {
        const { cartId } = get();
        if (!cartId) return;
        set({ loading: true });
        try {
          const res = await storefrontApiRequest(
            `mutation CartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {
              cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
                cart { ${CART_FIELDS} }
                userErrors { message }
              }
            }`,
            { cartId, lineIds: [lineId] },
          );
          const cart = (res?.data as { cartLinesRemove?: { cart?: RemoteCart } })?.cartLinesRemove
            ?.cart;
          if (cart) set(fromCart(cart));
        } catch (error) {
          console.error("Shopify removeItem failed", error);
        } finally {
          set({ loading: false });
        }
      },

      syncCart: async () => {
        const { cartId } = get();
        if (!cartId) return;
        try {
          const res = await storefrontApiRequest(
            `query GetCart($cartId: ID!) { cart(id: $cartId) { ${CART_FIELDS} } }`,
            { cartId },
          );
          const cart = (res?.data as { cart?: RemoteCart | null })?.cart;
          if (!cart) {
            set({ cartId: null, checkoutUrl: null, lines: [], cost: null, discountCodes: [] });
            return;
          }
          set(fromCart(cart));
        } catch (error) {
          console.error("Shopify syncCart failed", error);
        }
      },

      clear: () =>
        set({ cartId: null, checkoutUrl: null, lines: [], cost: null, discountCodes: [] }),
    }),
    { name: "rhytmo-cart" },
  ),
);

export const cartCount = (lines: CartLine[]) => lines.reduce((n, l) => n + l.quantity, 0);
export const cartSubtotal = (lines: CartLine[]) =>
  lines.reduce((n, l) => n + l.quantity * l.price, 0);
