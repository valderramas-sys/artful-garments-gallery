# Corrigir a pré-visualização em branco

## O que está acontecendo

O site está rodando normalmente aqui dentro: quando peço a página por dentro da máquina, ela responde com o conteúdo certo (título, textos, estilos).

O problema é só no endereço da pré-visualização. Ao pedir a página pelo domínio
`id-preview--...lovable.app`, a resposta é uma recusa:

```text
403 — Blocked request. This host (...lovable.app) is not allowed.
```

Ou seja: o servidor de desenvolvimento só aceita pedidos vindos de endereços que
ele conhece, e o endereço da janela de pré-visualização não está nessa lista.
Isso apareceu porque a versão do projeto que você subiu traz uma configuração
própria, sem a parte que liberava esses endereços.

## O que vou fazer

- Liberar os endereços de pré-visualização (`.lovable.app` e o domínio próprio)
  na configuração do servidor de desenvolvimento.
- Ajustar a conexão de atualização automática para funcionar através desse
  endereço, para que as mudanças apareçam na hora, sem recarregar.
- Conferir com um pedido real pelo endereço da pré-visualização até ele
  responder com a página em vez do erro.

Nada de layout, cores, fontes, produtos ou funcionalidade muda.

## Detalhes técnicos

Em `vite.config.ts`, no bloco `server`:

- `allowedHosts`: incluir `.lovable.app` (cobre `id-preview--<id>` e
  `project--<id>-dev`) e `rhytmo.com.br` / `.rhytmo.com.br`.
- `hmr`: `{ clientPort: 443, protocol: "wss" }` quando servido atrás do proxy
  HTTPS da pré-visualização, para o websocket de HMR não tentar `ws://host:8080`.
- Manter `host: "::"` e `port: 8080` como estão.

Verificação: `curl -H "Host: id-preview--e403105b-...lovable.app"
http://localhost:8080/` deve devolver 200 com o HTML da home, e não 403.
