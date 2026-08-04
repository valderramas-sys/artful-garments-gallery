import type { LanguageCode } from "./i18n";

export const INFO_EMAIL = "rhytmobrasil@gmail.com";
export const INFO_INSTAGRAM = "@rhytmo__";
export const INFO_INSTAGRAM_URL = "https://www.instagram.com/rhytmo__/";
export const INFO_SITE = "www.rhytmo.com.br";
export const INFO_SITE_URL = "http://www.rhytmo.com.br";

export type InfoContent = {
  title: string;
  intro: string;
  support: { title: string; paragraphs: string[] };
  privacy: { title: string; paragraphs: string[]; uses: string[]; outro: string[] };
  shipping: { title: string; paragraphs: string[] };
  returns: { title: string; paragraphs: string[] };
  contact: { title: string; email: string; instagram: string; website: string };
};

export const INFO_CONTENT: Record<LanguageCode, InfoContent> = {
  en: {
    title: "Information",
    intro: "Support, privacy, shipping and returns.",
    support: {
      title: "Customer support",
      paragraphs: [
        "Our support team is available Monday through Friday.",
        "For questions about products, orders, shipping, or any other inquiries, contact us at {email}.",
        "We aim to respond as quickly as possible.",
      ],
    },
    privacy: {
      title: "Privacy",
      paragraphs: [
        "RHYTMO respects your privacy and handles your personal information solely to operate and improve our services.",
        "By using our website, you agree to the collection and processing of your information in accordance with this policy.",
        "Your information may be used to:",
      ],
      uses: [
        "Process and fulfill your orders.",
        "Provide customer support.",
        "Send updates regarding your purchases.",
        "Inform you about future releases, restocks, and special announcements.",
        "Improve our website, products, and customer experience.",
        "Analyze store performance and user activity.",
      ],
      outro: [
        "Your information is only shared with trusted partners when required to complete your order, including payment providers and shipping carriers.",
        "If you have any questions regarding your personal data, contact us at {email}.",
      ],
    },
    shipping: {
      title: "Shipping",
      paragraphs: [
        "Production and shipping times are listed on each product page.",
        "Some products are made to order, while others are available for immediate dispatch.",
        "International orders may be subject to customs duties, import taxes, or additional fees imposed by the destination country.",
        "These charges are determined by local authorities and remain the customer's responsibility.",
        "For updates regarding your order, contact {email} and include your order number.",
      ],
    },
    returns: {
      title: "Returns",
      paragraphs: [
        "Due to the limited nature of our releases, all sales are considered final.",
        "Please review your size selection, shipping address, and order details carefully before completing your purchase.",
        "Orders cannot be modified after they have been placed.",
        "If a package is returned because of an incorrect or incomplete address provided by the customer, the shipping cost for resending the order will be charged to the customer.",
        "Returns, exchanges, or refunds are only accepted if you receive the wrong item or a product with a manufacturing defect.",
        "In these cases, contact {email} within 7 days of delivery and include your order number along with clear photos of the issue.",
      ],
    },
    contact: {
      title: "Contact",
      email: "Email",
      instagram: "Instagram",
      website: "Website",
    },
  },
  pt: {
    title: "Informações",
    intro: "Atendimento, privacidade, envio e trocas.",
    support: {
      title: "Atendimento",
      paragraphs: [
        "Nossa equipe de atendimento está disponível de segunda a sexta-feira.",
        "Para dúvidas sobre produtos, pedidos, envio ou qualquer outro assunto, entre em contato pelo {email}.",
        "Respondemos o mais rápido possível.",
      ],
    },
    privacy: {
      title: "Privacidade",
      paragraphs: [
        "A RHYTMO respeita sua privacidade e trata seus dados pessoais exclusivamente para operar e aprimorar nossos serviços.",
        "Ao utilizar nosso site, você concorda com a coleta e o processamento das suas informações de acordo com esta política.",
        "Suas informações podem ser utilizadas para:",
      ],
      uses: [
        "Processar e enviar seus pedidos.",
        "Oferecer suporte ao cliente.",
        "Enviar atualizações sobre suas compras.",
        "Informar sobre próximos lançamentos, reposições e anúncios especiais.",
        "Aprimorar nosso site, produtos e experiência do cliente.",
        "Analisar o desempenho da loja e a atividade dos usuários.",
      ],
      outro: [
        "Suas informações só são compartilhadas com parceiros confiáveis quando necessário para concluir seu pedido, incluindo provedores de pagamento e transportadoras.",
        "Se tiver qualquer dúvida sobre seus dados pessoais, entre em contato pelo {email}.",
      ],
    },
    shipping: {
      title: "Envio",
      paragraphs: [
        "Os prazos de produção e envio estão indicados na página de cada produto.",
        "Alguns produtos são feitos sob encomenda, enquanto outros estão disponíveis para envio imediato.",
        "Pedidos internacionais podem estar sujeitos a taxas alfandegárias, impostos de importação ou tarifas adicionais aplicadas pelo país de destino.",
        "Essas cobranças são determinadas pelas autoridades locais e são de responsabilidade do cliente.",
        "Para atualizações sobre seu pedido, escreva para {email} informando o número do pedido.",
      ],
    },
    returns: {
      title: "Trocas e devoluções",
      paragraphs: [
        "Devido ao caráter limitado dos nossos lançamentos, todas as vendas são consideradas finais.",
        "Revise cuidadosamente o tamanho escolhido, o endereço de entrega e os dados do pedido antes de finalizar a compra.",
        "Os pedidos não podem ser alterados após serem realizados.",
        "Se a encomenda for devolvida por endereço incorreto ou incompleto informado pelo cliente, o custo de reenvio será cobrado do cliente.",
        "Devoluções, trocas ou reembolsos são aceitos apenas em caso de item errado ou produto com defeito de fabricação.",
        "Nesses casos, entre em contato pelo {email} em até 7 dias após a entrega, informando o número do pedido e fotos nítidas do problema.",
      ],
    },
    contact: {
      title: "Contato",
      email: "E-mail",
      instagram: "Instagram",
      website: "Site",
    },
  },
  de: {
    title: "Informationen",
    intro: "Support, Datenschutz, Versand und Rückgabe.",
    support: {
      title: "Kundenservice",
      paragraphs: [
        "Unser Support-Team ist von Montag bis Freitag erreichbar.",
        "Bei Fragen zu Produkten, Bestellungen, Versand oder anderen Anliegen schreibe uns an {email}.",
        "Wir antworten so schnell wie möglich.",
      ],
    },
    privacy: {
      title: "Datenschutz",
      paragraphs: [
        "RHYTMO respektiert deine Privatsphäre und verarbeitet deine personenbezogenen Daten ausschließlich, um unsere Services zu betreiben und zu verbessern.",
        "Mit der Nutzung unserer Website stimmst du der Erhebung und Verarbeitung deiner Daten gemäß dieser Richtlinie zu.",
        "Deine Daten können verwendet werden, um:",
      ],
      uses: [
        "Bestellungen zu bearbeiten und auszuliefern.",
        "Kundensupport bereitzustellen.",
        "Updates zu deinen Käufen zu senden.",
        "Über kommende Releases, Restocks und besondere Ankündigungen zu informieren.",
        "Website, Produkte und Kundenerlebnis zu verbessern.",
        "Shop-Performance und Nutzeraktivität zu analysieren.",
      ],
      outro: [
        "Deine Daten werden nur mit vertrauenswürdigen Partnern geteilt, wenn dies zur Abwicklung deiner Bestellung erforderlich ist, etwa mit Zahlungsanbietern und Versanddienstleistern.",
        "Bei Fragen zu deinen personenbezogenen Daten schreibe uns an {email}.",
      ],
    },
    shipping: {
      title: "Versand",
      paragraphs: [
        "Produktions- und Versandzeiten sind auf jeder Produktseite angegeben.",
        "Einige Produkte werden auf Bestellung gefertigt, andere sind sofort versandbereit.",
        "Internationale Bestellungen können Zöllen, Einfuhrsteuern oder zusätzlichen Gebühren des Ziellandes unterliegen.",
        "Diese Gebühren werden von den lokalen Behörden festgelegt und liegen in der Verantwortung der Kundin oder des Kunden.",
        "Für Updates zu deiner Bestellung schreibe an {email} und nenne deine Bestellnummer.",
      ],
    },
    returns: {
      title: "Rückgabe",
      paragraphs: [
        "Aufgrund des limitierten Charakters unserer Releases gelten alle Verkäufe als endgültig.",
        "Bitte prüfe Größe, Lieferadresse und Bestelldetails sorgfältig, bevor du den Kauf abschließt.",
        "Bestellungen können nach der Aufgabe nicht mehr geändert werden.",
        "Wird ein Paket wegen einer falschen oder unvollständigen Adresse zurückgesendet, werden die Kosten für den erneuten Versand der Kundin oder dem Kunden berechnet.",
        "Rückgaben, Umtausch oder Erstattungen sind nur möglich, wenn du einen falschen Artikel oder ein Produkt mit Herstellungsfehler erhältst.",
        "Kontaktiere in diesen Fällen {email} innerhalb von 7 Tagen nach Zustellung und sende deine Bestellnummer sowie klare Fotos des Problems.",
      ],
    },
    contact: {
      title: "Kontakt",
      email: "E-Mail",
      instagram: "Instagram",
      website: "Website",
    },
  },
  ko: {
    title: "안내",
    intro: "고객 지원, 개인정보, 배송 및 반품 안내입니다.",
    support: {
      title: "고객 지원",
      paragraphs: [
        "고객 지원팀은 월요일부터 금요일까지 운영됩니다.",
        "제품, 주문, 배송 등 문의 사항은 {email} 으로 연락해 주세요.",
        "가능한 한 빠르게 답변드리겠습니다.",
      ],
    },
    privacy: {
      title: "개인정보",
      paragraphs: [
        "RHYTMO는 고객의 개인정보를 존중하며, 서비스 운영과 개선을 위해서만 개인정보를 처리합니다.",
        "본 웹사이트를 이용함으로써 본 방침에 따른 정보 수집 및 처리에 동의하게 됩니다.",
        "수집된 정보는 다음 목적으로 사용될 수 있습니다:",
      ],
      uses: [
        "주문 처리 및 배송",
        "고객 지원 제공",
        "구매 관련 소식 전달",
        "신제품 출시, 재입고, 특별 공지 안내",
        "웹사이트, 제품 및 고객 경험 개선",
        "스토어 성과 및 이용 활동 분석",
      ],
      outro: [
        "고객 정보는 주문 처리를 위해 필요한 경우에 한해 결제 대행사와 배송사 등 신뢰할 수 있는 파트너에게만 공유됩니다.",
        "개인정보에 관한 문의는 {email} 으로 연락해 주세요.",
      ],
    },
    shipping: {
      title: "배송",
      paragraphs: [
        "제작 및 배송 기간은 각 제품 페이지에 안내되어 있습니다.",
        "일부 제품은 주문 제작이며, 일부는 즉시 발송됩니다.",
        "해외 주문의 경우 도착 국가의 관세, 수입세 또는 추가 수수료가 부과될 수 있습니다.",
        "해당 비용은 현지 기관이 결정하며 고객 부담입니다.",
        "주문 관련 문의는 주문 번호와 함께 {email} 으로 보내주세요.",
      ],
    },
    returns: {
      title: "반품",
      paragraphs: [
        "한정 수량으로 제작되는 특성상 모든 판매는 최종 확정됩니다.",
        "구매를 완료하기 전에 사이즈, 배송 주소, 주문 내역을 신중히 확인해 주세요.",
        "주문 후에는 내용을 변경할 수 없습니다.",
        "고객이 잘못되었거나 불완전한 주소를 입력하여 반송된 경우, 재발송 배송비는 고객이 부담합니다.",
        "반품, 교환, 환불은 잘못된 상품을 받았거나 제조상 결함이 있는 경우에만 가능합니다.",
        "해당 경우 배송 후 7일 이내에 주문 번호와 문제를 확인할 수 있는 선명한 사진을 첨부하여 {email} 으로 연락해 주세요.",
      ],
    },
    contact: {
      title: "연락처",
      email: "이메일",
      instagram: "인스타그램",
      website: "웹사이트",
    },
  },
};
