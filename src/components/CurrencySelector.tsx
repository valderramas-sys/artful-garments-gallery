import { CURRENCIES, useCurrency } from "@/lib/currency";

export function CurrencySelector({ className = "" }: { className?: string }) {
  const { currency, setCurrency, live } = useCurrency();

  return (
    <div
      role="group"
      aria-label="Currency"
      title={live ? "Live exchange rates" : "Loading live exchange rates…"}
      className={`glass-soft flex w-fit shrink-0 items-center gap-0.5 rounded-full p-0.5 ${className}`}
    >
      {CURRENCIES.map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => setCurrency(code)}
          aria-pressed={currency === code}
          className={`font-num rounded-full px-1.5 py-1 text-[10px] leading-none tracking-[0.06em] transition-all duration-250 ease-[var(--ease-out-soft)] sm:px-2.5 sm:text-[11px] sm:tracking-[0.1em] ${
            currency === code
              ? "glass-btn-primary"
              : "text-muted-foreground hover:text-pink"
          }`}
        >
          {code}
        </button>
      ))}
    </div>
  );
}
