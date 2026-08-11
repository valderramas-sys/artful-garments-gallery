import { Link } from "@tanstack/react-router";

import { useQuery } from "@tanstack/react-query";
import { LanguageSelector } from "./LanguageSelector";
import { useI18n } from "@/lib/i18n";
import { fetchPaymentMethods } from "@/lib/shopify";

const SOCIALS = [
  { name: "Instagram", href: "https://www.instagram.com/rhytmo__/" },
  { name: "Pinterest", href: "https://br.pinterest.com/rhytmob/_profile/" },
];

export function Footer() {
  const { t } = useI18n();
  const { data: payments } = useQuery({
    queryKey: ["shopify", "payment-methods"],
    queryFn: fetchPaymentMethods,
    staleTime: 1000 * 60 * 30,
  });

  return (
    <footer className="px-4 pb-4 sm:px-8 sm:pb-6">
      <div className="aero-glass glass-sheen mx-auto max-w-[1600px] rounded-3xl px-5 py-6 text-ink shadow-[0_14px_44px_-32px_rgb(0_0_0/0.28)] sm:px-8 sm:py-7 lg:px-10">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          <section>
            <h3 className="label-xs text-ink">{t("footer.nav")}</h3>
            <ul className="mt-2.5 space-y-1.5 text-xs">
              <li>
                <Link to="/" className="transition-colors duration-250 hover:text-brand-magenta">
                  {t("nav.home")}
                </Link>
              </li>
              <li>
                <Link to="/shop" className="transition-colors duration-250 hover:text-brand-magenta">
                  {t("nav.shop")}
                </Link>
              </li>
              <li>
                <Link to="/info" className="transition-colors duration-250 hover:text-brand-magenta">
                  {t("nav.info")}
                </Link>
              </li>
              <li>
                <Link to="/checkout" className="transition-colors duration-250 hover:text-brand-magenta">
                  {t("nav.checkout")}
                </Link>
              </li>
            </ul>
          </section>

          <section>
            <h3 className="label-xs text-ink">{t("footer.shipping")}</h3>
            <dl className="mt-2.5 space-y-2.5">
              <div>
                <dt className="text-xs font-semibold tracking-tight">{t("footer.brazil")}</dt>
                <dd className="mt-1 text-[9px] leading-[1.6] text-ink">
                  {t("footer.brazil.copy")}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold tracking-tight">{t("footer.world")}</dt>
                <dd className="mt-1 text-[9px] leading-[1.6] text-ink">
                  {t("footer.world.copy")}
                </dd>
              </div>
            </dl>
          </section>

          <section>
            <h3 className="label-xs text-ink">{t("footer.payments")}</h3>
            {payments && payments.length > 0 ? (
              <ul className="mt-2.5 flex flex-wrap gap-1.5">
                {payments.map(({ name, label }) => (
                  <li key={name}>
                    <span
                      title={name}
                      aria-label={name}
                      className="glass-soft font-num grid h-6 min-w-[2.5rem] place-items-center rounded-lg px-2 text-[10px] tracking-[0.06em] text-ink"
                    >
                      {label}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2.5 text-[11px] leading-relaxed text-ink">
                Secure checkout by Shopify
              </p>
            )}

            <p className="mt-3 text-[11px] leading-relaxed text-ink">
              São Paulo, Brasil
            </p>
          </section>

          <section>
            <h3 className="label-xs text-ink">{t("footer.language")}</h3>
            <LanguageSelector className="mt-2.5" />

            <h3 className="label-xs mt-5 text-ink">{t("footer.social")}</h3>
            <ul className="mt-2.5 flex flex-wrap gap-1.5">
              {SOCIALS.map(({ name, href }) => (
                <li key={name}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="glass-btn-rose inline-flex rounded-full px-3 py-1.5 text-[11px]"
                  >
                    {name}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="mt-6 border-t border-white/50 pt-3">
          <p className="font-num text-[10px] tracking-[0.14em] text-ink">
            {t("footer.rights")}
          </p>
        </div>
      </div>
    </footer>
  );
}
