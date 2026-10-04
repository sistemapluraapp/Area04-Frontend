'use client'

import { useEffect, useRef, useState } from 'react'
import {
  IconAirBalloon, IconAnchor, IconBackpack, IconBeach, IconBed, IconBike, IconBinoculars, IconBuilding,
  IconBuildingAirport, IconBuildingArch, IconBuildingBridge2, IconBuildingCarousel, IconBuildingCastle,
  IconBuildingChurch, IconBuildingCircus, IconBuildingCottage, IconBuildingLighthouse, IconBuildingMonument,
  IconBuildingMosque, IconBuildingPavilion, IconBuildingSkyscraper, IconBuildingStadium, IconBus, IconBusStop,
  IconCactus, IconCalendarEvent, IconCamera, IconCamper, IconCampfire, IconCar, IconCaravan, IconCoffee,
  IconCompass, IconCreditCard, IconDirections, IconEPassport, IconFish, IconFlower, IconGasStation,
  IconGlassCocktail, IconGlobe, IconHelicopter, IconHotelService, IconIceCream, IconKayak, IconLuggage, IconMap,
  IconMap2, IconMapPin, IconMapPins, IconMapRoute, IconMasksTheater, IconMotorbike, IconMountain, IconPhoto,
  IconPlane, IconPlaneArrival, IconPlaneDeparture, IconPlaneInflight, IconPyramid, IconRoad, IconRollercoaster,
  IconRoute, IconRvTruck, IconSailboat, IconScooter, IconScubaMask, IconShip, IconSignRight, IconSkiJumping,
  IconSnowflake, IconSpeedboat, IconSteeringWheel, IconSun, IconSunrise, IconSunset, IconSwimming, IconTent,
  IconTicket, IconToolsKitchen2, IconTorii, IconTrain, IconTrees, IconTrekking, IconUmbrella, IconVolcano,
  IconWheelchair, IconWorld, IconWorldPin, type Icon,
} from '@tabler/icons-react'
import { LOGO_DATA_URI } from '@/lib/logo'

// Animação de carregamento da Plura: logo no centro com um anel girando no
// sentido anti-horário. Ícones de viagem (metade do tamanho do logo), em
// ordem aleatória, surgem com fade, percorrem um trecho de órbita ao redor do
// logo (direção e velocidade sorteadas) e somem suavemente. Cada ícone fica
// ligado ao logo por uma linha pontilhada. Com "reduzir movimento" fica parada.

const ICONES: Icon[] = [
  IconEPassport, IconPlane, IconPlaneDeparture, IconPlaneArrival, IconPlaneInflight, IconBuildingAirport, IconBus,
  IconBusStop, IconTrain, IconCar, IconCamper, IconCaravan, IconRvTruck, IconBike, IconMotorbike, IconScooter, IconShip,
  IconSailboat, IconSpeedboat, IconKayak, IconAnchor, IconHelicopter, IconAirBalloon, IconCamera, IconPhoto, IconTicket,
  IconBuilding, IconBuildingCastle, IconBuildingMonument, IconBuildingBridge2, IconBuildingSkyscraper,
  IconBuildingLighthouse, IconBuildingArch, IconBuildingCarousel, IconBuildingCircus, IconBuildingChurch,
  IconBuildingMosque, IconBuildingPavilion, IconBuildingStadium, IconBuildingCottage, IconTorii, IconPyramid, IconMap,
  IconMap2, IconMapPin, IconMapPins, IconMapRoute, IconRoute, IconCompass, IconDirections, IconSignRight, IconRoad,
  IconLuggage, IconBackpack, IconBeach, IconMountain, IconVolcano, IconTent, IconCampfire, IconSun, IconSunset,
  IconSunrise, IconUmbrella, IconWorld, IconWorldPin, IconGlobe, IconBed, IconHotelService, IconSwimming,
  IconScubaMask, IconToolsKitchen2, IconCoffee, IconGlassCocktail, IconIceCream, IconTrees, IconBinoculars,
  IconTrekking, IconRollercoaster, IconMasksTheater, IconSnowflake, IconSkiJumping, IconFish, IconCactus, IconFlower,
  IconWheelchair, IconCalendarEvent, IconSteeringWheel, IconGasStation, IconCreditCard,
]

