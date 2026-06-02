'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { pb, Structure } from '@/lib/pocketbase'
import ScoringPanel from '@/components/ScoringPanel'
import { scoreProspect, niveau, NIVEAU_META, type ProspectScoring, type NiveauKey } from '@/lib/prospection-scoring'

export default function ScorePage() {
  const { id } = useParams<{ id: string }>()
  const [structure, setStructure] = useState<Structure | null>(null)
  const [form, setForm] = useState<Partial<Structure>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    pb.collection('structures').getOne<Structure>(id)
      .then((s) => { setStructure(s); setForm(s) })
      .catch(() => setError('Impossible de charger la fiche.'))
      .finally(() => setLoading(false))
  }, [id])

  const scoringValues: ProspectScoring = {
    potentielMobilier: form.potentielMobilier || '',
    proximite:         form.proximite || '',
    relation:          form.relation || '',
    besoin:            form.besoin || '',
  }

  const liveScore = scoreProspect(scoringValues)
  const liveNiv   = niveau(liveScore) as NiveauKey | null
  const liveMeta  = liveNiv ? NIVEAU_META[liveNiv] : null

  const handleSave = useCallback(async () => {
    if (!structure) return
    setSaving(true)
    try {
      const updated = await pb.collection('structures').update<Structure>(structure.id, form)
      setStructure(updated)
      setEditing(false)
      setSavedAt(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }))
    } catch (e) {
      console.error(e)
      alert('Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }, [structure, form])

  if (loading) return (
    <div className="min-h-screen bg-ardoise-950 flex items-center justify-center">
      <span className="text-slate-500 font-mono text-sm animate-pulse">Chargement…</span>
    </div>
  )

  if (error || !structure) return (
    <div className="min-h-screen bg-ardoise-950 flex items-center justify-center">
      <span className="text-red-400 font-mono text-sm">{error || 'Fiche introuvable.'}</span>
    </div>
  )

  return (
    <div className="min-h-screen bg-ardoise-950 flex flex-col">
      {/* Header */}
      <div className="border-b border-ardoise-700 px-6 py-4 flex items-center gap-4 bg-ardoise-900">
        <button
          onClick={() => window.close()}
          className="text-slate-500 hover:text-white transition-colors text-sm font-mono"
        >
          ← Fermer
        </button>
        <div className="h-4 w-px bg-ardoise-700" />
        <div className="flex items-center gap-3">
          <div>
            <div className="text-xs font-mono text-amber-500 uppercase tracking-widest">{structure.categorie}</div>
            <h1 className="text-white font-bold leading-tight">{structure.nom}</h1>
          </div>
          {liveMeta && (
            <span
              className="text-xs font-mono font-bold px-2 py-0.5 rounded"
              style={{ color: liveMeta.couleur, backgroundColor: `${liveMeta.couleur}22` }}
            >
              {liveMeta.texte} {liveScore}/12
            </span>
          )}
        </div>
        <div className="ml-auto text-xs font-mono text-slate-600 uppercase tracking-widest">Scoring RDV</div>
      </div>

      {/* Content */}
      <div className="flex-1 max-w-xl w-full mx-auto px-6 py-6">
        <ScoringPanel
          values={scoringValues}
          editing={editing}
          onChange={(field, value) => setForm((f) => ({ ...f, [field]: value }))}
        />
      </div>

      {/* Footer */}
      <div className="sticky bottom-0 border-t border-ardoise-700 bg-ardoise-900 px-6 py-3">
        {editing ? (
          <div className="flex gap-2 max-w-xl mx-auto">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-ardoise-950 font-bold text-sm rounded px-4 py-2.5 transition-colors flex items-center justify-center gap-2"
            >
              {saving ? <><span className="animate-spin inline-block">⟳</span> Enregistrement…</> : <><span>↑</span> Enregistrer</>}
            </button>
            <button
              onClick={() => { setEditing(false); setForm(structure) }}
              className="px-4 py-2 text-sm text-slate-400 hover:text-white border border-ardoise-700 rounded transition-colors"
            >
              Annuler
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between max-w-xl mx-auto">
            <button
              onClick={() => setEditing(true)}
              className="bg-ardoise-700 hover:bg-ardoise-600 text-white text-sm font-medium rounded px-4 py-2.5 transition-colors flex items-center gap-2"
            >
              <span>✎</span> Qualifier ce prospect
            </button>
            {savedAt && (
              <span className="text-xs font-mono text-emerald-600">Sauvegardé à {savedAt} ✓</span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
