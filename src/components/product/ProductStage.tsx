import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useCutoutImage, PDP_CUTOUT_DIMENSION } from "@/hooks/useCutoutImage";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { playSwipe, playTap } from "@/lib/sound";
import { ProductLens, type LensBox } from "./ProductLens";

const MIN_ZOOM = 1.5;
const DEFAULT_ZOOM = 2;
/** Arrasto (px) a partir do qual o gesto vira troca de foto em vez de clique. */
const SWIPE_THRESHOLD = 44;
/**
 * Quanto da ÁREA do quadro a silhueta do produto deve ocupar.
 *
 * Era uma altura-alvo com um teto de largura, e o resultado é que cada tipo de
 * foto acabava normalizado num eixo diferente: os gorros batiam no teto de
 * largura e a altura saía do capricho de cada foto (medido a 1440: 334 a 383px,
 * 15% de diferença), e as modelos batiam na altura-alvo e a largura variava 23%
 * — a modelo do 0.3, que não tem cabelo comprido esvoaçando, entrava com 473px
 * contra 578px das outras. Passando pela sequência inteira, as peças chegavam
 * com pesos visivelmente diferentes.
 *
 * Área resolve isso: formas de proporções diferentes passam a ocupar a mesma
 * mancha na tela, que é o que o olho lê como "do mesmo tamanho". Os dois
 * valores são os das peças tomadas como referência, medidas como estavam — o
 * gorro do 0.1 (0,272 do quadro) e a modelo do 0.4 (0,603) — então essas duas
 * não mudam de tamanho e as outras se alinham a elas.
 */
const TARGET_AREA = 0.272;
/**
 * As modelos vinham a 0,603 e, mesmo com o quadro rebaixado, a mais alta delas
 * chegava perto demais da legenda no topo. Um passo a menos aqui as afasta sem
 * mexer nos gorros, que não têm esse problema — eles nunca passam de 58% da
 * altura do quadro.
 */
const TARGET_AREA_CROPPED = 0.56;
/**
 * Travas de segurança, não alvos: existem para nenhuma silhueta transbordar o
 * quadro (e, na largura, para não avançar na direção do cartão). No caso comum
 * a área manda; a única peça do catálogo que encosta numa trava é a modelo do
 * 0.3, alta e estreita demais para caber na área cheia sem passar da altura.
 *
 * A trava de largura era 0,55 e passou a 0,62 porque nos quadros mais estreitos
 * (1024 e no celular) ela pegava no gorro do 0.4, o mais achatado do catálogo,
 * e reintroduzia justamente a diferença de tamanho que a área veio corrigir:
 * medido, a área dele caía para 0,247 contra 0,274 dos outros. A 0,62 os quatro
 * batem 0,272–0,275 em todas as larguras, e o quadro já exclui o cartão, então
 * a folga para ele não muda (125px a 1024, 197px a 1440).
 */
const MAX_HEIGHT = 0.72;
const MAX_WIDTH = 0.62;
const MAX_HEIGHT_CROPPED = 1;
/**
 * 0,74 e não 0,78: a modelo mais larga chegava a encostar na seta no celular
 * (medido: 2px de sobreposição a 390), onde o quadro é estreito e a seta é
 * grande em proporção. Nas larguras de desktop a trava nem chega a pegar — lá a
 * mais larga fica em 0,66 — então isto só corta o caso extremo do celular.
 */
const MAX_WIDTH_CROPPED = 0.74;
/**
 * Quanto a lente pode passar da resolução real da foto antes de virar borrão.
 * A foto-mestra da Shopify tem 1536×1920, então acima de um certo ponto o
 * zoom deixa de revelar detalhe e passa a inventar pixel — a 4× ele estava
 * ampliando 2,15× além do original e a estampa saía macia. O teto abaixo é
 * calculado da própria imagem, então melhora sozinho se um dia subirem fotos
 * maiores para a loja.
 */
