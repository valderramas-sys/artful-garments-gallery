# Rhytmo

Standalone TanStack Start + React project. No external editor/platform
dependency — develop and build with the standard scripts in `package.json`
(`bun dev`, `bun run build`, etc.).

## Status (handoff from a code-only pass — no browser/dev-server available there)

Done and verified with `tsc --noEmit` + `eslint` (not yet visually tested in
a browser):

- **Lovable fully removed.** `vite.config.ts` rewritten without
  `@lovable.dev/vite-tanstack-config`; all 29 assets that used to live behind
  `/__l5e/assets-v1/...` (fonts, sounds, logo, backgrounds, Paradela photos)
  are now real files under `public/{fonts,sounds,logo,images}/`. Run
  `bun install` once to drop the old lockfile entries.
- **Robot assistant system** (`src/stores/robotStore.ts`,
  `src/lib/robot/*`, `src/hooks/useRobotReactions.ts`,
  `src/components/robot/Robot.tsx`): state machine with priority queue
  (never two animations at once), 39 phrases from `Frases Robo.txt`
  categorized by event, reacts to cart add/remove/abandon, product hover,
  QuickView open, checkout start. Mounted globally in `__root.tsx`. Replaced
  the old decorative, non-interactive `WelcomeRobot` that used to live in
  `Backdrop.tsx`.
- **`/lab`**: removed the central square + numbering (`.game-wheel-center`)
  from `CategoryWheel.tsx`.
- **`ProductCard.tsx`**: removed the permanent add-to-cart button and
  always-visible title/price from the shop grid (was violating the
  "no cart button in the discovery view" rule) — name/price now reveal on
  hover/focus only; buying happens in `QuickView` only.
- Audited `Header.tsx`, `CartDrawer.tsx`, and the `/lab` wheel
  (`CategoryWheel.tsx`, `GlassSphere.tsx`, `wheel-categories.ts`,
  `SwipeHint.tsx`) for decorative/non-functional buttons — none found,
  every control does something real.

## Fase 1 — bolhas de produto (done, verified live)

- Replaced the traditional grid (`ProductCard.tsx`) with a floating glass
  "bubble" discovery UI: `src/components/bubbles/BubbleField.tsx` +
  `ProductBubble.tsx`, seeded/deterministic layout+motion in
  `src/lib/bubble-layout.ts` + `src/hooks/useFloatMotion.ts` (never
  `Math.random()` — must stay SSR/CSR-hydration-safe). No price/add-to-cart at
  rest; hover/focus (desktop) or first tap (mobile, gated on `useIsMobile()`,
  keyboard bypasses via `e.detail === 0`) reveals the name only; a second
  activation pops the bubble (sound + CSS burst) and navigates to a new
  dedicated route.
- **New route `src/routes/shop_.$handle.tsx`** (the `shop_` prefix is
  deliberate — without it, TanStack Router nests `/shop/$handle` under
  `shop.tsx` as a child, and since `shop.tsx` has no `<Outlet/>` the URL
  changes but nothing renders. Learned this the hard way; don't rename it
  back to `shop.$handle.tsx`). Uses `fetchProductByHandle()`
  (`src/lib/shopify.ts`), which existed unused before this. `QuickView.tsx`
  and `ProductCard.tsx` were deleted — their logic (gallery swipe, variant
  picker, shipping calculator) moved into the new route, restyled as a full
  page with generous blank space instead of a modal.
- Product photos: real per-pixel cutout, not a CSS trick — `useCutoutImage`
  (`src/hooks/useCutoutImage.ts`) draws each photo to an offscreen canvas and
  flood-fills the background out starting from the image edges, anchored to
  one fixed reference color (average of the border pixels), not a
  neighbor-to-neighbor chain — chaining lets a smooth studio-lighting
  gradient walk the cut straight through the product; anchoring to a single
  color stops that. Works for any fairly-uniform backdrop color (white,
  beige, whatever), not just white. Known limit: if the product itself is
  the same color as the backdrop (e.g. a white beanie shot on white — this
  store has exactly that), that part of the product gets cut too, because
  there is no way to tell them apart from color alone without real
  segmentation. Cached per source URL (module-level `Map`), CORS-safe
  (Shopify CDN allows it; fails closed to the original photo otherwise).
- Bubbles are intentionally large and scattered (`bubble-sm/md/lg` clamp()
  sizes + both-axis jitter in `bubble-layout.ts`/`styles.css`) per explicit
  user feedback during Fase 1 — they're meant to dominate the shop surface
  and read as spread out, not sit in a tight grid of small icons. `shop.tsx`
  centers the whole field vertically in the viewport (`flex items-center
justify-center` on `<main>`) rather than anchoring it to the top.
- **Robot mute toggle now actually mutes.** `soundEnabled` (robotStore) was
  only ever read by the UI button — `src/lib/sound.ts`'s `play()`/`playTap()`
  never checked it, so muting was cosmetic. Both now bail out early when
  `useRobotStore.getState().soundEnabled` is false.
