// The Face's drawing (a simplified version of the extension's FaceArt): eyes, lids, brows and a
// mouth in a 1000 × 640 box. FaceSection brings it to life; the mock new tab page shows it still.
import { useId, type Ref } from 'react'
import { BROW, BROWS, EYES, LASH, LID, LID_OPEN, MOUTHS, RX, RY } from '../lib/face'

export function FaceSvg({ svgRef, className }: { svgRef?: Ref<SVGSVGElement>; className?: string }) {
  // ids must be unique per copy on the page (gradients and clip paths are looked up by id)
  const p = `f${useId().replace(/[^a-z0-9]/gi, '')}-`
  const u = (name: string) => `url(#${p}${name})`
  return (
      <svg ref={svgRef} className={className} viewBox="0 0 1000 640" aria-hidden="true" focusable="false">
        <defs>
          <radialGradient id={`${p}white`} cx="46%" cy="38%" r="70%">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="0.7" stopColor="#f4f5f8" />
            <stop offset="1" stopColor="#d6dbe4" />
          </radialGradient>
          <radialGradient id={`${p}iris`} cx="50%" cy="42%" r="58%">
            <stop offset="0" stopColor="#6b4a33" />
            <stop offset="0.72" stopColor="#3a2416" />
            <stop offset="1" stopColor="#1a0f08" />
          </radialGradient>
          <radialGradient id={`${p}socket`}>
            <stop offset="0.78" className="f-socket-in" />
            <stop offset="1" className="f-socket-out" />
          </radialGradient>
          {EYES.map((e, i) => (
            <clipPath key={i} id={`${p}eye-${i}`}>
              <ellipse cx={e.cx} cy={e.cy} rx={RX} ry={RY} />
            </clipPath>
          ))}
        </defs>

        <g className="f-head">
          {BROWS.map((b, i) => (
            <g key={i} className="f-brow" transform={`translate(${b.x} ${b.y}) scale(${i === 1 ? -1 : 1} 1)`}>
              <path d={BROW} />
            </g>
          ))}

          {EYES.map((e, i) => (
            <g key={i}>
              <ellipse className="f-socket" cx={e.cx - 8} cy={e.cy + 16} rx={RX + 22} ry={RY + 20} fill={u('socket')} />
              <ellipse cx={e.cx} cy={e.cy} rx={RX} ry={RY} fill={u('white')} />
              <g clipPath={u(`eye-${i}`)}>
                <g className="f-iris">
                  <circle cx={e.cx} cy={e.cy + 6} r={58} fill={u('iris')} />
                  <circle cx={e.cx} cy={e.cy + 6} r={28} fill="#070504" />
                  <circle cx={e.cx - 18} cy={e.cy - 14} r={13} fill="#fff" />
                  <circle cx={e.cx + 20} cy={e.cy + 24} r={5.5} fill="#fff" opacity="0.75" />
                </g>
                <g className="f-lid" transform={`translate(${e.cx} ${e.cy + LID_OPEN})`}>
                  <path className="f-lid-skin" d={LID} />
                  <path className="f-lash" d={LASH} />
                </g>
              </g>
            </g>
          ))}

          <path className="f-mouth" d={MOUTHS.smile} />
        </g>

        <g className="f-zz">
          <text x="800" y="200">
            z
          </text>
          <text x="846" y="146">
            z
          </text>
          <text x="900" y="82">
            Z
          </text>
        </g>
      </svg>
  )
}