const TAMANHO = 220
const CENTRO = TAMANHO / 2
const LOGO = 56
const ICONE = LOGO / 2
const MAX_SIMULTANEOS = 5

// Um ícone em órbita: nasce num ângulo, anda um arco e some
interface Satelite {
  id: number
  icone: number
  inicio: number // ms
  duracao: number // ms
  angulo: number // radianos
  arco: number // radianos percorridos (sinal = sentido)
  raio: number
}

// Opacidade: entra nos primeiros 22% do tempo e sai nos últimos 28%
function opacidade(t: number) {
  if (t < 0.22) return suave(t / 0.22)
  if (t > 0.72) return suave((1 - t) / 0.28)
  return 1
}

function suave(x: number) {
  const v = Math.min(1, Math.max(0, x))
  return v * v * (3 - 2 * v)
}

function posicao(s: Satelite, agora: number) {
  const t = Math.min(1, (agora - s.inicio) / s.duracao)
  const angulo = s.angulo + s.arco * t
  return { t, x: CENTRO + s.raio * Math.cos(angulo), y: CENTRO + s.raio * Math.sin(angulo) }
}

// Posições fixas para quem pede "reduzir movimento"
const ESTATICOS: Satelite[] = [0, 1, 2, 3].map((i) => ({
  id: i, icone: [0, 1, 23, 26][i], inicio: 0, duracao: 1, angulo: -Math.PI / 2 + (i * Math.PI) / 2 + Math.PI / 4, arco: 0, raio: 82,
}))

function embaralhar<T>(lista: T[]): T[] {
  const copia = [...lista]
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copia[i], copia[j]] = [copia[j], copia[i]]
  }
  return copia
}

function Anel({ tamanho, espessura }: { tamanho: number; espessura: number }) {
  const r = (tamanho - espessura) / 2
  const c = 2 * Math.PI * r
  return (
    <svg className="carregando-anel" width={tamanho} height={tamanho} viewBox={`0 0 ${tamanho} ${tamanho}`} aria-hidden style={{ position: 'absolute', inset: 0 }}>
      <circle cx={tamanho / 2} cy={tamanho / 2} r={r} fill="none" stroke="var(--c-divider)" strokeWidth={espessura} />
      <circle cx={tamanho / 2} cy={tamanho / 2} r={r} fill="none" stroke="var(--c-accent-text)" strokeWidth={espessura} strokeLinecap="round" strokeDasharray={`${c * 0.28} ${c}`} />
    </svg>
  )
}

function Logo({ tamanho, anel }: { tamanho: number; anel: number }) {
  return (
    <span style={{ position: 'relative', width: anel, height: anel, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, borderRadius: '50%', background: 'var(--c-bg, #fff)' }}>
      <Anel tamanho={anel} espessura={Math.max(2, anel / 22)} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={LOGO_DATA_URI} alt="" width={tamanho} height={tamanho} style={{ width: tamanho, height: tamanho, objectFit: 'contain' }} draggable={false} />
    </span>
  )
}