const UPSCALE_HEADROOM = 1.35;
const ZOOM_CEILING = 4;
/**
 * Quando uma aresta da silhueta conta como CORTADA pelo enquadramento.
 *
 * A régua era só "a silhueta encosta na borda da foto", e ela quebrou quando as
 * editoriais passaram a vir recortadas de fora: a da 0.4 saiu com 4,6% de
 * margem transparente embaixo, então o ombro cortado dela não encostava em nada
 * e ficava sem esfumado — a peça terminava numa linha reta contra o azul.
 *
 * Agora são dois testes, e é preciso passar nos dois. Medido nas oito paradas:
 *
 *   base da silhueta   preenchimento da última fileira
 *   modelos  0,958–1,000            1,00
 *   gorros   0,656–0,677            0,09–0,98
 *
 * Sozinho, "perto da borda" marcaria o TOPO das modelas (a 2–5% da borda), que é
 * cabeça arredondada e não corte. Sozinho, "fileira reta" marcaria a barra de
 * dois gorros, que é reta mas fica a 33% da borda. Juntos, acertam os oito.
 */
const CUT_NEAR_EDGE = 0.06;
const CUT_FLATNESS = 0.5;
/** Profundidade do esfumado, em fração da foto. */
const FADE_Y = 0.1;
const FADE_X = 0.07;
/** Alfa mínimo (0–255) da máscara do recorte para o ponteiro contar como "sobre o produto". */
const MASK_HIT_THRESHOLD = 60;
/**
 * Quanto dura a saída da peça atual quando uma seta troca de produto. A
 * navegação é disparada no fim dela, e não no clique: assim a peça sai de cena
 * inteira antes de a próxima começar a chegar.
 */
const SLIDE_OUT_MS = 240;
/**
 * Prazo máximo esperando a foto seguinte ficar pronta. O recorte da vizinha
 * costuma já estar no cache (a rota adianta os dois vizinhos, ver
 * prewarmCutout), mas se a consulta falhar o palco não pode ficar vazio para
 * sempre — passado o prazo a peça atual volta ao lugar.
 */
const SLIDE_TIMEOUT_MS = 2200;

/** Troca de produto em andamento: para que lado, e em que metade do caminho. */
type Slide = { dir: 1 | -1; phase: "out" | "in" };

/** Quais arestas da silhueta são corte do enquadramento (ver CUT_NEAR_EDGE). */
type EdgeCuts = { top: boolean; bottom: boolean; left: boolean; right: boolean };

/**
 * Lê a máscara de alfa que o recorte devolve e decide, aresta por aresta, se
 * aquilo é um corte ou o fim natural da peça. A máscara é grosseira (48×48) de
 * propósito, e serve: a diferença entre um ombro cortado e o topo de uma cabeça
 * é de 0,05 para 1,00 no preenchimento da fileira extrema.
 */
function findEdgeCuts(mask: Uint8ClampedArray | null | undefined, size: number): EdgeCuts | null {
  if (!mask || !size) return null;
  const on = (x: number, y: number) => mask[y * size + x] > MASK_HIT_THRESHOLD;

  let minX = size;
  let maxX = -1;
  let minY = size;
  let maxY = -1;
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      if (!on(x, y)) continue;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
  if (maxX < 0) return null;

  const boxW = maxX - minX + 1;
  const boxH = maxY - minY + 1;
  const rowFill = (y: number) => {
    let n = 0;
    for (let x = 0; x < size; x += 1) if (on(x, y)) n += 1;
    return n / boxW;
  };
  const colFill = (x: number) => {
    let n = 0;
    for (let y = 0; y < size; y += 1) if (on(x, y)) n += 1;
    return n / boxH;
  };

  return {
    top: minY / size <= CUT_NEAR_EDGE && rowFill(minY) >= CUT_FLATNESS,
    bottom: (maxY + 1) / size >= 1 - CUT_NEAR_EDGE && rowFill(maxY) >= CUT_FLATNESS,
    left: minX / size <= CUT_NEAR_EDGE && colFill(minX) >= CUT_FLATNESS,
    right: (maxX + 1) / size >= 1 - CUT_NEAR_EDGE && colFill(maxX) >= CUT_FLATNESS,
  };
}

type Props = {
  photos: string[];
  index: number;
  onIndexChange: (next: number) => void;
  alt: string;
  /** Legenda curta mostrada sob o produto quando a lente está fechada. */
  hint: string;
  scanLabel: string;
  /** Navegação entre PRODUTOS (a família da collab), não entre fotos. */
  onPrev?: () => void;
  onNext?: () => void;
  prevLabel: string;
  nextLabel: string;
};

