import { createFileRoute } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";
import {
  INFO_CONTENT,
  INFO_EMAIL,
  INFO_INSTAGRAM,
  INFO_INSTAGRAM_URL,
  INFO_SITE,
  INFO_SITE_URL,
} from "@/lib/info-content";

export const Route = createFileRoute("/info")({
  head: () => ({
    meta: [
      { title: "Information — RHYTMO" },
      {
        name: "description",
        content:
          "Customer support, privacy, shipping, returns and contact details for the RHYTMO studio in São Paulo.",
      },
      { property: "og:title", content: "Information — RHYTMO" },
      {
        property: "og:description",
        content: "Support, privacy, shipping, returns and contact for RHYTMO.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: InfoPage,
});

function MailLink() {
  return (
    <a
      href={`mailto:${INFO_EMAIL}`}
      className="text-ink underline decoration-ink/40 underline-offset-4 transition-colors duration-250 hover:text-brand-indigo"
    >
      {INFO_EMAIL}
    </a>
  );
}

/** Renders a paragraph, replacing the {email} token with a mailto link. */
function Paragraph({ text }: { text: string }) {
  const parts = text.split("{email}");
  return (
    <p className="text-[0.8125rem] leading-relaxed text-ink">
      {parts.map((part, i) => (
        <span key={i}>
          {part}
          {i < parts.length - 1 && <MailLink />}
        </span>
      ))}
    </p>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="aero-glass glass-sheen rounded-3xl px-6 py-7 sm:px-9 sm:py-10">
      <h2 className="font-display text-xl leading-tight tracking-tight uppercase sm:text-2xl">
        {title}
      </h2>
      <div className="mt-5 max-w-[62ch] space-y-3">{children}</div>
    </section>
  );
}

function InfoPage() {
  const { lang } = useI18n();
  const c = INFO_CONTENT[lang];

  return (
    <main className="animate-fade-in min-h-svh w-full px-5 pt-28 pb-24 sm:px-10 lg:px-16">
      <div className="mx-auto w-full max-w-[1100px]">
        <header className="pb-10 sm:pb-14">
          <h1 className="font-display text-4xl leading-[0.9] tracking-tight uppercase sm:text-6xl lg:text-7xl">
            {c.title}
          </h1>
          <p className="mt-4 text-sm text-ink">{c.intro}</p>
        </header>

        <div className="grid gap-5 sm:gap-7">
          <Section title={c.support.title}>
            {c.support.paragraphs.map((p) => (
              <Paragraph key={p} text={p} />
            ))}
          </Section>

          <Section title={c.privacy.title}>
            {c.privacy.paragraphs.map((p) => (
              <Paragraph key={p} text={p} />
            ))}
            <ul className="space-y-2 pt-1">
              {c.privacy.uses.map((item) => (
                <li
                  key={item}
                  className="grid grid-cols-[10px_minmax(0,1fr)] gap-3 text-[0.8125rem] leading-relaxed text-ink"
                >
                  <span aria-hidden className="text-ink">
                    •
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            {c.privacy.outro.map((p) => (
              <Paragraph key={p} text={p} />
            ))}
          </Section>

          <Section title={c.shipping.title}>
            {c.shipping.paragraphs.map((p) => (
              <Paragraph key={p} text={p} />
            ))}
          </Section>

          <Section title={c.returns.title}>
            {c.returns.paragraphs.map((p) => (
              <Paragraph key={p} text={p} />
            ))}
          </Section>

          <Section title={c.contact.title}>
            <dl className="grid gap-5 sm:grid-cols-3">
              <div>
                <dt className="label-xs text-ink">{c.contact.email}</dt>
                <dd className="mt-2 text-[0.8125rem] break-words">
                  <MailLink />
                </dd>
              </div>
              <div>
                <dt className="label-xs text-ink">{c.contact.instagram}</dt>
                <dd className="mt-2 text-[0.8125rem]">
                  <a
                    href={INFO_INSTAGRAM_URL}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="text-ink underline decoration-ink/40 underline-offset-4 transition-colors duration-250 hover:text-brand-indigo"
                  >
                    {INFO_INSTAGRAM}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="label-xs text-ink">{c.contact.website}</dt>
                <dd className="mt-2 text-[0.8125rem] break-words">
                  <a
                    href={INFO_SITE_URL}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="text-ink underline decoration-ink/40 underline-offset-4 transition-colors duration-250 hover:text-brand-indigo"
                  >
                    {INFO_SITE}
                  </a>
                </dd>
              </div>
            </dl>
          </Section>
        </div>
      </div>
    </main>
  );
}
