'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams } from 'next/navigation'
import { pb, Structure, getScriptBase } from '@/lib/pocketbase'

export default function ScriptPage() {
  const { id } = useParams<{ id: string }>()
  const [structure, setStructure]   = useState<Structure | null>(null)
  const [scriptBase, setScriptBase] = useState('')
  const [text, setText]             = useState('')
  const [loading, setLoading]       = useState(true)
  const [saving, setSaving]         = useState(false)
  const [savedAt, setSavedAt]       = useState<string | null>(null)
  const [isDirty, setIsDirty]       = useState(false)
  const [error, setError]           = useState('')
  const debounceRef                 = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    Promise.all([
      pb.collection('structures').getOne<Structure>(id),
      getScriptBase(),
    ])
      .then(([s, sb]) => {
        setStructure(s)
        setScriptBase(sb)
        setText(s.script || '')
      })
      .catch(() => setError('Impossible de charger la fiche.'))
      .finally(() => setLoading(false))
  }, [id])

  const save = useCallback(async (val: string) => {
    if (!structure) return
    setSaving(true)
    try {
      await pb.collection('structures').update(structure.id, { script: val })
      setSavedAt(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }))
      setIsDirty(false)
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }, [structure])

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value
    setText(val)
    setIsDirty(true)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => save(val), 1500)
  }

  const handleCopyTemplate = () => {
    if (!structure) return
    const adapted = scriptBase.replace(/\{NOM\}/g, structure.nom)
    setText(adapted)
    setIsDirty(true)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => save(adapted), 1500)
  }

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

  const isEmpty = !text || text.trim() === ''
  const baseAdapted = scriptBase.replace(/\{NOM\}/g, structure.nom)

  return (
    <div className="h-screen bg-ardoise-950 flex flex-col overflow-hidden">

      {/* ── Header ── */}
      <div className="border-b border-ardoise-700 px-8 py-4 flex items-center gap-4 bg-ardoise-900">
        <button
          onClick={() => window.close()}
          className="text-slate-500 hover:text-white transition-colors text-sm font-mono flex items-center gap-1.5"
        >
          ← Fermer
        </button>
        <div className="h-4 w-px bg-ardoise-700" />
        <div>
          <div className="text-xs font-mono text-amber-500 uppercase tracking-widest">{structure.categorie}</div>
          <h1 className="text-white font-bold text-lg leading-tight">{structure.nom}</h1>
        </div>
        <div className="ml-auto flex items-center gap-4 text-xs font-mono">
          {saving ? (
            <span className="text-amber-400 flex items-center gap-1.5">
              <span className="animate-spin inline-block">⟳</span> Enregistrement…
            </span>
          ) : savedAt ? (
            <span className="text-emerald-500">✓ Sauvegardé à {savedAt}</span>
          ) : isDirty ? (
            <span className="text-amber-600">Modification en cours…</span>
          ) : (
            <span className="text-slate-600">Sauvegarde auto</span>
          )}
          <span className="text-slate-600 uppercase tracking-widest">Script</span>
        </div>
      </div>

      {/* ── Grille principale ── */}
      <div className="flex-1 grid grid-cols-[1fr_2fr] gap-0 overflow-hidden">

        {/* Colonne gauche — script de base (référence) */}
        <div className="border-r border-ardoise-800 flex flex-col overflow-hidden">
          <div className="px-6 py-4 border-b border-ardoise-800 flex items-center justify-between flex-shrink-0">
            <div>
              <div className="text-xs font-mono text-slate-500 uppercase tracking-widest">Script de base</div>
              <div className="text-xs text-slate-600 mt-0.5 normal-case">référence</div>
            </div>
            {scriptBase && (
              <button
                onClick={handleCopyTemplate}
                className="text-xs bg-ardoise-700 hover:bg-ardoise-600 text-slate-300 hover:text-white px-3 py-1.5 rounded transition-colors flex items-center gap-1.5"
                title="Copier le template dans l'éditeur"
              >
                ↺ Utiliser comme base
              </button>
            )}
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-5">
            {scriptBase ? (
              <p className="text-slate-400 text-sm leading-7 whitespace-pre-wrap font-sans">
                {baseAdapted}
              </p>
            ) : (
              <p className="text-slate-600 italic text-sm">
                Aucun script de base défini.
              </p>
            )}
          </div>
        </div>

        {/* Colonne droite — éditeur */}
        <div className="flex flex-col overflow-hidden">
          <div className="px-8 py-4 border-b border-ardoise-800 flex items-center justify-between flex-shrink-0">
            <div>
              <div className="text-xs font-mono text-slate-500 uppercase tracking-widest">Texte pour</div>
              <div className="text-sm font-semibold text-white mt-0.5">{structure.nom}</div>
            </div>
            {scriptBase && isEmpty && (
              <button
                onClick={handleCopyTemplate}
                className="text-xs bg-amber-500 hover:bg-amber-400 text-ardoise-950 font-bold px-3 py-1.5 rounded transition-colors"
              >
                Copier le template
              </button>
            )}
          </div>
          <div className="flex-1 overflow-y-auto px-8 py-5">
            <textarea
              value={text}
              onChange={handleChange}
              placeholder={`Rédigez votre texte pour ${structure.nom}…`}
              className="w-full bg-transparent text-slate-100 text-base leading-8 placeholder-slate-700 resize-none focus:outline-none"
              style={{ fontFamily: 'inherit', minHeight: '100%' }}
              spellCheck
            />
          </div>
        </div>

      </div>
    </div>
  )
}
