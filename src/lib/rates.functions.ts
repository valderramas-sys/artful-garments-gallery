import { createServerFn } from "@tanstack/react-start";

export const getExchangeRates = createServerFn({ method: "GET" }).handler(async () => {
  const res = await fetch("https://api.frankfurter.dev/v1/latest?base=BRL&symbols=USD,EUR,KRW");
  if (!res.ok) throw new Error("Failed to load exchange rates");
  const data = (await res.json()) as { rates?: Record<string, number> };
  return {
    BRL: 1,
    USD: data.rates?.USD ?? null,
    EUR: data.rates?.EUR ?? null,
    KRW: data.rates?.KRW ?? null,
    fetchedAt: new Date().toISOString(),
  };
});
