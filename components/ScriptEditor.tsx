'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

interface Props {
  structureNom: string
  scriptClient: string
  scriptBase: string
  onSaveClient: (value: string) => Promise<void>
}

export default function ScriptEditor({ structureNom, scriptClient, scriptBase, onSaveClient }: Props) {
  const [text, setText]           = useState(scriptClient)
  const [saving, setSaving]       = useState(false)
  const [savedAt, setSavedAt]     = useState<string | null>(null)
  const [isDirty, setIsDirty]     = useState(false)
  const debounceRef               = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setText(scriptClient)
    setIsDirty(false)
    setSavedAt(null)
  }, [scriptClient])

  const save = useCallback(async (val: string) => {
    setSaving(true)
    try {
      await onSaveClient(val)
      setSavedAt(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }))
      setIsDirty(false)
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }, [onSaveClient])

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value
    setText(val)
    setIsDirty(true)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => save(val), 1500)
  }

  const handleCopyTemplate = () => {
    const adapted = scriptBase.replace(/\{NOM\}/g, structureNom)
    setText(adapted)
    setIsDirty(true)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => save(adapted), 1500)
  }

  const isEmpty = !text || text.trim() === ''

  return (
    <div className="flex flex-col gap-4 h-full">

      {/* ── Bloc 1 : Script de base (lecture seule) ────────────────────────── */}
      <div className="flex-shrink-0">
        <div className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
          <span className="w-4 h-px bg-ardoise-600 inline-block"></span>
          Mon script de base
          <span className="text-ardoise-600 normal-case tracking-normal">(référence)</span>
        </div>

        {scriptBase ? (
          <div className="bg-ardoise-800/60 border border-ardoise-700 rounded-lg px-4 py-3 text-xs text-slate-400 font-mono leading-relaxed whitespace-pre-wrap max-h-36 overflow-y-auto">
            {scriptBase.replace(/\{NOM\}/g, structureNom)}
          </div>
        ) : (
          <div className="bg-ardoise-800/40 border border-dashed border-ardoise-700 rounded-lg px-4 py-3 text-xs text-slate-600 italic">
            Aucun script de base défini — utilisez le bouton 📋 dans la barre latérale.
          </div>
        )}
      </div>

      {/* ── Bloc 2 : Texte pour le client (éditable) ───────────────────────── */}
      <div className="flex flex-col flex-1 min-h-0">
        <div className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-2 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <span className="w-4 h-px bg-ardoise-600 inline-block"></span>
            Texte pour {structureNom}
          </span>
          {scriptBase && (
            <button
              onClick={handleCopyTemplate}
              className="text-xs text-slate-600 hover:text-amber-400 transition-colors flex items-center gap-1"
              title="Recopier le script de base en adaptant le nom"
            >
              ↺ depuis le template
            </button>
          )}
        </div>

        {isEmpty && scriptBase && (
          <div className="mb-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-center justify-between">
            <span className="text-xs text-amber-400">Aucun texte — partir du template de base ?</span>
            <button
              onClick={handleCopyTemplate}
              className="text-xs bg-amber-500 hover:bg-amber-400 text-ardoise-950 font-bold px-3 py-1 rounded transition-colors ml-3 flex-shrink-0"
            >
              Copier le template
            </button>
          </div>
        )}

        <textarea
          value={text}
          onChange={handleChange}
          placeholder={`Texte personnalisé pour ${structureNom}…`}
          className="flex-1 w-full bg-ardoise-800 border border-ardoise-600 rounded px-3 py-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500 resize-none leading-relaxed"
          style={{ minHeight: '180px' }}
        />

        <div className="mt-2 text-xs font-mono text-slate-600">
          {saving ? (
            <span className="text-amber-500 flex items-center gap-1">
              <span className="animate-spin inline-block">⟳</span> Enregistrement…
            </span>
          ) : savedAt ? (
            <span className="text-emerald-600">Sauvegardé à {savedAt} ✓</span>
          ) : isDirty ? (
            <span className="text-amber-600">Modification en cours…</span>
          ) : (
            <span>Sauvegarde automatique après chaque modification</span>
          )}
        </div>
      </div>

    </div>
  )
}
