# Recomendações de apps de frete Shopify

## Contexto
Loja RHYTMO (streetwear), origem Bauru/SP, Brasil, com Shopify configurada para envio nacional via Correios e internacional para América do Sul, América do Norte, União Europeia e Coreia do Sul. O storefront já possui calculadora de frete integrada ao Shopify Storefront API.

## Recomendações

### Nacional (Brasil)
1. **Correios** — app nativo da Shopify para envio nacional (Mini Envios, PAC, SEDEX). Requer plano com carrier-calculated rates.
2. **Melhor Envio** — compara Correios + Jadlog/Loggi/Azul, gera etiquetas e rastreio automático.
3. **Frenet** — calculadora multi-transportadora com regras de frete grátis por CEP/peso/dimensão.
4. **Envialy** — Correios com descontos de contrato e cálculo automático no checkout.

### Internacional
1. **Easyship** — múltiplas transportadoras (DHL, FedEx, UPS, SF), mostra impostos estimados no checkout. Recomendado para os destinos atuais.
2. **DHL Express Commerce** — app oficial para envio internacional expresso.
3. **Shippo** — compara preços e imprime etiquetas para várias transportadoras internacionais.
4. **Sendcloud** — automatiza etiquetas e rastreios, forte na Europa.

## Sugestão de setup
- **Nacional:** Correios (nativo) ou Melhor Envio.
- **Internacional:** Easyship ou DHL Express Commerce.

## Nota importante
A Shopify Shipping nativa não está disponível para lojas brasileiras. A ativação dos apps deve ser feita no admin da Shopify (Configurações > Envio e entrega > Apps de envio).

## Ação proposta
Nenhuma alteração de código no storefront. As apps controlam o cálculo de frete no checkout; o storefront já envia o CEP/país e recebe as taxas atuais via Shopify Storefront API.
