'use client'

import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { Structure, STATUT_COLORS, STATUT_BG } from '@/lib/pocketbase'

interface Props {
  structures: Structure[]
  onSelect: (s: Structure) => void
  selected: Structure | null
}

export default function MapClient({ structures, onSelect, selected }: Props) {
  const mapRef = useRef<any>(null)

  useEffect(() => {
    if (selected && mapRef.current) {
      mapRef.current.flyTo([selected.lat, selected.lng], 15, { duration: 1 })
    }
  }, [selected])

  const validStructures = structures.filter(s => s.lat && s.lng)

  return (
    <MapContainer
      center={[46.5802, 0.3404]}
      zoom={12}
      className="w-full h-full"
      ref={mapRef}
      zoomControl={true}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
        maxZoom={19}
      />

      {validStructures.map((s) => {
        const color = STATUT_COLORS[s.statut] || '#6b7280'
        const isSelected = selected?.id === s.id

        return (
          <CircleMarker
            key={s.id}
            center={[s.lat, s.lng]}
            radius={isSelected ? 12 : 8}
            pathOptions={{
              fillColor: color,
              fillOpacity: isSelected ? 1 : 0.85,
              color: isSelected ? '#fff' : color,
              weight: isSelected ? 2.5 : 1.5,
            }}
            eventHandlers={{ click: () => onSelect(s) }}
          >
            <Popup>
              <div className="p-1 min-w-[180px]">
                <div className="font-bold text-sm text-white mb-1">{s.nom}</div>
                <div className="text-xs text-slate-400 mb-2">{s.adresse}, {s.ville}</div>
                <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUT_BG[s.statut]}`}>
                  {s.statut}
                </span>
                <button
                  onClick={() => onSelect(s)}
                  className="mt-2 w-full text-xs bg-amber-500/20 hover:bg-amber-500/40 text-amber-300 border border-amber-500/30 rounded px-2 py-1 transition-colors"
                >
                  Ouvrir la fiche →
                </button>
              </div>
            </Popup>
          </CircleMarker>
        )
      })}
    </MapContainer>
  )
}
