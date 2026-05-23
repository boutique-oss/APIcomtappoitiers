'use client'

import { useState, useEffect, useCallback } from 'react'
import { pb, Structure, Statut, STATUT_COLORS, STATUT_BG } from '@/lib/pocketbase'
import Map from '@/components/Map'
import FicheModal from '@/components/FicheModal'
import ImportCSV from '@/components/ImportCSV'

const STATUTS: Statut[] = ['À contacter', 'En cours', 'RDV planifié', 'Signé', 'Sans suite']

export default function HomePage() {
  const [structures, setStructures] = useState<Structure[]>([])
  const [selected, setSelected] = useState<Structure | null>(null)
  const [showImport, setShowImport] = useState(false)
  const [filterStatut, setFilterStatut] = useState<Statut | 'Tous'>('Tous')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  const fetchStructures = useCallback(async () => {
    try {
      const records = await pb.collection('structures').getFullList<Structure>({
        sort: 'nom',
      })
      setStructures(records)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchStructures() }, [fetchStructures])

  const filtered = structures.filter(s => {
    const matchStatut = filterStatut === 'Tous' || s.statut === filterStatut
    const matchSearch = s.nom.toLowerCase().includes(search.toLowerCase()) ||
                        s.categorie?.toLowerCase().includes(search.toLowerCase())
    return matchStatut && matchSearch
  })

  const counts = STATUTS.reduce((acc, s) => {
    acc[s] = structures.filter(x => x.statut === s).length
    return acc
  }, {} as Record<Statut, number>)

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-ardoise-950">

      {/* ── Sidebar ── */}
      <aside className="w-72 flex-shrink-0 flex flex-col bg-ardoise-900 border-r border-ardoise-700 slide-in">

        {/* Logo / Header */}
        <div className="px-5 pt-5 pb-4 border-b border-ardoise-700">
          <div className="text-xs font-mono text-amber-500 uppercase tracking-widest mb-1">
            Atelier S. Hamache
          </div>
          <h1 className="text-base font-bold text-white leading-tight">
            Partenaires<br />
            <span className="text-slate-400 font-normal">Grand Poitiers</span>
          </h1>
        </div>

        {/* Stats rapides */}
        <div className="px-5 py-3 border-b border-ardoise-700">
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-ardoise-800 rounded-lg px-3 py-2">
              <div className="text-lg font-bold text-white">{structures.length}</div>
              <div className="text-xs text-slate-500 font-mono">total</div>
            </div>
            <div className="bg-ardoise-800 rounded-lg px-3 py-2">
              <div className="text-lg font-bold text-emerald-400">{counts['Signé'] || 0}</div>
              <div className="text-xs text-slate-500 font-mono">signés</div>
            </div>
          </div>
        </div>

        {/* Recherche */}
        <div className="px-4 py-3">
          <input
            type="text"
            placeholder="Rechercher…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-ardoise-800 border border-ardoise-600 rounded px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* Filtres statut */}
        <div className="px-4 pb-3 flex flex-wrap gap-1.5">
          <button
            onClick={() => setFilterStatut('Tous')}
            className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
              filterStatut === 'Tous'
                ? 'bg-white/10 border-white/20 text-white'
                : 'border-ardoise-700 text-slate-500 hover:text-slate-300'
            }`}
          >
            Tous ({structures.length})
          </button>
          {STATUTS.map(s => (
            <button
              key={s}
              onClick={() => setFilterStatut(filterStatut === s ? 'Tous' : s)}
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                filterStatut === s ? STATUT_BG[s] : 'border-ardoise-700 text-slate-500 hover:text-slate-300'
              }`}
            >
              {s.split(' ')[0]} ({counts[s] || 0})
            </button>
          ))}
        </div>

        {/* Liste */}
        <div className="flex-1 overflow-y-auto px-3 pb-3">
          {loading ? (
            <div className="text-xs text-slate-600 font-mono text-center py-8 animate-pulse">
              Chargement…
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-xs text-slate-600 font-mono text-center py-8">
              Aucune structure
            </div>
          ) : (
            filtered.map(s => (
              <button
                key={s.id}
                onClick={() => setSelected(s)}
                className={`w-full text-left px-3 py-2.5 rounded-lg mb-1 transition-all ${
                  selected?.id === s.id
                    ? 'bg-ardoise-700 border border-ardoise-600'
                    : 'hover:bg-ardoise-800 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: STATUT_COLORS[s.statut] }}
                  />
                  <span className="text-sm text-slate-200 font-medium truncate">{s.nom}</span>
                </div>
                <div className="text-xs text-slate-600 font-mono mt-0.5 pl-4 truncate">
                  {s.categorie}
                </div>
              </button>
            ))
          )}
        </div>

        {/* Import CSV */}
        <div className="px-4 py-3 border-t border-ardoise-700">
          <button
            onClick={() => setShowImport(true)}
            className="w-full bg-ardoise-700 hover:bg-ardoise-600 text-slate-300 hover:text-white text-xs font-medium rounded px-3 py-2 transition-colors flex items-center justify-center gap-2"
          >
            <span>↑</span> Importer CSV
          </button>
        </div>
      </aside>

      {/* ── Carte ── */}
      <main className="flex-1 relative">
        <Map
          structures={filtered}
          onSelect={setSelected}
          selected={selected}
        />

        {/* Légende */}
        <div className="absolute bottom-4 left-4 z-[500] bg-ardoise-900/90 backdrop-blur border border-ardoise-700 rounded-lg px-4 py-3">
          <div className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-2">Légende</div>
          {STATUTS.map(s => (
            <div key={s} className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: STATUT_COLORS[s] }} />
              <span className="text-xs text-slate-400">{s}</span>
            </div>
          ))}
        </div>
      </main>

      {/* ── Modals ── */}
      {selected && (
        <FicheModal
          structure={selected}
          onClose={() => setSelected(null)}
          onUpdate={updated => {
            setStructures(prev => prev.map(s => s.id === updated.id ? updated : s))
            setSelected(updated)
          }}
        />
      )}

      {showImport && (
        <ImportCSV
          onImported={fetchStructures}
          onClose={() => setShowImport(false)}
        />
      )}
    </div>
  )
}
