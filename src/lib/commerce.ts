/**
 * Commercial configuration for the RHYTMO Shopify storefront.
 *
 * Origin: Bauru/SP, Brazil. Domestic shipping runs through Correios (Shopify
 * carrier-calculated rates); international shipping runs through Shopify's
 * international shipping zones. Every rate shown in the UI comes from Shopify
 * itself, so activating a carrier/payment provider in the Shopify admin makes
 * it appear on the storefront with no code change.
 */

export const ORIGIN = {
  address1: "Avenida Affonso José Aiello, 14-100",
  address2: "Villaggio 2",
  district: "Vila Aviação",
  postalCode: "17018-520",
  city: "Bauru",
  province: "SP",
  countryCode: "BR",
} as const;

export type Region = "north-america" | "european-union" | "asia";

export type Destination = {
  code: string;
  /** English name; the selector shows the localized Intl.DisplayNames label. */
  name: string;
  region: Region | "brazil";
  /** Postal-code hint shown in the input placeholder. */
  postalExample: string;
  /** Business-day delivery window used as a fallback estimate. */
  delivery: [number, number];
};

/** Handling/dispatch window in business days, before the carrier picks the order up. */
export const DISPATCH_DAYS: Record<Destination["region"], [number, number]> = {
  brazil: [1, 3],
  "south-america": [2, 4],
  "north-america": [2, 4],
  "european-union": [2, 4],
  "south-korea": [2, 4],
};

/**
 * Destinations enabled at checkout. Mirrors the Shopify shipping zones:
 * Brazil (Correios) + South America + North America + European Union + South Korea.
 */
export const DESTINATIONS: Destination[] = [
  { code: "BR", name: "Brazil", region: "brazil", postalExample: "00000-000", delivery: [2, 15] },

  // South America
  { code: "AR", name: "Argentina", region: "south-america", postalExample: "C1000", delivery: [10, 25] },
  { code: "BO", name: "Bolivia", region: "south-america", postalExample: "0000", delivery: [12, 30] },
  { code: "CL", name: "Chile", region: "south-america", postalExample: "0000000", delivery: [10, 25] },
  { code: "CO", name: "Colombia", region: "south-america", postalExample: "000000", delivery: [12, 30] },
  { code: "EC", name: "Ecuador", region: "south-america", postalExample: "000000", delivery: [12, 30] },
  { code: "GY", name: "Guyana", region: "south-america", postalExample: "", delivery: [15, 35] },
  { code: "PY", name: "Paraguay", region: "south-america", postalExample: "0000", delivery: [10, 25] },
  { code: "PE", name: "Peru", region: "south-america", postalExample: "00000", delivery: [12, 30] },
  { code: "SR", name: "Suriname", region: "south-america", postalExample: "", delivery: [15, 35] },
  { code: "UY", name: "Uruguay", region: "south-america", postalExample: "00000", delivery: [10, 25] },
  { code: "VE", name: "Venezuela", region: "south-america", postalExample: "0000", delivery: [15, 35] },

  // North America
  { code: "CA", name: "Canada", region: "north-america", postalExample: "A1A 1A1", delivery: [15, 35] },
  { code: "MX", name: "Mexico", region: "north-america", postalExample: "00000", delivery: [15, 35] },
  { code: "US", name: "United States", region: "north-america", postalExample: "00000", delivery: [12, 30] },

  // European Union
  ...([
    ["AT", "Austria"], ["BE", "Belgium"], ["BG", "Bulgaria"], ["HR", "Croatia"], ["CY", "Cyprus"],
    ["CZ", "Czechia"], ["DK", "Denmark"], ["EE", "Estonia"], ["FI", "Finland"], ["FR", "France"],
    ["DE", "Germany"], ["GR", "Greece"], ["HU", "Hungary"], ["IE", "Ireland"], ["IT", "Italy"],
    ["LV", "Latvia"], ["LT", "Lithuania"], ["LU", "Luxembourg"], ["MT", "Malta"],
    ["NL", "Netherlands"], ["PL", "Poland"], ["PT", "Portugal"], ["RO", "Romania"],
    ["SK", "Slovakia"], ["SI", "Slovenia"], ["ES", "Spain"], ["SE", "Sweden"],
  ] as const).map(
    ([code, name]): Destination => ({
      code,
      name,
      region: "european-union",
      postalExample: "00000",
      delivery: [15, 40],
    }),
  ),

  // South Korea
  { code: "KR", name: "South Korea", region: "south-korea", postalExample: "00000", delivery: [15, 40] },
];

export const findDestination = (code: string) =>
  DESTINATIONS.find((d) => d.code === code) ?? DESTINATIONS[0];

/** Very light postal-code sanity check per destination. */
export function isPostalCodeValid(countryCode: string, value: string) {
  const raw = value.trim();
  if (countryCode === "BR") return /^\d{5}-?\d{3}$/.test(raw);
  const dest = findDestination(countryCode);
  if (!dest.postalExample) return raw.length >= 3;
  return raw.length >= 3;
}

export const formatCep = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  return digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
};

const CHECKOUT_LOCALE: Record<string, string> = {
  pt: "pt-BR",
  en: "en",
  de: "de",
  ko: "ko",
};

/**
 * Carries the storefront's channel, selected currency and language into the
 * Shopify-hosted checkout so the buyer keeps the same experience end-to-end.
 */
export function buildCheckoutUrl(
  checkoutUrl: string | null,
  options: { currency?: string; lang?: string } = {},
) {
  if (!checkoutUrl) return null;
  try {
    const url = new URL(checkoutUrl);
    url.searchParams.set("channel", "online_store");
    if (options.currency) url.searchParams.set("currency", options.currency);
    const locale = options.lang ? CHECKOUT_LOCALE[options.lang] : undefined;
    if (locale) url.searchParams.set("locale", locale);
    return url.toString();
  } catch {
    return checkoutUrl;
  }
}

const STORE_URL = "https://ywbqs6-gd.myshopify.com";

/** Shopify-hosted customer surfaces (account, order history, order tracking). */
export const CUSTOMER_LINKS = {
  account: `${STORE_URL}/account`,
  orders: `${STORE_URL}/account`,
  login: `${STORE_URL}/account/login`,
  /** Shopify shows carrier tracking for each order inside the account area. */
  tracking: `${STORE_URL}/account`,
};
