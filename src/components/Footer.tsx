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
    <footer className="px-4 pb-6 sm:px-8 sm:pb-10">
      <div className="aero-glass glass-sheen mx-auto max-w-[1600px] rounded-[2rem] px-6 py-12 shadow-[0_18px_60px_-30px_rgb(0_0_0/0.28)] sm:px-12 sm:py-16 lg:px-16">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4 lg:gap-16">
          <section>
            <h3 className="text-sm font-bold tracking-tight sm:text-base">{t("footer.nav")}</h3>
            <ul className="mt-5 space-y-2.5 text-xs text-muted-foreground">
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
            <h3 className="text-sm font-bold tracking-tight sm:text-base">{t("footer.shipping")}</h3>
            <dl className="mt-5 space-y-5">
              <div>
                <dt className="text-[13px] font-semibold tracking-tight">{t("footer.brazil")}</dt>
                <dd className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                  {t("footer.brazil.copy")}
                </dd>
              </div>
              <div>
                <dt className="text-[13px] font-semibold tracking-tight">{t("footer.world")}</dt>
                <dd className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                  {t("footer.world.copy")}
                </dd>
              </div>
            </dl>
          </section>

          <section>
            <h3 className="text-sm font-bold tracking-tight sm:text-base">{t("footer.payments")}</h3>
            {payments && payments.length > 0 ? (
              <ul className="mt-5 flex flex-wrap gap-2">
                {payments.map(({ name, label }) => (
                  <li key={name}>
                    <span
                      title={name}
                      aria-label={name}
                      className="glass-soft font-num grid h-8 min-w-[3rem] place-items-center rounded-xl px-2.5 text-[11px] tracking-[0.08em] text-foreground"
                    >
                      {label}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-5 text-xs leading-relaxed text-muted-foreground">
                Secure checkout by Shopify
              </p>
            )}

            <p className="mt-6 text-xs leading-relaxed text-muted-foreground">São Paulo, Brasil</p>
          </section>

          <section>
            <h3 className="text-sm font-bold tracking-tight sm:text-base">
              {t("footer.language")}
            </h3>
            <LanguageSelector className="mt-5" />

            <h3 className="mt-10 text-sm font-bold tracking-tight sm:text-base">
              {t("footer.social")}
            </h3>
            <ul className="mt-5 flex flex-wrap gap-2">
              {SOCIALS.map(({ name, href }) => (
                <li key={name}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="glass-soft inline-flex rounded-full px-4 py-2 text-xs text-pink transition-all duration-250 ease-[var(--ease-out-soft)] hover:scale-[1.03] hover:text-pink-deep"
                  >
                    {name}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="mt-14 border-t border-white/50 pt-6">
          <p className="font-num text-[10px] tracking-[0.14em] text-muted-foreground">
            {t("footer.rights")}
          </p>
        </div>
      </div>
    </footer>
  );
}

