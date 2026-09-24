import { LOGO_DATA_URI } from '@/lib/logo'

// Marca d'água do fundo: a logo da Plura em grade, inclinada 45° e com 95%
// de transparência. Fica atrás de todo o conteúdo e não recebe cliques.
const TILE = 150
const LOGO = 46
const ladrilho = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${TILE}" height="${TILE}">` +
    `<image href="${LOGO_DATA_URI}" xlink:href="${LOGO_DATA_URI}" x="${(TILE - LOGO) / 2}" y="${(TILE - LOGO) / 2}" width="${LOGO}" height="${LOGO}"/>` +
    `</svg>`
)}`

export default function MarcaDagua() {
  return (
    <div aria-hidden className="fundo-decorativo" style={{ position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: '220vmax',
          height: '220vmax',
          transform: 'translate(-50%, -50%) rotate(45deg)',
          backgroundImage: `url("${ladrilho}")`,
          backgroundRepeat: 'repeat',
          backgroundSize: `${TILE}px ${TILE}px`,
          opacity: 0.05,
        }}
      />
    </div>
  )
}
