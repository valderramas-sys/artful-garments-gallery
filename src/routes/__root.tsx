import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { Backdrop } from "../components/Backdrop";
import { Robot } from "../components/robot/Robot";
import { CartProvider } from "../lib/cart";
import { CurrencyProvider } from "../lib/currency";
import { Header } from "../components/Header";
import { CartDrawer } from "../components/CartDrawer";
import { Footer } from "../components/Footer";
import { I18nProvider } from "../lib/i18n";
import { useCartSync } from "../hooks/useCartSync";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-full bg-pink px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors duration-250 hover:bg-pink-deep"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-full bg-pink px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors duration-250 hover:bg-pink-deep"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-full border border-border bg-background px-5 py-2.5 text-sm font-medium text-foreground transition-colors duration-250 hover:border-pink hover:text-pink"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "author", content: "RHYTMO" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.png", type: "image/png" },
      // As três fontes que TODA página usa. Sem isto o navegador só descobre
      // que precisa delas depois de baixar e interpretar a folha de estilo —
      // duas viagens em série antes do primeiro caractere aparecer. A HSJandari
      // (coreano) fica de fora de propósito: só entra sob html[lang="ko"].
      ...["Medium", "RhytmoExtras", "NotoSans-Symbols"].map((name) => ({
        rel: "preload",
        as: "font" as const,
        type: "font/woff2",
        href: `/fonts/${name}.woff2`,
        // Obrigatório mesmo sendo mesma origem: a busca de fonte é sempre
        // anônima, e um preload sem isto vira um segundo download.
        crossOrigin: "anonymous" as const,
      })),
    ],
  }),

  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isLanding = pathname === "/";
  const isLab = pathname.startsWith("/lab");
  useCartSync();

  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <CurrencyProvider>
          <CartProvider>
            {!isLanding && (
              <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
                <Backdrop variant={isLab ? "particles" : "rings"} />
              </div>
            )}
            {/* Fora da landing apenas: a tela de abertura fica só com o logo,
                o PRESS START e o rodapé. O robô entra a partir do /lab, com a
                animação definida em `.robot-character` (styles.css) — como o
                componente só monta aqui, montar é o próprio gatilho. */}
            {!isLanding && <Robot />}
            {!isLanding && !isLab && (
              <div className="relative z-50">
                <Header />
              </div>
            )}
            {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
            <div className="relative z-10">
              <Outlet />
            </div>
            {!isLanding && !isLab && (
              <div className="relative z-10">
                <Footer />
              </div>
            )}
            {!isLanding && <CartDrawer />}
          </CartProvider>
        </CurrencyProvider>
      </I18nProvider>
    </QueryClientProvider>
  );
}
