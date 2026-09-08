export type LensBox = { x: number; y: number; width: number; height: number };

type Props = {
  /** Imagem já recortada, na maior resolução disponível — é ela que a lente amplia. */
  src: string;
  /** Retângulo ocupado pela imagem dentro do palco, em px. */
  imageBox: LensBox;
  /** Ponteiro, em px relativos ao palco. */
  x: number;
  y: number;
  zoom: number;
  size: number;
  /** Some com a varredura animada sob prefers-reduced-motion. */
  reducedMotion: boolean;
};

/**
 * A lente de zoom — o "visor" do robô.
 *
 * A referência (somar.us) usa uma mira de arma; aqui o vocabulário é o do
 * personagem que já acompanha o cliente no site inteiro: o retângulo
 * arredondado do visor, o verde dele, as linhas de varredura do balão de
 * diálogo e os quatro cantos em L que o robô já usa (.robot-frame-corner).
 *
 * A ampliação é a matemática clássica de lupa: o fundo é a mesma imagem
 * desenhada em `zoom×` o tamanho exibido, deslocada para que o ponto sob o
 * ponteiro caia no centro da lente.
 */
export function ProductLens({ src, imageBox, x, y, zoom, size, reducedMotion }: Props) {
  const relX = x - imageBox.x;
  const relY = y - imageBox.y;

  // Fração 0–1 dentro da imagem, só para o painel de leitura.
  const u = imageBox.width > 0 ? Math.min(1, Math.max(0, relX / imageBox.width)) : 0;
  const v = imageBox.height > 0 ? Math.min(1, Math.max(0, relY / imageBox.height)) : 0;

  return (
    <div
      className="pdp-lens"
      data-still={reducedMotion || undefined}
      style={{ left: x, top: y, width: size, height: size }}
      aria-hidden
    >
      <span
        className="pdp-lens-glass"
        style={{
          backgroundImage: `url(${src})`,
          backgroundSize: `${imageBox.width * zoom}px ${imageBox.height * zoom}px`,
          backgroundPosition: `${-(relX * zoom - size / 2)}px ${-(relY * zoom - size / 2)}px`,
        }}
      />
      <span className="pdp-lens-scanlines" />
      <span className="pdp-lens-tint" />
      <span className="pdp-lens-sweep" />
      <span className="pdp-lens-cross" />
      <span className="pdp-lens-corner pdp-lens-corner-tl" />
      <span className="pdp-lens-corner pdp-lens-corner-tr" />
      <span className="pdp-lens-corner pdp-lens-corner-bl" />
      <span className="pdp-lens-corner pdp-lens-corner-br" />
      <span className="pdp-lens-readout">
        ZOOM [ {zoom.toFixed(1)}× ] &nbsp; X {u.toFixed(2)} Y {v.toFixed(2)}
      </span>
    </div>
  );
}
