import { CURRENCIES, useCurrency } from "@/lib/currency";

export function CurrencySelector({ className = "" }: { className?: string }) {
  const { currency, setCurrency, live } = useCurrency();

  return (
    <div
      role="group"
      aria-label="Currency"
      title={live ? "Live exchange rates" : "Loading live exchange rates…"}
      className={`glass-soft flex items-center gap-0.5 rounded-full p-0.5 ${className}`}
    >
      {CURRENCIES.map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => setCurrency(code)}
          aria-pressed={currency === code}
          className={`font-num rounded-full px-2 py-1 text-[11px] tracking-[0.08em] transition-all duration-250 ease-[var(--ease-out-soft)] sm:px-2.5 sm:tracking-[0.1em] ${
            currency === code
              ? "bg-pink text-primary-foreground"
              : "text-muted-foreground hover:text-pink"
          }`}
        >
          {code}
        </button>
      ))}
    </div>
  );
}
