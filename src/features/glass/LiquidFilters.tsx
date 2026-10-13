/**
 * The edge-refraction filter behind `.glass-lens` (Chromium only; see src/styles/glass.css).
 *
 * The displacement map is built inside the filter from the element's own box, so it fits
 * any size, including the dock while it magnifies: a flood of the box is blurred, its
 * gradient (a 3×3 convolution per axis) points inward from every edge and is ~0 in the
 * middle, and that drives feDisplacementMap. The backdrop bends at the rim and stays
 * true in the centre, like a thick glass lens. The red, green and blue channels bend by
 * slightly different amounts for a faint chromatic edge.
 */
export default function LiquidFilters() {
  const field = (
    <>
      <feFlood floodColor="#fff" result="box" />
      <feGaussianBlur in="box" stdDeviation="8" result="soft" />
      <feColorMatrix in="soft" type="matrix" values="0 0 0 1 0  0 0 0 1 0  0 0 0 1 0  0 0 0 0 1" result="field" />
      <feConvolveMatrix
        in="field"
        order="3"
        kernelMatrix="0 0 0  7 0 -7  0 0 0"
        divisor="1"
        bias="0.5"
        preserveAlpha="true"
        result="gx"
      />
      <feConvolveMatrix
        in="field"
        order="3"
        kernelMatrix="0 7 0  0 0 0  0 -7 0"
        divisor="1"
        bias="0.5"
        preserveAlpha="true"
        result="gy"
      />
      <feColorMatrix in="gx" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0 1" result="rx" />
      <feColorMatrix in="gy" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 0 1" result="ry" />
      <feComposite in="rx" in2="ry" operator="arithmetic" k2="1" k3="1" result="map" />
    </>
  );
  const channel = (scale: number, row: string, name: string) => (
    <>
      <feDisplacementMap
        in="SourceGraphic"
        in2="map"
        scale={scale}
        xChannelSelector="R"
        yChannelSelector="G"
        result={`d${name}`}
      />
      <feColorMatrix in={`d${name}`} type="matrix" values={row} result={`c${name}`} />
    </>
  );

  return (
    <svg width="0" height="0" aria-hidden="true" focusable="false" style={{ position: "absolute" }}>
      <filter id="lg-lens" x="0" y="0" width="1" height="1" colorInterpolationFilters="sRGB">
        {field}
        {channel(44, "1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0", "R")}
        {channel(41, "0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0", "G")}
        {channel(38, "0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0", "B")}
        <feBlend in="cR" in2="cG" mode="screen" result="rg" />
        <feBlend in="rg" in2="cB" mode="screen" />
      </filter>
    </svg>
  );
}
