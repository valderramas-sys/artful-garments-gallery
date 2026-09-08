import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { useI18n } from "@/lib/i18n";
import { playTap } from "@/lib/sound";

type TabId = "info" | "specs" | "care" | "shipping";

type Props = {
  collab: ReactNode;
  title: string;
  price: string;
  inStock: boolean;
  overview: string;
  specs: ReactNode[];
  care: string[];
  shippingText: string;
  shippingCalculator: ReactNode;
  /**
   * Chips de variante. Hoje nenhum produto tem mais de uma variante
   * ("Default Title"), então isto fica vazio — mas o seletor continua no
   * código para o dia em que a loja tiver tamanhos ou cores.
   */
  variantSelector?: ReactNode;
  quantity: number;
  maxQuantity: number;
  onQuantityChange: (next: number) => void;
  onAdd: () => void;
  onBuy: () => void;
  busy: boolean;
};

/**
 * O cartão flutuante — o mesmo papel do `.pdp-info__card` da referência
 * (vidro translúcido, raio 8px, ancorado embaixo à direita, barra de compra
 * separada logo abaixo), mas com o contorno duro e a sombra deslocada em rosa
 * que o resto do Rhytmo usa.
 *
 * As abas existem por necessidade, não por enfeite: a referência cabe numa
 * tela porque o cartão dela tem quatro linhas; aqui são 9 especificações, 4
 * cuidados, um texto de envio e a calculadora de frete inteira. Empilhar tudo
 * devolveria a página rolante de 2000px que estamos substituindo.
 */
export function ProductConsole({
  collab,
  title,
  price,
  inStock,
  overview,
  specs,
  care,
  shippingText,
  shippingCalculator,
  variantSelector,
  quantity,
  maxQuantity,
  onQuantityChange,
  onAdd,
  onBuy,
  busy,
}: Props) {
  const { t } = useI18n();
  const [tab, setTab] = useState<TabId>("info");

  // O esmaecimento da última linha só faz sentido quando há mesmo mais
  // conteúdo abaixo; aplicado sempre, ele apagava a última linha de uma aba
  // curta sem nenhum motivo.
  const panelRef = useRef<HTMLDivElement>(null);
  const [overflowing, setOverflowing] = useState(false);
  const checkOverflow = useCallback(() => {
    const el = panelRef.current;
    if (!el) return;
    setOverflowing(el.scrollHeight > el.clientHeight + 1);
  }, []);
  useLayoutEffect(checkOverflow, [checkOverflow, tab, overview, specs, care, shippingText]);
  useEffect(() => {
    window.addEventListener("resize", checkOverflow);
    return () => window.removeEventListener("resize", checkOverflow);
  }, [checkOverflow]);

  // Rótulos curtos, não os títulos completos: "Especificações" sozinho já
  // estourava a fileira num cartão de 307px (1024px de viewport), e a quarta
  // aba nascia fora da vista.
  const tabs: Array<{ id: TabId; label: string; full: string }> = [
    { id: "info", label: t("tab.info"), full: t("product.overview") },
    { id: "specs", label: t("tab.specs"), full: t("product.specs") },
    { id: "care", label: t("tab.care"), full: t("product.care") },
    { id: "shipping", label: t("tab.shipping"), full: t("product.shipping") },
  ];

  const pick = (id: TabId) => {
    if (id === tab) return;
    playTap();
    setTab(id);
  };

  return (
    <section className="pdp-console">
      <div className="pdp-card">
        <p className="pdp-eyebrow">{collab}</p>
        <h1 className="pdp-title">{title}</h1>

        <div className="pdp-priceline">
          <span className="pdp-price">{price}</span>
          <span className="pdp-stock" data-out={!inStock || undefined}>
            [ {inStock ? t("product.instock") : t("product.soldout")} ]
          </span>
        </div>

        <div className="pdp-tabs" role="tablist" aria-label={title}>
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              id={`pdp-tab-${item.id}`}
              aria-selected={tab === item.id}
              aria-controls="pdp-panel"
              aria-label={item.full}
              onClick={() => pick(item.id)}
              className="pdp-tab"
            >
              {item.label}
            </button>
          ))}
        </div>

        <div
          ref={panelRef}
          className="pdp-panel"
          id="pdp-panel"
          role="tabpanel"
          aria-labelledby={`pdp-tab-${tab}`}
          data-overflow={overflowing || undefined}
          onScroll={checkOverflow}
        >
          {tab === "info" && <p className="pdp-copy">{overview}</p>}

          {tab === "specs" && (
            <ul className="pdp-list">
              {specs.map((spec, i) => (
                <li key={i}>{spec}</li>
              ))}
            </ul>
          )}

          {tab === "care" && (
            <ul className="pdp-list">
              {care.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}

          {tab === "shipping" && (
            <>
              <p className="pdp-copy">{shippingText}</p>
              {shippingCalculator}
            </>
          )}
        </div>

        {variantSelector}

        <div className="pdp-controls">
          <span className="pdp-field">
            {t("product.quantity")} [ {String(quantity).padStart(2, "0")} ]
          </span>
          <div className="pdp-qty">
            <button
              type="button"
              aria-label={`− ${t("product.quantity")}`}
              onClick={() => {
                playTap();
                onQuantityChange(Math.max(1, quantity - 1));
              }}
            >
              −
            </button>
            <span className="font-num">{quantity}</span>
            <button
              type="button"
              aria-label={`+ ${t("product.quantity")}`}
              onClick={() => {
                playTap();
                onQuantityChange(Math.min(maxQuantity, quantity + 1));
              }}
            >
              +
            </button>
          </div>
        </div>

        <button type="button" className="pdp-buy" disabled={!inStock || busy} onClick={onBuy}>
          {t("product.buy")}
        </button>
      </div>

      {/* Separada do cartão, como na referência: o preço volta à direita da
          barra para ser a última coisa lida antes do clique. */}
      <button type="button" className="pdp-atc" disabled={!inStock || busy} onClick={onAdd}>
        <span>{t("product.add")}</span>
        <span className="pdp-atc-price font-num">{price}</span>
      </button>
    </section>
  );
}
