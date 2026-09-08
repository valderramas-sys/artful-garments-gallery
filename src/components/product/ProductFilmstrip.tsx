import { Link } from "@tanstack/react-router";
import { useCutoutImage, THUMB_CUTOUT_DIMENSION } from "@/hooks/useCutoutImage";
import { playTap } from "@/lib/sound";

type Sibling = { handle: string; title: string; image: string | null };

type Props = {
  photos: string[];
  index: number;
  onSelect: (next: number) => void;
  siblings: Sibling[];
  currentHandle: string;
  photosLabel: string;
  familyLabel: string;
};

/**
 * Conteúdo de uma miniatura — recortado, como no palco, num teto pequeno
 * (256px) porque são cinco por página e aparecem com 46px. Sem o recorte a
 * tira ficava com cinco retângulos brancos dentro de um site azul.
 */
function ThumbMedia({ src }: { src: string }) {
  const cutout = useCutoutImage(src, THUMB_CUTOUT_DIMENSION);
  if (!cutout) return <span className="pdp-thumb-loading" aria-hidden />;
  return (
    <span className="pdp-thumb-media">
      <img src={cutout.src} alt="" draggable={false} loading="lazy" />
    </span>
  );
}

/**
 * Tira inferior esquerda, no lugar em que a referência põe a dela.
 *
 * Lá são 7–8 miniaturas de variantes do mesmo produto. Aqui cada gorro tem
 * UMA variante ("Default Title") e duas fotos, então a tira faz as duas
 * coisas: à esquerda as fotos deste produto, e depois do divisor os outros
 * gorros da collab — que é o análogo honesto do carrossel de variantes, com
 * dado que existe de verdade.
 */
export function ProductFilmstrip({
  photos,
  index,
  onSelect,
  siblings,
  currentHandle,
  photosLabel,
  familyLabel,
}: Props) {
  const others = siblings.filter((s) => s.handle !== currentHandle);

  return (
    <div className="pdp-strip">
      {photos.length > 1 && (
        <div className="pdp-strip-group" aria-label={photosLabel}>
          {photos.map((src, i) => (
            <button
              key={src}
              type="button"
              aria-label={`${photosLabel} ${i + 1}`}
              aria-pressed={i === index}
              className="pdp-thumb"
              data-active={i === index || undefined}
              onClick={() => {
                if (i === index) return;
                playTap();
                onSelect(i);
              }}
            >
              <ThumbMedia src={src} />
            </button>
          ))}
        </div>
      )}

      {photos.length > 1 && others.length > 0 && <span className="pdp-strip-divider" aria-hidden />}

      {others.length > 0 && (
        <div className="pdp-strip-group" aria-label={familyLabel}>
          {others.map((item) => (
            <Link
              key={item.handle}
              to="/shop/$handle"
              params={{ handle: item.handle }}
              className="pdp-thumb pdp-thumb-sibling"
              aria-label={item.title}
              title={item.title}
              draggable={false}
              onClick={() => playTap()}
            >
              {item.image ? <ThumbMedia src={item.image} /> : null}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
