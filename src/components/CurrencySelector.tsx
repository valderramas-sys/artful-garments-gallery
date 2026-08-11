import { CURRENCIES, useCurrency } from "@/lib/currency";
import { playSettingsBeep } from "@/lib/sound";

export function CurrencySelector({ className = "" }: { className?: string }) {
  const { currency, setCurrency, live } = useCurrency();

  const change = (code: typeof CURRENCIES[number]) => {
    if (code === currency) return;
    playSettingsBeep();
    setCurrency(code);
  };

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
          onClick={() => change(code)}
          aria-pressed={currency === code}
          className={`font-num rounded-full px-1.5 py-1 text-[10px] leading-none tracking-[0.06em] transition-all duration-250 ease-[var(--ease-out-soft)] sm:px-2.5 sm:text-[11px] sm:tracking-[0.1em] ${
            currency === code
              ? "glass-btn-accent"
              : "text-muted-foreground hover:text-brand-blue"
          }`}
        >
          {code}
        </button>
      ))}
    </div>
  );
}
