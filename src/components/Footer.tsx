import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { LanguageSelector } from "./LanguageSelector";
import { useI18n } from "@/lib/i18n";
import { fetchPaymentMethods } from "@/lib/shopify";

const SOCIALS = [
  { name: "Instagram", href: "https://instagram.com" },
  { name: "Pinterest", href: "https://pinterest.com" },
];

export function Footer() {
  const { t } = useI18n();
  const { data: payments } = useQuery({
    queryKey: ["shopify", "payment-methods"],
    queryFn: fetchPaymentMethods,
    staleTime: 1000 * 60 * 30,
  });


  return (
    <footer className="px-4 pb-5 sm:px-8 sm:pb-8">
      <div className="aero-glass glass-sheen mx-auto max-w-[1600px] rounded-[1.75rem] px-5 py-7 shadow-[0_18px_60px_-30px_rgb(0_0_0/0.28)] sm:px-9 sm:py-8">
        <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-4">
          <section>
            <h3 className="label-xs text-[10px] text-muted-foreground">{t("footer.nav")}</h3>
            <ul className="mt-2.5 space-y-1.5 text-xs">
              <li>
                <Link to="/" className="transition-colors duration-250 hover:text-pink">
                  {t("nav.home")}
                </Link>
              </li>
              <li>
                <Link to="/shop" className="transition-colors duration-250 hover:text-pink">
                  {t("nav.shop")}
                </Link>
              </li>
              <li>
                <Link to="/checkout" className="transition-colors duration-250 hover:text-pink">
                  {t("nav.checkout")}
                </Link>
              </li>
            </ul>
          </section>

          <section>
            <h3 className="label-xs text-[10px] text-muted-foreground">{t("footer.shipping")}</h3>
            <dl className="mt-2.5 space-y-2.5 text-xs">
              <div>
                <dt className="font-bold tracking-tight">{t("footer.brazil")}</dt>
                <dd className="mt-1 leading-relaxed text-muted-foreground">
                  {t("footer.brazil.copy")}
                </dd>
              </div>
              <div>
                <dt className="font-bold tracking-tight">{t("footer.world")}</dt>
                <dd className="mt-1 leading-relaxed text-muted-foreground">
                  {t("footer.world.copy")}
                </dd>
              </div>
            </dl>
          </section>

          <section>
            <h3 className="label-xs text-[10px] text-muted-foreground">{t("footer.payments")}</h3>
            {payments && payments.length > 0 ? (
              <ul className="mt-2.5 flex flex-wrap gap-1.5">
                {payments.map(({ name, label }) => (
                  <li key={name}>
                    <span
                      title={name}
                      aria-label={name}
                      className="glass-soft font-num grid h-7 min-w-[2.75rem] place-items-center rounded-lg px-2 text-[10px] tracking-[0.08em] text-foreground"
                    >
                      {label}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2.5 text-[11px] leading-relaxed text-muted-foreground">
                Secure checkout by Shopify
              </p>
            )}


            <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
              São Paulo, Brasil
            </p>
          </section>

          <section>
            <h3 className="label-xs text-[10px] text-muted-foreground">{t("footer.social")}</h3>
            <ul className="mt-2.5 flex flex-wrap gap-1.5">
              {SOCIALS.map(({ name, href }) => (
                <li key={name}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="glass-soft label-xs inline-flex rounded-full px-3 py-1.5 text-[10px] text-pink transition-all duration-250 ease-[var(--ease-out-soft)] hover:scale-[1.03] hover:text-pink-deep"
                  >
                    {name}
                  </a>
                </li>
              ))}
            </ul>

            <h3 className="label-xs mt-5 text-[10px] text-muted-foreground">
              {t("footer.language")}
            </h3>
            <LanguageSelector className="mt-2.5" />
          </section>
        </div>

        <div className="mt-7 flex flex-wrap items-center justify-between gap-2 border-t border-white/50 pt-4">
          <p className="font-num text-[10px] tracking-[0.12em] text-muted-foreground">
            {t("footer.rights")}
          </p>
        </div>

      </div>
    </footer>
  );
}
