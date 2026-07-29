import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getExchangeRates } from "./rates.functions";

export const CURRENCIES = ["BRL", "USD", "EUR"] as const;
export type CurrencyCode = (typeof CURRENCIES)[number];

const LOCALES: Record<CurrencyCode, string> = {
  BRL: "pt-BR",
  USD: "en-US",
  EUR: "de-DE",
};

/** Fallback rates (1 BRL -> X) used only until live rates resolve. */
const FALLBACK: Record<CurrencyCode, number> = { BRL: 1, USD: 0.18, EUR: 0.17 };

type CurrencyContextValue = {
  currency: CurrencyCode;
  setCurrency: (c: CurrencyCode) => void;
  rates: Record<CurrencyCode, number>;
  live: boolean;
  convert: (brl: number) => number;
  format: (brl: number) => string;
};

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrency] = useState<CurrencyCode>("BRL");
  const [rates, setRates] = useState<Record<CurrencyCode, number>>(FALLBACK);
  const [live, setLive] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const data = await getExchangeRates();
        if (cancelled) return;
        setRates({
          BRL: 1,
          USD: data.USD ?? FALLBACK.USD,
          EUR: data.EUR ?? FALLBACK.EUR,
        });
        setLive(true);
      } catch {
        /* keep fallback rates */
      }
    };
    load();
    const id = window.setInterval(load, 1000 * 60 * 10);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  const convert = useCallback((brl: number) => brl * (rates[currency] ?? 1), [rates, currency]);

  const format = useCallback(
    (brl: number) =>
      new Intl.NumberFormat(LOCALES[currency], {
        style: "currency",
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(brl * (rates[currency] ?? 1)),
    [rates, currency],
  );

  const value = useMemo<CurrencyContextValue>(
    () => ({ currency, setCurrency, rates, live, convert, format }),
    [currency, rates, live, convert, format],
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used within CurrencyProvider");
  return ctx;
}
