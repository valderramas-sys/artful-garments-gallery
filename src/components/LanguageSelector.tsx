import { LANGUAGES, useI18n } from "@/lib/i18n";
import { playSettingsBeep } from "@/lib/sound";

export function LanguageSelector({ className = "" }: { className?: string }) {
  const { lang, setLang, t } = useI18n();

  const change = (code: typeof LANGUAGES[number]["code"]) => {
    if (code === lang) return;
    playSettingsBeep();
    setLang(code);
  };

  return (
    <div
      role="group"
      aria-label={t("footer.language")}
      className={`glass-soft flex w-fit items-center gap-0.5 rounded-full p-0.5 ${className}`}
    >
      {LANGUAGES.map(({ code, label, name }) => (
        <button
          key={code}
          type="button"
          title={name}
          onClick={() => setLang(code)}
          aria-pressed={lang === code}
          className={`rounded-full px-2 py-1 text-[10px] leading-none font-semibold tracking-[0.08em] transition-all duration-250 ease-[var(--ease-out-soft)] ${
            lang === code ? "glass-btn-accent" : "text-muted-foreground hover:text-brand-blue"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