export default function Carregando({ texto = 'Carregando…', compacto = false }: { texto?: string; compacto?: boolean }) {
  const [satelites, setSatelites] = useState<Satelite[]>([])
  const [agora, setAgora] = useState(0)
  const [parado, setParado] = useState(false)
  const fila = useRef<number[]>([])

  useEffect(() => {
    if (compacto) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setParado(true)
      return
    }
    // Sorteia sem repetir até usar todos os ícones; depois embaralha de novo
    const proximoIcone = () => {
      if (fila.current.length === 0) fila.current = embaralhar(ICONES.map((_, i) => i))
      return fila.current.pop() as number
    }
    let lista: Satelite[] = []
    let id = 0
    let ultimoNascimento = -Infinity
    let quadro = 0

    const nascer = (t: number) => {
      // Ângulo longe dos ícones que já estão na tela
      const ocupados = lista.map((s) => s.angulo + s.arco * Math.min(1, (t - s.inicio) / s.duracao))
      let angulo = Math.random() * 2 * Math.PI
      for (let tentativa = 0; tentativa < 12; tentativa++) {
        const perto = ocupados.some((o) => Math.abs(Math.atan2(Math.sin(angulo - o), Math.cos(angulo - o))) < 0.9)
        if (!perto) break
        angulo = Math.random() * 2 * Math.PI
      }
      lista.push({
        id: id++,
        icone: proximoIcone(),
        inicio: t,
        duracao: 3200 + Math.random() * 1800,
        angulo,
        arco: (Math.random() < 0.5 ? -1 : 1) * (0.6 + Math.random() * 0.9),
        raio: 72 + Math.random() * 18,
      })
      ultimoNascimento = t
    }

    const animar = (t: number) => {
      lista = lista.filter((s) => t - s.inicio < s.duracao)
      if (lista.length < MAX_SIMULTANEOS && t - ultimoNascimento > 520 + Math.random() * 500) nascer(t)
      setSatelites([...lista])
      setAgora(t)
      quadro = requestAnimationFrame(animar)
    }
    quadro = requestAnimationFrame(animar)
    return () => cancelAnimationFrame(quadro)
  }, [compacto])

  if (compacto) {
    return (
      <span role="status" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.625rem', color: 'var(--c-text-3)', fontSize: '0.8125rem' }}>
        <Logo tamanho={18} anel={34} />
        <span>{texto}</span>
      </span>
    )
  }

  const visiveis = (parado ? ESTATICOS : satelites).map((sat) => {
    const { t, x, y } = parado ? posicao(sat, 0) : posicao(sat, agora)
    return { sat, x, y, alfa: parado ? 1 : opacidade(t) }
  })

  return (
    <div role="status" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', padding: '1.25rem 0', margin: '0 auto' }}>
      <div style={{ position: 'relative', width: TAMANHO, height: TAMANHO }} aria-hidden>
        {/* Cada ícone ligado ao logo central por uma linha pontilhada */}
        <svg width={TAMANHO} height={TAMANHO} style={{ position: 'absolute', inset: 0 }}>
          {visiveis.map(({ sat, x, y, alfa }) => (
            <line key={sat.id} x1={CENTRO} y1={CENTRO} x2={x} y2={y} stroke="var(--c-accent-text)" strokeWidth={1.5} strokeDasharray="2 5" strokeLinecap="round" opacity={alfa * 0.5} />
          ))}
        </svg>
        {visiveis.map(({ sat, x, y, alfa }) => {
          const Simbolo = ICONES[sat.icone]
          return (
            <span
              key={sat.id}
              style={{
                position: 'absolute', left: x - ICONE / 2 - 6, top: y - ICONE / 2 - 6, width: ICONE + 12, height: ICONE + 12,
                display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%',
                background: 'var(--c-bg, #fff)', color: 'var(--c-accent-text)',
                opacity: alfa, transform: `scale(${0.7 + 0.3 * alfa})`,
              }}
            >
              <Simbolo size={ICONE} stroke={1.6} />
            </span>
          )
        })}
        <span style={{ position: 'absolute', left: CENTRO - (LOGO + 20) / 2, top: CENTRO - (LOGO + 20) / 2 }}>
          <Logo tamanho={LOGO} anel={LOGO + 20} />
        </span>
      </div>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', color: 'var(--c-text-3)' }}>{texto}</span>
    </div>
  )
}