- **Backdrop depth**: added cursor-parallax (`Backdrop.tsx` tracks
  `pointermove`, writes `--parallax-x/-y` custom properties consumed by
  `.game-sky`/`.game-castle`/`.game-city`/`.game-particles` in `styles.css`,
  each at a different depth factor). Skipped under `prefers-reduced-motion`
  (listener never attaches) and mouse-only (`e.pointerType !== "mouse"`
  guard, so it's a no-op on touch). `.game-orbit` was deliberately left out
  — it already has a static `rotate()` transform per ring and adding a
  second `transform` declaration on the same element would have clobbered
  it, not composed with it.
- **Bubble pop now has its own sound** (`playSettingsBeep()`, the
  `beep-ploc.mp3` clip) instead of reusing `playPopupOpen()`, which stays
  reserved for the robot's speech bubble — the two events read as distinct
  now instead of sharing one generic "surface opened" cue. Still not a
  custom-recorded SFX (no new audio assets were generated), just a better
  reuse of what already existed in `public/sounds/`.
- **Logo files evaluated, none wired in.** Looked at all four root-level
  candidates (`RhytmoLogo999.png`, `RRR.png`, `rrrrrrrrr.png`,
  `LogoRhytmo55.png`) against the live site. `RRR.png` is effectively blank
  (nothing renders even against a dark background — check before assuming
  it's usable). The other three are graffiti-bubble or anime/racing style
  wordmarks that don't match the retro-pixel/liquid-glass language already
  built out across the site (`.game-start-logo` on `/`, `Rhytmo Pixel` font,
  the abstract squiggle mark in `public/logo/RhytmoPrincipal_Logo.svg` used
  by `Logo.tsx`) — forcing one in would read as pasted-on rather than
  authored, which the brief explicitly warns against. Left the existing
  landing-page pixel-text wordmark (`.game-start-logo` in `styles.css`) and
  header icon mark as they are. Revisit only if the user provides a logo
  actually drawn in the site's own style, not from this batch.
- **Full responsive matrix run** (320/360/390/414/430/768/1280 × `/`, `/shop`,
  `/shop/$handle`, `/lab`, `/checkout`, `/info`): no real horizontal overflow
  anywhere (`document.documentElement.scrollWidth` vs `clientWidth`, not
  `innerWidth` — the latter double-counts the scrollbar and gives false
  positives at 768px). Cart add/remove and keyboard focus on bubbles
  (aria-label, focus-visible ring) verified live too.
- **Found and fixed a real overflow bug the scrollWidth check couldn't see**:
  the robot's speech bubble (`.retro-dialogue`) was cut off at the viewport
  edge below ~700px. Root cause was two-layer: (1) its mobile CSS rule used
  `left: calc(100% + 12px)` + `width: min(78vw, 390px)`, positioned relative
  to the robot's own ~150px-wide box — there's no room beside the robot for
  a 390px bubble on a 320-430px phone, by construction; (2) switching it to
  `position: fixed; left/right: 14px` (viewport-relative, so width is always
  `100vw - 28px`, immune to screen size) didn't work at first either,
  because `.welcome-robot` (an ancestor) had `filter: drop-shadow(...)` —
  per the CSS spec, a `filter` on an ancestor creates a new containing block
  for `position: fixed` descendants, so the "fixed" bubble was still being
  measured against the tiny robot box instead of the viewport. Fixed by
  moving the filter onto a new inner `.robot-character` wrapper (just the
  shadow/frame/art/sound-toggle) so `.retro-dialogue`, now a sibling outside
  that wrapper, resolves against the real viewport. **Why the automated
  scrollWidth check missed it**: content overflowing a `position: fixed`
  element doesn't expand `document.documentElement.scrollWidth` the way
  static/absolute content does — fixed elements are viewport-relative, not
  document-relative, so the browser doesn't count their overflow toward
  page scroll dimensions. Visual screenshots at each breakpoint are still
  necessary; scrollWidth alone isn't sufficient proof.
- **Found and fixed a real gap against the Fase 1 plan**: the plan (§8)
  called for `reactRobot("curious")` on bubble hover/focus, matching the old
  `ProductCard.tsx`'s behavior, but `ProductBubble.tsx` only ever called
  `reactRobot("discovering")` on pop — hover/focus never reacted. Added the
  missing calls in `onMouseEnter`/`onFocus`. Verified live via
  `.retro-dialogue-type`'s text (`BOT // CURIOUS`) after a real hover.

## Known gaps / needs a real browser to finish safely

- **Typography pairing** (section 9) and **liquid-glass balance beyond the
  shop bubbles** (section 6, e.g. header/footer/checkout) haven't been
  revisited yet — needs a live preview to calibrate.
- **8 unused media files** were recovered but never wired into any component
  (no existing code referenced them, so nothing was assumed): sitting in
  `public/media/` — `hero.gif/mp4/webm`, `hero-poster.webp`, `bubbles_10.png`,
  `liam_10.jpg`, `perfect_hue_1.jpg`, `shop-bg.gif`, `windows_xp_31.jpg`.
  Also `public/fonts/vipnagorgialla.regular.otf` has no `@font-face` pointing
  at it. Ask the user before wiring these in — they may be leftovers from an
  earlier design iteration, not necessarily meant for the current direction.
- **`purchaseComplete` robot phrase is wired nowhere.** Checkout hands off
  entirely to Shopify's hosted checkout with no return/confirmation route in
  this app, so there's no reliable signal that a purchase actually completed.
  Wire it up if/when a `return_url` confirmation page is added.
