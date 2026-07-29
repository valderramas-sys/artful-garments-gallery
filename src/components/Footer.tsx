import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";
import { LanguageSelector } from "./LanguageSelector";
import { useI18n } from "@/lib/i18n";

const PAYMENTS = [
  { name: "Visa", label: "VISA" },
  { name: "Mastercard", label: "MC" },
  { name: "American Express", label: "AMEX" },
  { name: "Pix", label: "PIX" },
  { name: "Apple Pay", label: "PAY" },
  { name: "PayPal", label: "PP" },
];

const SOCIALS = [
  { name: "Instagram", href: "https://instagram.com" },
  { name: "TikTok", href: "https://tiktok.com" },
  { name: "YouTube", href: "https://youtube.com" },
  { name: "Pinterest", href: "https://pinterest.com" },
];

export function Footer() {
  const { t } = useI18n();

  return (
    <footer className="px-4 pb-6 sm:px-8 sm:pb-10">
      <div className="aero-glass mx-auto max-w-[1600px] rounded-[2rem] px-6 py-12 sm:px-10 sm:py-14">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,2.4fr)]">
          <div className="min-w-0">
            <Logo className="h-7 w-[164px] text-foreground" />
            <p className="mt-5 max-w-[38ch] text-sm leading-relaxed text-muted-foreground">
              {t("footer.brand.copy")}
            </p>
            <div className="mt-7">
              <h3 className="label-xs text-muted-foreground">{t("footer.language")}</h3>
              <LanguageSelector className="mt-3" />
            </div>
          </div>

          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
            <section>
              <h3 className="label-xs text-muted-foreground">{t("footer.nav")}</h3>
              <ul className="mt-4 space-y-2.5 text-sm">
                <li>
                  <Link
                    to="/"
                    className="transition-colors duration-250 hover:text-pink"
                  >
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

              <h3 className="label-xs mt-9 text-muted-foreground">{t("footer.social")}</h3>
              <ul className="mt-4 flex flex-wrap gap-2">
                {SOCIALS.map(({ name, href }) => (
                  <li key={name}>
                    <a
                      href={href}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="glass-soft label-xs inline-flex rounded-full px-3.5 py-2 text-pink transition-all duration-250 ease-[var(--ease-out-soft)] hover:scale-[1.03] hover:text-pink-deep"
                    >
                      {name}
                    </a>
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h3 className="label-xs text-muted-foreground">{t("footer.shipping")}</h3>
              <dl className="mt-4 space-y-5 text-sm">
                <div>
                  <dt className="font-bold tracking-tight">{t("footer.brazil")}</dt>
                  <dd className="mt-1.5 text-muted-foreground">{t("footer.brazil.copy")}</dd>
                </div>
                <div>
                  <dt className="font-bold tracking-tight">{t("footer.world")}</dt>
                  <dd className="mt-1.5 text-muted-foreground">{t("footer.world.copy")}</dd>
                </div>
              </dl>
            </section>

            <section>
              <h3 className="label-xs text-muted-foreground">{t("footer.payments")}</h3>
              <ul className="mt-4 flex flex-wrap gap-2">
                {PAYMENTS.map(({ name, label }) => (
                  <li key={name}>
                    <span
                      title={name}
                      aria-label={name}
                      className="glass-soft font-num grid h-9 min-w-[3.25rem] place-items-center rounded-xl px-2 text-[11px] tracking-[0.08em] text-foreground"
                    >
                      {label}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
                São Paulo, Brasil
              </p>
            </section>
          </div>
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-between gap-3 border-t border-white/50 pt-6">
          <p className="font-num text-xs tracking-[0.12em] text-muted-foreground">
            {t("footer.rights")}
          </p>
          <p className="label-xs text-muted-foreground">Independent streetwear</p>
        </div>
      </div>
    </footer>
  );
}
