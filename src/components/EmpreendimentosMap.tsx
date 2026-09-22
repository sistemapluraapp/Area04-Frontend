'use client'

import { useEffect, useMemo, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { Pagina } from '@/lib/api'

// Ícone padrão do Leaflet quebra sob o bundler do Next — aponta para CDN.
const iconePadrao = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

const CENTRO_BRASIL: [number, number] = [-14.2, -51.9]

export default function EmpreendimentosMap({ paginas }: { paginas: Pagina[] }) {
  const [montado, setMontado] = useState(false)

  useEffect(() => {
    setMontado(true)
  }, [])

  const pontos = useMemo(
    () =>
      paginas.filter(
        (p): p is Pagina & { latitude: number; longitude: number } =>
          typeof p.latitude === 'number' && typeof p.longitude === 'number'
      ),
    [paginas]
  )

  if (!montado) {
    return (
      <div style={{ width: '100%', height: 360, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--c-text-3)', fontFamily: 'var(--font-mono)' }}>
        carregando mapa…
      </div>
    )
  }

  const center: [number, number] = pontos.length > 0 ? [pontos[0].latitude, pontos[0].longitude] : CENTRO_BRASIL
  const zoom = pontos.length > 0 ? 5 : 4

  return (
    <div style={{ width: '100%', height: 360, borderRadius: '0.75rem', overflow: 'hidden' }}>
      <MapContainer center={center} zoom={zoom} style={{ width: '100%', height: '100%' }} scrollWheelZoom={false}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {pontos.map((p) => (
          <Marker key={p.id} position={[p.latitude, p.longitude]} icon={iconePadrao}>
            <Popup>
              <strong>{p.nome}</strong>
              {p.cidade && (
                <>
                  <br />
                  {p.cidade}
                  {p.uf ? `/${p.uf}` : ''}
                </>
              )}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
