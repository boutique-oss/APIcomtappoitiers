'use client'

import { useState, useEffect, useCallback } from 'react'
import { pb, Structure, Statut, STATUT_COLORS, STATUT_BG, getScriptBase, setScriptBase } from '@/lib/pocketbase'
import Map from '@/components/Map'
import FicheModal from '@/components/FicheModal'
import AdminAuth from '@/components/AdminAuth'
import AdminPanel from '@/components/AdminPanel'
import ScriptBaseModal from '@/components/ScriptBaseModal'
import FolderManager from '@/components/FolderManager'

const STATUTS: Statut[] = ['À contacter', 'En cours', 'RDV planifié', 'Signé', 'Sans suite']

const DOSSIER_MAP_KEY = 'dossier_assignments'

function loadDossierMap(): Record<string, string> {
  if (typeof window === 'undefined') return {}
  try { return JSON.parse(localStorage.getItem(DOSSIER_MAP_KEY) || '{}') } catch { return {} }
}
function saveDossierMap(map: Record<string, string>) {
  localStorage.setItem(DOSSIER_MAP_KEY, JSON.stringify(map))
}

export default function HomePage() {
  const [authenticated, setAuthenticated] = useState(false)
  const [structures, setStructures]       = useState<Structure[]>([])
  const [selected, setSelected]           = useState<Structure | null>(null)
  const [showAdmin, setShowAdmin]         = useState(false)
  const [showScriptBase, setShowScriptBase] = useState(false)
  const [filterStatut, setFilterStatut]   = useState<Statut | 'Tous'>('Tous')
  const [filterDossier, setFilterDossier] = useState<string | null>(null)
  const [search, setSearch]               = useState('')
  const [loading, setLoading]             = useState(true)
  const [syncing, setSyncing]             = useState(false)
  const [lastSync, setLastSync]           = useState<string | null>(null)
  const [scriptBase, setScriptBaseState]  = useState('')

  const fetchStructures = useCallback(async (manual = false) => {
    if (manual) setSyncing(true)
    else setLoading(true)
    try {
      const records = await pb.collection('structures').getFullList<Structure>({ sort: 'nom' })
      // Applique les affectations locales si PocketBase n'a pas encore le champ dossier
      const map = loadDossierMap()
      const withDossiers = records.map(r => ({
        ...r,
        dossier: r.dossier || map[r.id] || ''
      }))
      setStructures(withDossiers)
      if (manual) {
        setLastSync(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }))
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
      setSyncing(false)
    }
  }, [])

  const fetchScriptBase = useCallback(async () => {
    const val = await getScriptBase()
    setScriptBaseState(val)
  }, [])

  useEffect(() => {
    if (sessionStorage.getItem('admin_ok') === '1') {
      setAuthenticated(true)
      fetchStructures()
      fetchScriptBase()
    }
  }, [fetchStructures, fetchScriptBase])

  // Rafraîchissement automatique toutes les 2 minutes
  useEffect(() => {
    if (!authenticated) return
    const interval = setInterval(() => fetchStructures(true), 2 * 60 * 1000)
    return () => clearInterval(interval)
  }, [authenticated, fetchStructures])

  const handleAuthSuccess = () => {
    setAuthenticated(true)
    fetchStructures()
    fetchScriptBase()
  }

  const handleSaveScriptBase = useCallback(async (value: string) => {
    await setScriptBase(value)
    setScriptBaseState(value)
  }, [])

  const handleMoveToDossier = useCallback(async (structureId: string, dossier: string) => {
    // Sauvegarde locale immédiate (fiable même sans champ PocketBase)
    const map = loadDossierMap()
    if (dossier) map[structureId] = dossier
    else delete map[structureId]
    saveDossierMap(map)

    // Mise à jour de l'état local
    setStructures(prev => prev.map(s => s.id === structureId ? { ...s, dossier } : s))

    // Tentative de persistance dans PocketBase (échoue silencieusement si champ absent)
    try {
      await pb.collection('structures').update(structureId, { dossier })
    } catch {
      // Le champ dossier n'existe pas encore dans PocketBase — localStorage suffit
    }
  }, [])

  if (!authenticated) {
    return <AdminAuth onSuccess={handleAuthSuccess} mandatory />
  }

  const filtered = structures.filter(s => {
    const matchStatut  = filterStatut === 'Tous' || s.statut === filterStatut
    const matchSearch  = s.nom.toLowerCase().includes(search.toLowerCase()) ||
                         s.categorie?.toLowerCase().includes(search.toLowerCase())
    const matchDossier = filterDossier === null ||
      (filterDossier === 'Non classé'
        ? !s.dossier || s.dossier.trim() === ''
        : s.dossier === filterDossier)
    return matchStatut && matchSearch && matchDossier
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
        <div className="px-5 pt-5 pb-4 border-b border-ardoise-700 flex items-start justify-between">
          <div>
            <div className="text-xs font-mono text-amber-500 uppercase tracking-widest mb-1">
              Atelier S. Hamache
            </div>
            <h1 className="text-base font-bold text-white leading-tight">
              Partenaires<br />
              <span className="text-slate-400 font-normal">Grand Poitiers</span>
            </h1>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <button
              onClick={() => setShowScriptBase(true)}
              title="Script de prospection — template de base"
              className="text-slate-600 hover:text-amber-400 transition-colors text-base"
            >
              📋
            </button>
            <button
              onClick={() => setShowAdmin(true)}
              title="Gestion"
              className="text-slate-600 hover:text-amber-400 transition-colors text-base"
            >
              ⚙️
            </button>
          </div>
        </div>

        {/* Stats rapides */}
        <div className="px-5 py-3 border-b border-ardoise-700">
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="bg-ardoise-800 rounded-lg px-3 py-2">
              <div className="text-lg font-bold text-white">{structures.length}</div>
              <div className="text-xs text-slate-500 font-mono">total</div>
            </div>
            <div className="bg-ardoise-800 rounded-lg px-3 py-2">
              <div className="text-lg font-bold text-emerald-400">{counts['Signé'] || 0}</div>
              <div className="text-xs text-slate-500 font-mono">signés</div>
            </div>
          </div>

          {/* Bouton sync */}
          <button
            onClick={() => fetchStructures(true)}
            disabled={syncing}
            className="w-full flex items-center justify-center gap-2 bg-ardoise-800 hover:bg-ardoise-700 disabled:opacity-60 border border-ardoise-600 hover:border-amber-500/50 text-slate-300 hover:text-white text-xs font-mono rounded px-3 py-2 transition-all"
          >
            <span className={syncing ? 'animate-spin inline-block' : ''}>⟳</span>
            {syncing ? 'Synchronisation…' : 'Sync ↕ deux sens'}
            {lastSync && !syncing && (
              <span className="text-slate-600 ml-auto">{lastSync}</span>
            )}
          </button>
        </div>

        {/* ── Gestionnaire de dossiers ── */}
        <FolderManager
          structures={structures}
          activeDossier={filterDossier}
          onSelectDossier={setFilterDossier}
          onMoveToDossier={handleMoveToDossier}
        />

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

        {/* Liste — cartes glissables */}
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
              <div
                key={s.id}
                draggable
                onDragStart={e => {
                  e.dataTransfer.setData('structure_id', s.id)
                  e.dataTransfer.effectAllowed = 'move'
                }}
                onClick={() => setSelected(s)}
                className={`w-full text-left px-3 py-2.5 rounded-lg mb-1 transition-all cursor-grab active:cursor-grabbing select-none ${
                  selected?.id === s.id
                    ? 'bg-ardoise-700 border border-ardoise-600'
                    : 'hover:bg-ardoise-800 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-slate-700 text-xs opacity-60 leading-none flex-shrink-0">⠿</span>
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: STATUT_COLORS[s.statut] }}
                  />
                  <span className="text-sm text-slate-200 font-medium truncate">{s.nom}</span>
                  {s.script && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-600 flex-shrink-0" title="Script personnalisé" />
                  )}
                </div>
                <div className="text-xs text-slate-600 font-mono mt-0.5 pl-5 truncate">
                  {s.categorie}
                </div>
              </div>
            ))
          )}
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
          scriptBase={scriptBase}
          onClose={() => setSelected(null)}
          onUpdate={updated => {
            setStructures(prev => prev.map(s => s.id === updated.id ? updated : s))
            setSelected(updated)
          }}
        />
      )}

      {showAdmin && (
        <AdminPanel
          structures={structures}
          onClose={() => setShowAdmin(false)}
          onRefresh={fetchStructures}
          onSelectStructure={s => { setSelected(s); setShowAdmin(false) }}
        />
      )}

      {showScriptBase && (
        <ScriptBaseModal
          value={scriptBase}
          onSave={handleSaveScriptBase}
          onClose={() => setShowScriptBase(false)}
        />
      )}
    </div>
  )
}
