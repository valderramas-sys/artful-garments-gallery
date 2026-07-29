import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";


export const LANGUAGES = [
  { code: "pt", label: "PT", name: "Português" },
  { code: "en", label: "EN", name: "English" },
  { code: "de", label: "DE", name: "Deutsch" },
  { code: "ko", label: "KO", name: "한국어" },
] as const;

export type LanguageCode = (typeof LANGUAGES)[number]["code"];

const HTML_LANG: Record<LanguageCode, string> = {
  pt: "pt-BR",
  en: "en",
  de: "de",
  ko: "ko",
};

const DICT = {
  en: {
    "nav.home": "Home",
    "nav.shop": "Shop",
    "nav.checkout": "Checkout",
    "nav.cart": "Cart",
    "cart.open": "Open cart",
    "cart.close": "Close",
    "cart.empty": "Your cart is empty.",
    "cart.subtotal": "Subtotal",
    "cart.remove": "Remove",
    "cart.size": "Size",
    "product.add": "Add to cart",
    "product.buy": "Buy now",
    "product.quantity": "Quantity",
    "product.instock": "In stock",
    "product.left": "left",
    "product.soldout": "Sold out",
    "product.material": "Material",
    "product.care": "Care",
    "product.overview": "Overview",
    "product.specs": "Specifications",
    "product.collab": "Collaboration",
    "product.shipping": "Shipping",
    "product.quickview": "Quick view",
    "checkout.title": "Checkout",
    "checkout.back": "Back",
    "checkout.contact": "Contact",
    "checkout.email": "Email",
    "checkout.shipping": "Shipping",
    "checkout.name": "Full name",
    "checkout.address": "Address",
    "checkout.city": "City",
    "checkout.postal": "Postal code",
    "checkout.payment": "Payment",
    "checkout.card": "Card number",
    "checkout.place": "Place order",
    "checkout.summary": "Summary",
    "checkout.discount": "Discount code",
    "checkout.apply": "Apply",
    "checkout.discountapplied": "Discount applied",
    "checkout.discountinvalid": "Code not applicable",
    "checkout.securenote": "Shipping, taxes and discounts are confirmed in the secure Shopify checkout.",
    "checkout.free": "Free",
    "checkout.tax": "Estimated tax",
    "checkout.total": "Total",
    "checkout.qty": "Qty",
    "checkout.done": "Order",
    "checkout.thanks":
      "Thank you. A confirmation is on its way. Each piece is packed by hand in the studio.",
    "checkout.backshop": "Back to shop",
    "footer.language": "Language",
    "footer.payments": "Payment methods",
    "footer.shipping": "Shipping",
    "footer.brazil": "Brazil",
    "footer.brazil.copy": "Shipping costs are calculated automatically through the Correios integration during checkout. Estimated delivery time is between 2 and 15 business days depending on the destination state.",
    "footer.world": "Worldwide",
    "footer.world.copy": "International orders are shipped using Shopify's international shipping system. Estimated delivery time is between 20 and 40 business days depending on the destination country and customs processing.",
    "footer.brand": "Brand",
    "footer.brand.copy":
      "RHYTMO headquarters and inventory are located in São Paulo, Brazil. Every order ships from our studio.",
    "footer.nav": "Navigation",
    "footer.social": "Social",
    "footer.rights": "© 2026 RHYTMO.",
  },
  pt: {
    "nav.home": "Início",
    "nav.shop": "Loja",
    "nav.checkout": "Finalizar",
    "nav.cart": "Sacola",
    "cart.open": "Abrir sacola",
    "cart.close": "Fechar",
    "cart.empty": "Sua sacola está vazia.",
    "cart.subtotal": "Subtotal",
    "cart.remove": "Remover",
    "cart.size": "Tamanho",
    "product.add": "Adicionar ao carrinho",
    "product.buy": "Comprar agora",
    "product.quantity": "Quantidade",
    "product.instock": "Em estoque",
    "product.left": "restantes",
    "product.soldout": "Esgotado",
    "product.material": "Material",
    "product.care": "Cuidados",
    "product.overview": "Visão geral",
    "product.specs": "Especificações",
    "product.collab": "Colaboração",
    "product.shipping": "Envio",
    "product.quickview": "Visualização rápida",
    "checkout.title": "Finalizar",
    "checkout.back": "Voltar",
    "checkout.contact": "Contato",
    "checkout.email": "E-mail",
    "checkout.shipping": "Entrega",
    "checkout.name": "Nome completo",
    "checkout.address": "Endereço",
    "checkout.city": "Cidade",
    "checkout.postal": "CEP",
    "checkout.payment": "Pagamento",
    "checkout.card": "Número do cartão",
    "checkout.place": "Concluir pedido",
    "checkout.summary": "Resumo",
    "checkout.discount": "Cupom de desconto",
    "checkout.apply": "Aplicar",
    "checkout.discountapplied": "Cupom aplicado",
    "checkout.discountinvalid": "Cupom não aplicável",
    "checkout.securenote": "Frete, impostos e descontos são confirmados no checkout seguro da Shopify.",
    "checkout.free": "Grátis",
    "checkout.tax": "Impostos estimados",
    "checkout.total": "Total",
    "checkout.qty": "Qtd",
    "checkout.done": "Pedido",
    "checkout.thanks":
      "Obrigado. A confirmação está a caminho. Cada peça é embalada à mão no estúdio.",
    "checkout.backshop": "Voltar à loja",
    "footer.language": "Idioma",
    "footer.payments": "Formas de pagamento",
    "footer.shipping": "Envio",
    "footer.brazil": "Brasil",
    "footer.brazil.copy": "O frete é calculado automaticamente pela integração com os Correios durante o checkout. O prazo estimado de entrega é de 2 a 15 dias úteis, conforme o estado de destino.",
    "footer.world": "Internacional",
    "footer.world.copy": "Pedidos internacionais são enviados pelo sistema de envio internacional da Shopify. O prazo estimado é de 20 a 40 dias úteis, conforme o país de destino e o processamento aduaneiro.",
    "footer.brand": "Marca",
    "footer.brand.copy":
      "A sede e o estoque da RHYTMO ficam em São Paulo, Brasil. Todo pedido sai do nosso estúdio.",
    "footer.nav": "Navegação",
    "footer.social": "Redes sociais",
    "footer.rights": "© 2026 RHYTMO.",
  },
  de: {
    "nav.home": "Start",
    "nav.shop": "Shop",
    "nav.checkout": "Kasse",
    "nav.cart": "Warenkorb",
    "cart.open": "Warenkorb öffnen",
    "cart.close": "Schließen",
    "cart.empty": "Dein Warenkorb ist leer.",
    "cart.subtotal": "Zwischensumme",
    "cart.remove": "Entfernen",
    "cart.size": "Größe",
    "product.add": "In den Warenkorb",
    "product.buy": "Jetzt kaufen",
    "product.quantity": "Menge",
    "product.instock": "Auf Lager",
    "product.left": "übrig",
    "product.soldout": "Ausverkauft",
    "product.material": "Material",
    "product.care": "Pflege",
    "product.overview": "Überblick",
    "product.specs": "Spezifikationen",
    "product.collab": "Kollaboration",
    "product.shipping": "Versand",
    "product.quickview": "Schnellansicht",
    "checkout.title": "Kasse",
    "checkout.back": "Zurück",
    "checkout.contact": "Kontakt",
    "checkout.email": "E-Mail",
    "checkout.shipping": "Versand",
    "checkout.name": "Vollständiger Name",
    "checkout.address": "Adresse",
    "checkout.city": "Stadt",
    "checkout.postal": "Postleitzahl",
    "checkout.payment": "Zahlung",
    "checkout.card": "Kartennummer",
    "checkout.place": "Bestellung aufgeben",
    "checkout.summary": "Übersicht",
    "checkout.discount": "Rabattcode",
    "checkout.apply": "Anwenden",
    "checkout.discountapplied": "Rabatt angewendet",
    "checkout.discountinvalid": "Code nicht anwendbar",
    "checkout.securenote": "Versand, Steuern und Rabatte werden im sicheren Shopify-Checkout bestätigt.",
    "checkout.free": "Kostenlos",
    "checkout.tax": "Geschätzte Steuer",
    "checkout.total": "Gesamt",
    "checkout.qty": "Anzahl",
    "checkout.done": "Bestellung",
    "checkout.thanks":
      "Danke. Eine Bestätigung ist unterwegs. Jedes Stück wird im Studio von Hand verpackt.",
    "checkout.backshop": "Zurück zum Shop",
    "footer.language": "Sprache",
    "footer.payments": "Zahlungsarten",
    "footer.shipping": "Versand",
    "footer.brazil": "Brasilien",
    "footer.brazil.copy": "Die Versandkosten werden während des Checkouts automatisch über die Correios-Integration berechnet. Die geschätzte Lieferzeit beträgt 2 bis 15 Werktage je nach Zielbundesstaat.",
    "footer.world": "Weltweit",
    "footer.world.copy": "Internationale Bestellungen werden über das internationale Versandsystem von Shopify verschickt. Die geschätzte Lieferzeit beträgt 20 bis 40 Werktage je nach Zielland und Zollabfertigung.",
    "footer.brand": "Marke",
    "footer.brand.copy":
      "Hauptsitz und Lager von RHYTMO befinden sich in São Paulo, Brasilien. Jede Bestellung verlässt unser Studio.",
    "footer.nav": "Navigation",
    "footer.social": "Soziale Medien",
    "footer.rights": "© 2026 RHYTMO.",
  },
  ko: {
    "nav.home": "홈",
    "nav.shop": "쇼핑",
    "nav.checkout": "결제",
    "nav.cart": "장바구니",
    "cart.open": "장바구니 열기",
    "cart.close": "닫기",
    "cart.empty": "장바구니가 비어 있습니다.",
    "cart.subtotal": "소계",
    "cart.remove": "삭제",
    "cart.size": "사이즈",
    "product.add": "장바구니 담기",
    "product.buy": "바로 구매",
    "product.quantity": "수량",
    "product.instock": "재고 있음",
    "product.left": "개 남음",
    "product.soldout": "품절",
    "product.material": "소재",
    "product.care": "관리 방법",
    "product.overview": "개요",
    "product.specs": "제품 사양",
    "product.collab": "협업",
    "product.shipping": "배송",
    "product.quickview": "빠른 보기",
    "checkout.title": "결제",
    "checkout.back": "뒤로",
    "checkout.contact": "연락처",
    "checkout.email": "이메일",
    "checkout.shipping": "배송",
    "checkout.name": "이름",
    "checkout.address": "주소",
    "checkout.city": "도시",
    "checkout.postal": "우편번호",
    "checkout.payment": "결제 정보",
    "checkout.card": "카드 번호",
    "checkout.place": "주문하기",
    "checkout.summary": "주문 요약",
    "checkout.discount": "할인 코드",
    "checkout.apply": "적용",
    "checkout.discountapplied": "할인이 적용되었습니다",
    "checkout.discountinvalid": "사용할 수 없는 코드입니다",
    "checkout.securenote": "배송비, 세금, 할인은 Shopify 보안 결제에서 확정됩니다.",
    "checkout.free": "무료",
    "checkout.tax": "예상 세금",
    "checkout.total": "합계",
    "checkout.qty": "수량",
    "checkout.done": "주문 완료",
    "checkout.thanks": "감사합니다. 확인 메일이 곧 발송됩니다. 모든 제품은 스튜디오에서 직접 포장됩니다.",
    "checkout.backshop": "쇼핑 계속하기",
    "footer.language": "언어",
    "footer.payments": "결제 수단",
    "footer.shipping": "배송",
    "footer.brazil": "브라질",
    "footer.brazil.copy": "배송비는 결제 시 Correios 연동을 통해 자동으로 계산됩니다. 예상 배송 기간은 도착 주에 따라 2~15 영업일입니다.",
    "footer.world": "해외 배송",
    "footer.world.copy": "해외 주문은 Shopify의 국제 배송 시스템으로 발송됩니다. 예상 배송 기간은 도착 국가와 통관 처리에 따라 20~40 영업일입니다.",
    "footer.brand": "브랜드",
    "footer.brand.copy":
      "RHYTMO의 본사와 재고는 브라질 상파울루에 있습니다. 모든 주문은 스튜디오에서 발송됩니다.",
    "footer.nav": "바로가기",
    "footer.social": "소셜",
    "footer.rights": "© 2026 RHYTMO.",
  },
} as const;