/**
 * O palco: o produto flutuando sobre a luz, sem moldura.
 *
 * A foto da Shopify vem com fundo branco, o que abria um retângulo claro no
 * meio de um site azul. O recorte é o mesmo `useCutoutImage` que as bolhas da
 * loja já usam, só que com o teto de resolução no tamanho nativo — aqui é uma
 * foto só, exibida grande, e a lente precisa de pixels de verdade.
 */
export function ProductStage({
  photos,
  index,
  onIndexChange,
  alt,
  hint,
  scanLabel,
  onPrev,
  onNext,
  prevLabel,
  nextLabel,
}: Props) {
  const reducedMotion = usePrefersReducedMotion();
  const stageRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);

  const photo = photos[index] ?? photos[0] ?? null;
  const cutout = useCutoutImage(photo, PDP_CUTOUT_DIMENSION);
  const shown = cutout?.src;

  const [scanning, setScanning] = useState(false);
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [pointer, setPointer] = useState({ x: 0, y: 0 });
  const [imageBox, setImageBox] = useState<LensBox>({ x: 0, y: 0, width: 0, height: 0 });
  const [fit, setFit] = useState({ scale: 1, tx: 0, ty: 0 });
  const [ratio, setRatio] = useState(0.8);
  const [naturalWidth, setNaturalWidth] = useState(0);
  const [overProduct, setOverProduct] = useState(false);
  const [slide, setSlide] = useState<Slide | null>(null);

  const maxZoom = useMemo(() => {
    if (!naturalWidth || imageBox.width <= 0) return DEFAULT_ZOOM;
    const honest = (naturalWidth * UPSCALE_HEADROOM) / imageBox.width;
    return Math.max(MIN_ZOOM + 0.4, Math.min(ZOOM_CEILING, honest));
  }, [naturalWidth, imageBox.width]);

  // Se a foto trocar para uma de resolução menor, o zoom atual pode ficar
  // acima do novo teto.
  useEffect(() => {
    setZoom((z) => Math.min(z, maxZoom));
  }, [maxZoom]);

  const cuts = useMemo(() => findEdgeCuts(cutout?.mask, cutout?.maskSize ?? 0), [cutout]);

  /**
   * A peça foi cortada pelo enquadramento em pelo menos um lado.
   *
   * É o sinal que separa a editorial (modelo cortada nos ombros) do gorro solto
   * (termina folgado por todos os lados) sem precisar marcar o tipo da foto na
   * mão. Governa duas coisas: o tamanho na tela e o esfumado.
   */
  const isCropped = Boolean(cuts && (cuts.top || cuts.bottom || cuts.left || cuts.right));

  /**
   * Esfumado das arestas cortadas.
   *
   * O degradê é ancorado na SILHUETA, não na borda da foto. Ancorado na borda,
   * uma peça que termina antes dela — a 0.4 acaba a 95,8% da altura — recebia o
   * esfumado no lugar errado e ainda aparecia com a aresta a quase metade da
   * opacidade. Assim o ponto transparente cai exatamente onde a peça acaba.
   */
  const edgeFade = useMemo(() => {
    const box = cutout?.bbox;
    if (!box || !cuts) return null;
    const pct = (v: number) => `${(v * 100).toFixed(1)}%`;
    const layers: string[] = [];
    if (cuts.top) {
      layers.push(
        `linear-gradient(to bottom, transparent ${pct(box.y)}, black ${pct(box.y + FADE_Y)})`,
      );
    }
    if (cuts.bottom) {
      const at = box.y + box.height;
      layers.push(`linear-gradient(to bottom, black ${pct(at - FADE_Y)}, transparent ${pct(at)})`);
    }
    if (cuts.left) {
      layers.push(
        `linear-gradient(to right, transparent ${pct(box.x)}, black ${pct(box.x + FADE_X)})`,
      );
    }
    if (cuts.right) {
      const at = box.x + box.width;
      layers.push(`linear-gradient(to right, black ${pct(at - FADE_X)}, transparent ${pct(at)})`);
    }
    if (layers.length === 0) return null;
    const image = layers.join(", ");
    const composite = layers.map(() => "intersect").join(", ");
    return {
      maskImage: image,
      WebkitMaskImage: image,
      maskComposite: composite,
      WebkitMaskComposite: layers.map(() => "source-in").join(", "),
    } as const;
  }, [cutout, cuts]);

  /**
   * O ponteiro está sobre o PRODUTO, e não só sobre o palco.
   *
   * Usa a máscara de alfa 48×48 que o recorte já devolve — a mesma que as
   * bolhas da loja usam para o hover. Sem isto a lente abria em qualquer
   * ponto do palco, inclusive no vazio ao lado do gorro.
   */
  const isOverProduct = useCallback(
    (x: number, y: number) => {
      const mask = cutout?.mask;
      const size = cutout?.maskSize ?? 0;
      if (!mask || !size || imageBox.width <= 0 || imageBox.height <= 0) return false;
      const u = (x - imageBox.x) / imageBox.width;
      const v = (y - imageBox.y) / imageBox.height;
      if (u < 0 || u > 1 || v < 0 || v > 1) return false;
      const mx = Math.min(size - 1, Math.max(0, Math.floor(u * size)));
      const my = Math.min(size - 1, Math.max(0, Math.floor(v * size)));
      return mask[my * size + mx] >= MASK_HIT_THRESHOLD;
    },
    [cutout, imageBox],
  );

  const lensSize = useMemo(() => {
    if (typeof window === "undefined") return 224;
    return window.innerWidth < 640 ? 150 : 224;
  }, []);

  /**
   * Duas contas numa só.
   *
   * 1. A foto é `object-fit: contain` dentro do quadro, então o retângulo que
   *    ela realmente ocupa não é o quadro — é o quadro recortado pela
   *    proporção. A lente amplia contra ESSE retângulo, senão o ponto sob o
   *    ponteiro sai do lugar.
   *
   * 2. O recorte devolve a foto no tamanho original, com o produto ocupando
   *    só um pedaço dela e o resto transparente — por isso o gorro saía
   *    pequeno no meio de um palco vazio. `cutout.bbox` diz onde o produto
   *    realmente está; daí sai a escala que o faz ocupar a altura pedida e a
   *    translação que centraliza o produto (não a foto) no quadro.
   */
  const measure = useCallback(() => {
    const stage = stageRef.current;
    const frame = frameRef.current;
    if (!stage || !frame) return;
    const s = stage.getBoundingClientRect();
    const f = frame.getBoundingClientRect();
    if (f.width === 0 || f.height === 0) return;

    const r = cutout?.aspectRatio || ratio || 0.8;
    const frameRatio = f.width / f.height;
    const cw = frameRatio > r ? f.height * r : f.width;
    const ch = frameRatio > r ? f.height : f.width / r;

    const box = cutout?.bbox ?? null;
    let scale = 1;
    let tx = 0;
    let ty = 0;
    if (box && box.width > 0 && box.height > 0) {
      const targetArea = isCropped ? TARGET_AREA_CROPPED : TARGET_AREA;
      const maxH = isCropped ? MAX_HEIGHT_CROPPED : MAX_HEIGHT;
      const maxW = isCropped ? MAX_WIDTH_CROPPED : MAX_WIDTH;
      // A escala entra ao quadrado na área, daí a raiz.
      scale = Math.sqrt((targetArea * f.width * f.height) / (box.width * cw * box.height * ch));
      scale = Math.min(scale, (maxH * f.height) / (box.height * ch));
      scale = Math.min(scale, (maxW * f.width) / (box.width * cw));
      // Leva o centro do PRODUTO ao centro do quadro.
      tx = cw * scale * (0.5 - (box.x + box.width / 2));
      ty = ch * scale * (0.5 - (box.y + box.height / 2));
    }
    setFit({ scale, tx, ty });

    // Onde a foto inteira acaba desenhada depois da transformação — a escala
    // acontece em torno do centro do quadro (transform-origin padrão).
    const cx = f.x - s.x + f.width / 2;
    const cy = f.y - s.y + f.height / 2;
    setImageBox({
      x: cx - (cw * scale) / 2 + tx,
      y: cy - (ch * scale) / 2 + ty,
      width: cw * scale,
      height: ch * scale,
    });
  }, [cutout, ratio, isCropped]);

  useEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure]);

  const closeScan = useCallback(() => setScanning(false), []);

  useEffect(() => {
    if (!scanning) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeScan();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [scanning, closeScan]);

  // Trocar de foto fecha a lente: ela está ampliando a imagem antiga. Observa
  // a FOTO e não só o índice, porque trocar de produto pela seta mantém o
  // índice em 0 e mesmo assim põe outra imagem embaixo da lente.
  useEffect(() => closeScan(), [index, photo, closeScan]);

  /**
   * Troca de produto pelas setas, em duas metades.
   *
   * A rota não é trocada no clique: primeiro a peça atual sai de cena na
   * direção do gesto (SLIDE_OUT_MS), e só então navegamos. A segunda metade não
   * é agendada por tempo, e sim pela chegada do RECORTE da próxima foto — é o
   * que impede a peça nova de entrar pela metade, ou de a entrada acontecer com
   * o palco ainda vazio. Enquanto o recorte novo não resolve, `useCutoutImage`
   * segura o resultado anterior, então quem está por baixo da camada que já
   * saiu continua sendo a peça antiga, e não um vazio.
   */
  const slideTimers = useRef<number[]>([]);
  const slideToken = useRef(0);
  const lastShown = useRef<string | undefined>(undefined);

  useEffect(
    () => () => {
      slideTimers.current.forEach((id) => window.clearTimeout(id));
    },
    [],
  );

  useEffect(() => {
    if (!shown || lastShown.current === shown) return;
    const isFirst = lastShown.current === undefined;
    lastShown.current = shown;
    if (isFirst) return;
    setSlide((s) => (s && s.phase === "out" ? { dir: s.dir, phase: "in" } : s));
  }, [shown]);

  const goNeighbour = (dir: 1 | -1, go: () => void, sound: () => void = playTap) => {
    sound();
    if (reducedMotion) {
      go();
      return;
    }
    // Um segundo clique enquanto a peça ainda está saindo viraria duas
    // navegações para o mesmo destino visual — deixa a saída terminar.
    if (slide?.phase === "out") return;
    closeScan();
    setSlide({ dir, phase: "out" });
    const token = slideToken.current + 1;
    slideToken.current = token;
    slideTimers.current.push(
      window.setTimeout(go, SLIDE_OUT_MS),
      window.setTimeout(() => {
        if (slideToken.current === token) setSlide(null);
      }, SLIDE_TIMEOUT_MS),
    );
  };

  const swipe = useRef({ x: 0, y: 0, active: false, fired: false });

  const localPoint = (clientX: number, clientY: number) => {
    const stage = stageRef.current;
    if (!stage) return { x: 0, y: 0 };
    const r = stage.getBoundingClientRect();
    return { x: clientX - r.x, y: clientY - r.y };
  };

  /**
   * O arrasto anda pelo MESMO percurso das setas — todas as fotos de todos os
   * gorros da collab, em círculo — e não só pelas duas fotos do produto aberto.
   * Antes eram dois gestos com alcances diferentes na mesma peça: a seta trocava
   * de produto e o arrasto trocava de foto, e o arrasto ainda travava nas
   * pontas. Agora é o mesmo movimento, com a mesma animação.
   */
  const step = (dir: 1 | -1) => {
    const go = dir > 0 ? onNext : onPrev;
    if (!go) return;
    goNeighbour(dir, go, playSwipe);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    swipe.current = { x: e.clientX, y: e.clientY, active: true, fired: false };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const p = localPoint(e.clientX, e.clientY);
    setOverProduct(isOverProduct(p.x, p.y));
    if (scanning) {
      setPointer(p);
      return;
    }
    const s = swipe.current;
    if (!s.active || s.fired) return;
    const dx = e.clientX - s.x;
    if (Math.abs(dx) > SWIPE_THRESHOLD && Math.abs(dx) > Math.abs(e.clientY - s.y)) {
      s.fired = true;
      step(dx < 0 ? 1 : -1);
    }
  };

  const onPointerUp = (e: React.PointerEvent) => {
    const s = swipe.current;
    swipe.current.active = false;
    // Um arrasto que trocou a foto nunca deve também abrir a lente.
    if (s.fired || !shown) return;
    const moved = Math.hypot(e.clientX - s.x, e.clientY - s.y);
    if (moved > 8) return;
    const p = localPoint(e.clientX, e.clientY);
    // A lente só existe sobre o produto: clicar no vazio do palco fecha, se
    // estiver aberta, e nunca abre.
    if (!isOverProduct(p.x, p.y)) {
      if (scanning) closeScan();
      return;
    }
    playTap();
    measure();
    setPointer(p);
    setScanning((on) => !on);
  };

  // Enquanto a lente está aberta a roda ajusta a ampliação em vez de rolar a
  // página — é o gesto que a referência usa e o que a mão espera aqui.
  const onWheel = (e: React.WheelEvent) => {
    if (!scanning) return;
    e.preventDefault();
    setZoom((z) => Math.min(maxZoom, Math.max(MIN_ZOOM, z - e.deltaY * 0.004)));
  };

  useEffect(() => {
    const el = stageRef.current;
    if (!el || !scanning) return;
    const block = (e: WheelEvent) => e.preventDefault();
    el.addEventListener("wheel", block, { passive: false });
    return () => el.removeEventListener("wheel", block);
  }, [scanning]);

  return (
    <div
      ref={stageRef}
      className="pdp-stage-media"
      data-scanning={scanning || undefined}
      data-over={overProduct || undefined}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={() => {
        swipe.current.active = false;
        setOverProduct(false);
      }}
      onPointerLeave={() => {
        swipe.current.active = false;
        setOverProduct(false);
        if (scanning) closeScan();
      }}
      onWheel={onWheel}
    >
      <div className="pdp-light" aria-hidden />

      <div ref={frameRef} className="pdp-photo-frame">
        {/* Camada só da transição. O `transform` da própria foto é a conta de
            encaixe do recorte (ver measure), então um keyframe que também
            mexesse em transform apagaria o encaixe — daí a camada extra, que
            não entra em nenhuma medição porque o quadro medido é o pai. */}
        <div
          className="pdp-photo-slide"
          data-slide={slide ? `${slide.phase}-${slide.dir > 0 ? "next" : "prev"}` : undefined}
          onAnimationEnd={(e) => {
            // A foto lá dentro tem a própria animação de entrada, e ela borbulha
            // até aqui — só o fim da animação DESTA camada encerra a troca.
            if (e.target !== e.currentTarget) return;
            setSlide((s) => (s?.phase === "in" ? null : s));
          }}
        >
          {shown ? (
            <img
              key={shown}
              src={shown}
              alt={alt}
              draggable={false}
              onLoad={(e) => {
                const el = e.currentTarget;
                if (el.naturalHeight) setRatio(el.naturalWidth / el.naturalHeight);
                setNaturalWidth(el.naturalWidth);
                measure();
              }}
              className="pdp-photo"
              style={{
                transform: `translate(${fit.tx}px, ${fit.ty}px) scale(${fit.scale})`,
                ...(edgeFade ?? {}),
              }}
            />
          ) : (
            <span className="pdp-photo-placeholder" aria-label={alt} role="img" />
          )}
        </div>
      </div>

      {scanning && overProduct && shown && imageBox.width > 0 && (
        <ProductLens
          src={shown}
          imageBox={imageBox}
          x={pointer.x}
          y={pointer.y}
          zoom={zoom}
          size={lensSize}
          reducedMotion={reducedMotion}
        />
      )}

      {/* Setas ladeando a peça: andam pelo percurso da collab (fotos e
          produtos), sem voltar para a loja. Ficam fora do fluxo de ponteiro do
          palco (stopPropagation no pointerup) para não abrirem a lente por
          tabela.

          Vivem num trilho que copia os recuos do quadro da foto, e não do palco
          inteiro: presas ao palco elas iam parar nas bordas da tela, longe
          demais da peça. */}
      <div className="pdp-nav-rail" aria-hidden={!onPrev && !onNext}>
        {onPrev && (
          <button
            type="button"
            className="pdp-nav pdp-nav-prev"
            aria-label={prevLabel}
            onPointerUp={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => goNeighbour(-1, onPrev)}
          >
            <svg viewBox="0 0 24 24" aria-hidden>
              <path d="M15 5 8 12l7 7" />
            </svg>
          </button>
        )}
        {onNext && (
          <button
            type="button"
            className="pdp-nav pdp-nav-next"
            aria-label={nextLabel}
            onPointerUp={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => goNeighbour(1, onNext)}
          >
            <svg viewBox="0 0 24 24" aria-hidden>
              <path d="m9 5 7 7-7 7" />
            </svg>
          </button>
        )}
      </div>

      <p className="pdp-stage-hint" aria-hidden>
        {scanning ? scanLabel : hint}
      </p>
    </div>
  );
}
