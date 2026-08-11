import { useEffect, useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { useCurrency } from "@/lib/currency";
import { DESTINATIONS, findDestination, formatCep, isPostalCodeValid } from "@/lib/commerce";
import { estimateShipping, type ShippingOption } from "@/lib/shipping";

type Status = "idle" | "loading" | "done" | "error" | "invalid";

export function ShippingCalculator({
  variantId,
  quantity,
}: {
  variantId: string | undefined;
  quantity: number;
}) {
  const { t, lang } = useI18n();
  const { formatFrom } = useCurrency();
  const [country, setCountry] = useState("BR");
  const [postal, setPostal] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [options, setOptions] = useState<ShippingOption[]>([]);

  // Reset whenever the selected product/variant changes.
  useEffect(() => {
    setStatus("idle");
    setOptions([]);
  }, [variantId]);

  const names = useMemo(() => {
    try {
      return new Intl.DisplayNames([lang], { type: "region" });
    } catch {
      return null;
    }
  }, [lang]);

  const destination = findDestination(country);

  const calculate = async () => {
    if (!variantId || !isPostalCodeValid(country, postal)) {
      setStatus("invalid");
      return;
    }
    setStatus("loading");
    try {
      const result = await estimateShipping({
        variantId,
        quantity,
        countryCode: country,
        postalCode: postal.trim(),
      });
      setOptions(result);
      setStatus("done");
    } catch (error) {
      console.error("Shipping estimate failed", error);
      setStatus("error");
    }
  };

  const range = ([min, max]: [number, number]) =>
    min === max ? `${min} ${t("ship.days")}` : `${min}–${max} ${t("ship.days")}`;

  return (
    <section className="mt-5 border-t border-border pt-5">
      <h3 className="label-xs text-ink">{t("ship.title")}</h3>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          calculate();
        }}
        className="glass-soft mt-2.5 grid gap-2 rounded-2xl p-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]"
      >
        <label className="sr-only" htmlFor="ship-country">
          {t("ship.country")}
        </label>
        <select
          id="ship-country"
          value={country}
          onChange={(e) => {
            setCountry(e.target.value);
            setPostal("");
            setStatus("idle");
            setOptions([]);
          }}
          className="min-h-10 min-w-0 rounded-xl bg-transparent px-3 text-xs outline-none"
        >
          {DESTINATIONS.map((d) => (
            <option key={d.code} value={d.code}>
              {names?.of(d.code) ?? d.name}
            </option>
          ))}
        </select>

        <label className="sr-only" htmlFor="ship-postal">
          {t("ship.cep")}
        </label>
        <input
          id="ship-postal"
          inputMode={country === "BR" ? "numeric" : "text"}
          value={postal}
          onChange={(e) => {
            setPostal(country === "BR" ? formatCep(e.target.value) : e.target.value);
            if (status === "invalid") setStatus("idle");
          }}
          placeholder={destination.postalExample || t("ship.cep")}
          aria-label={t("ship.cep")}
          className="font-num min-h-10 min-w-0 rounded-xl bg-transparent px-3 text-xs outline-none placeholder:text-ink"
        />

        <button
          type="submit"
          disabled={status === "loading" || !variantId}
          className="glass-btn-primary label-xs min-h-10 rounded-xl px-4 disabled:opacity-50"
        >
          {status === "loading" ? t("ship.calculating") : t("ship.calc")}
        </button>
      </form>

      <div aria-live="polite" className="mt-3">
        {status === "invalid" && (
          <p className="text-[0.75rem] text-pink-deep">{t("ship.invalid")}</p>
        )}
        {status === "error" && (
          <p className="text-[0.75rem] text-ink">{t("ship.error")}</p>
        )}
        {status === "done" && options.length === 0 && (
          <p className="text-[0.75rem] text-ink">{t("ship.none")}</p>
        )}

        {status === "done" && options.length > 0 && (
          <ul className="space-y-2">
            {options.map((option) => (
              <li
                key={option.handle}
                className="glass-soft animate-fade-in rounded-2xl px-3.5 py-3 transition-all duration-250 ease-[var(--ease-out-soft)]"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-[0.8125rem] leading-snug font-bold tracking-tight">
                    {option.title}
                  </p>
                  <p className="font-num text-sm text-pink">
                    {option.amount === 0
                      ? t("ship.free")
                      : formatFrom(option.amount, option.currencyCode)}
                  </p>
                </div>
                <dl className="mt-2 grid grid-cols-3 gap-2 text-[0.6875rem] leading-tight">
                  <div>
                    <dt className="label-xs text-ink">{t("ship.dispatch")}</dt>
                    <dd className="font-num mt-1">{range(option.dispatch)}</dd>
                  </div>
                  <div>
                    <dt className="label-xs text-ink">{t("ship.delivery")}</dt>
                    <dd className="font-num mt-1">{range(option.delivery)}</dd>
                  </div>
                  <div>
                    <dt className="label-xs text-ink">{t("ship.total")}</dt>
                    <dd className="font-num mt-1 text-pink">{range(option.total)}</dd>
                  </div>
                </dl>
              </li>
            ))}
          </ul>
        )}

        <p className="mt-2.5 text-[0.6875rem] leading-relaxed text-ink">
          {t("ship.note")}
        </p>
      </div>
    </section>
  );
}
