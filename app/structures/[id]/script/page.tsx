'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { pb, Structure, getScriptBase } from '@/lib/pocketbase'
import ScriptEditor from '@/components/ScriptEditor'

export default function ScriptPage() {
  const { id } = useParams<{ id: string }>()
  const [structure, setStructure] = useState<Structure | null>(null)
  const [scriptBase, setScriptBase] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([
      pb.collection('structures').getOne<Structure>(id),
      getScriptBase(),
    ])
      .then(([s, sb]) => { setStructure(s); setScriptBase(sb) })
      .catch(() => setError('Impossible de charger la fiche.'))
      .finally(() => setLoading(false))
  }, [id])

  const handleSave = useCallback(async (scriptValue: string) => {
    if (!structure) return
    const updated = await pb.collection('structures').update<Structure>(structure.id, { script: scriptValue })
    setStructure(updated)
  }, [structure])

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
        <div>
          <div className="text-xs font-mono text-amber-500 uppercase tracking-widest">{structure.categorie}</div>
          <h1 className="text-white font-bold leading-tight">{structure.nom}</h1>
        </div>
        <div className="ml-auto text-xs font-mono text-slate-600 uppercase tracking-widest">Script</div>
      </div>

      {/* Content */}
      <div className="flex-1 max-w-3xl w-full mx-auto px-6 py-6 flex flex-col">
        <ScriptEditor
          structureNom={structure.nom}
          scriptClient={structure.script || ''}
          scriptBase={scriptBase}
          onSaveClient={handleSave}
        />
      </div>
    </div>
  )
}
