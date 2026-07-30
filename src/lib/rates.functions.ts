import { createServerFn } from "@tanstack/react-start";

export const getExchangeRates = createServerFn({ method: "GET" }).handler(async () => {
  const empty = { BRL: 1, USD: null, EUR: null, KRW: null, fetchedAt: new Date().toISOString() };
  try {
    const res = await fetch("https://api.frankfurter.dev/v1/latest?base=BRL&symbols=USD,EUR,KRW");
    if (!res.ok) return empty;
    const data = (await res.json()) as { rates?: Record<string, number> };
    return {
      BRL: 1,
      USD: data.rates?.USD ?? null,
      EUR: data.rates?.EUR ?? null,
      KRW: data.rates?.KRW ?? null,
      fetchedAt: new Date().toISOString(),
    };
  } catch {
    return empty;
  }
});