export type TranslationKey = keyof (typeof DICT)["en"];

/* ---- Localised product content ------------------------------------ */

export type ProductContent = {
  overview: string;
  specs: string[];
  care: string[];
  shipping: string;
};

export const PRODUCT_CONTENT: Record<LanguageCode, ProductContent> = {
  en: {
    overview:
      "A collaborative beanie designed with stylist Paradela. Built with a relaxed silhouette, premium sweatshirt fabric and high-definition full-print sublimation.",
    specs: [
      "Collaboration: RHYTMO × Stylist @paradela",
      "Full-print sublimation",
      "50% Cotton, 49% Polyester, 1% Elastane",
      "Relaxed fit",
      "Soft-touch fabric",
      "Reinforced stitching",
      "Four-way stretch",
      "Unisex",
      "Made in Brazil",
    ],
    care: ["Cold wash", "Do not bleach", "Air dry", "Do not iron directly on the print"],
    shipping:
      "Brazil: 2–15 business days via Correios. Worldwide: 20–40 business days. Shipping and taxes are calculated at secure Shopify checkout.",
  },
  pt: {
    overview:
      "Gorro em colaboração com o stylist Paradela. Modelagem relaxada, malha moletom premium e estampa sublimada full-print em alta definição.",
    specs: [
      "Colaboração: RHYTMO × Stylist @paradela",
      "Estampa sublimada full-print",
      "50% Algodão, 49% Poliéster, 1% Elastano",
      "Modelagem relaxada",
      "Tecido com toque macio",
      "Costura reforçada",
      "Elasticidade em quatro direções",
      "Unissex",
      "Feito no Brasil",
    ],
    care: [
      "Lavar a frio",
      "Não usar alvejante",
      "Secar à sombra",
      "Não passar ferro diretamente sobre a estampa",
    ],
    shipping:
      "Brasil: 2 a 15 dias úteis pelos Correios. Internacional: 20 a 40 dias úteis. Frete e impostos são calculados no checkout seguro da Shopify.",
  },
  de: {
    overview:
      "Eine Beanie in Zusammenarbeit mit Stylist Paradela. Entspannte Silhouette, hochwertiger Sweatstoff und hochauflösender Full-Print-Sublimationsdruck.",
    specs: [
      "Kollaboration: RHYTMO × Stylist @paradela",
      "Full-Print-Sublimationsdruck",
      "50% Baumwolle, 49% Polyester, 1% Elasthan",
      "Entspannte Passform",
      "Weich anfühlender Stoff",
      "Verstärkte Nähte",
      "Vierfach dehnbar",
      "Unisex",
      "Hergestellt in Brasilien",
    ],
    care: [
      "Kalt waschen",
      "Nicht bleichen",
      "An der Luft trocknen",
      "Nicht direkt auf dem Druck bügeln",
    ],
    shipping:
      "Brasilien: 2–15 Werktage mit Correios. Weltweit: 20–40 Werktage. Versand und Steuern werden im sicheren Shopify-Checkout berechnet.",
  },
  ko: {
    overview:
      "스타일리스트 Paradela와 협업한 비니입니다. 여유로운 실루엣, 프리미엄 기모 원단, 고해상도 풀프린트 승화 전사로 완성했습니다.",
    specs: [
      "협업: RHYTMO × 스타일리스트 @paradela",
      "풀프린트 승화 전사",
      "면 50%, 폴리에스터 49%, 엘라스테인 1%",
      "릴랙스 핏",
      "부드러운 촉감의 원단",
      "보강 스티치",
      "4방향 신축성",
      "유니섹스",
      "브라질 제작",
    ],
    care: ["찬물 세탁", "표백 금지", "자연 건조", "프린트 위 직접 다림질 금지"],
    shipping:
      "브라질: Correios 배송으로 2~15 영업일. 해외: 20~40 영업일. 배송비와 세금은 Shopify 보안 결제에서 계산됩니다.",
  },
};

const TITLE_WORDS: Record<LanguageCode, Record<string, string>> = {
  en: {},
  pt: { Beanie: "Gorro" },
  de: { Beanie: "Mütze" },
  ko: { Beanie: "비니", Paradela: "파라델라" },
};

/** Localises Shopify product titles while keeping model numbers intact. */
export function localizeTitle(title: string, lang: LanguageCode) {
  const words = TITLE_WORDS[lang];
  return Object.entries(words).reduce(
    (out, [from, to]) => out.replace(new RegExp(`\\b${from}\\b`, "g"), to),
    title,
  );
}

type I18nContextValue = {
  lang: LanguageCode;
  setLang: (l: LanguageCode) => void;
  t: (key: TranslationKey) => string;
  product: ProductContent;
  localize: (title: string) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<LanguageCode>("pt");

  useEffect(() => {
    document.documentElement.lang = HTML_LANG[lang];
  }, [lang]);

  const t = useCallback((key: TranslationKey) => DICT[lang][key] ?? DICT.en[key], [lang]);

  const value = useMemo<I18nContextValue>(
    () => ({
      lang,
      setLang,
      t,
      product: PRODUCT_CONTENT[lang],
      localize: (title: string) => localizeTitle(title, lang),
    }),
    [lang, t],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
