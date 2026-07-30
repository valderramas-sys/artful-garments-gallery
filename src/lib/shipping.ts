import { storefrontApiRequest } from "@/lib/shopify";
import { DISPATCH_DAYS, findDestination } from "@/lib/commerce";

export type ShippingOption = {
  handle: string;
  title: string;
  code: string | null;
  description: string | null;
  amount: number;
  currencyCode: string;
  /** Business-day window from dispatch to delivery. */
  delivery: [number, number];
  /** Business-day window for handling/dispatch. */
  dispatch: [number, number];
  /** Total business-day window (dispatch + delivery). */
  total: [number, number];
};

const ESTIMATE_QUERY = `
  mutation EstimateShipping($input: CartInput!) {
    cartCreate(input: $input) {
      cart {
        id
        deliveryGroups(first: 5, withCarrierRates: true) {
          nodes {
            deliveryOptions {
              handle
              title
              code
              description
              estimatedCost { amount currencyCode }
            }
          }
        }
      }
      userErrors { message }
    }
  }
`;

type RawOption = {
  handle: string;
  title: string | null;
  code: string | null;
  description: string | null;
  estimatedCost: { amount: string; currencyCode: string };
};

/** Pulls a "3-8 days" style window out of a carrier description when present. */
function parseWindow(text: string | null): [number, number] | null {
  if (!text) return null;
  const range = text.match(/(\d{1,2})\s*(?:-|–|—|to|a|até|bis|~)\s*(\d{1,2})/i);
  if (range) return [Number(range[1]), Number(range[2])];
  const single = text.match(/(\d{1,2})\s*(?:business\s*)?(?:day|dia|tag|일)/i);
  if (single) return [Number(single[1]), Number(single[1])];
  return null;
}

/**
 * Asks Shopify for live delivery options for a variant + destination.
 *
 * A throwaway cart is created with the buyer's delivery address so Shopify
 * returns exactly the rates configured in the admin — Correios carrier rates
 * for Brazil, international zone rates elsewhere. Nothing is hardcoded.
 */
export async function estimateShipping(params: {
  variantId: string;
  quantity: number;
  countryCode: string;
  postalCode: string;
  province?: string;
  city?: string;
}): Promise<ShippingOption[]> {
  const { variantId, quantity, countryCode, postalCode } = params;

  const res = await storefrontApiRequest(ESTIMATE_QUERY, {
    input: {
      lines: [{ merchandiseId: variantId, quantity }],
      buyerIdentity: {
        countryCode,
        deliveryAddressPreferences: [
          {
            deliveryAddress: {
              countryCode,
              zip: postalCode,
              ...(params.province ? { province: params.province } : {}),
              ...(params.city ? { city: params.city } : {}),
            },
          },
        ],
      },
    },
  });

  const groups =
    (
      res?.data as
        | {
            cartCreate?: {
              cart?: { deliveryGroups?: { nodes?: Array<{ deliveryOptions?: RawOption[] }> } };
            };
          }
        | undefined
    )?.cartCreate?.cart?.deliveryGroups?.nodes ?? [];

  const destination = findDestination(countryCode);
  const dispatch = DISPATCH_DAYS[destination.region];

  const options: ShippingOption[] = [];
  for (const group of groups) {
    for (const option of group.deliveryOptions ?? []) {
      const delivery = parseWindow(option.description) ?? parseWindow(option.title) ?? destination.delivery;
      options.push({
        handle: option.handle,
        title: option.title?.trim() || option.code || "Shipping",
        code: option.code,
        description: option.description,
        amount: Number(option.estimatedCost.amount),
        currencyCode: option.estimatedCost.currencyCode,
        delivery,
        dispatch,
        total: [dispatch[0] + delivery[0], dispatch[1] + delivery[1]],
      });
    }
  }

  return options.sort((a, b) => a.amount - b.amount);
}
