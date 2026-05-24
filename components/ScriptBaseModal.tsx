'use client'

import { useState, useRef, useCallback } from 'react'

interface Props {
  value: string
  onSave: (value: string) => Promise<void>
  onClose: () => void
}

export default function ScriptBaseModal({ value, onSave, onClose }: Props) {
  const [text, setText]       = useState(value)
  const [saving, setSaving]   = useState(false)
  const [savedAt, setSavedAt] = useState<string | null>(null)
  const debounceRef           = useRef<ReturnType<typeof setTimeout> | null>(null)

  const save = useCallback(async (val: string) => {
    setSaving(true)
    try {
      await onSave(val)
      setSavedAt(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }))
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }, [onSave])

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value
    setText(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => save(val), 1500)
  }

  return (
    <div
      className="fixed inset-0 z-[1001] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] bg-ardoise-900 border border-ardoise-700 rounded-xl shadow-2xl flex flex-col m-4"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-ardoise-700">
          <div>
            <div className="text-xs font-mono text-amber-500 uppercase tracking-widest mb-0.5">
              Template global
            </div>
            <h2 className="text-base font-bold text-white">Script de prospection — Base</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-white text-xl leading-none transition-colors"
          >
            ×
          </button>
        </div>

        {/* Info */}
        <div className="px-6 py-3 bg-ardoise-800/50 border-b border-ardoise-700">
          <p className="text-xs text-slate-400 leading-relaxed">
            Ce script sert de référence pour tous les prospects. Il sera affiché en lecture seule dans chaque fiche.
            Utilisez{' '}
            <code className="text-amber-400 bg-ardoise-800 px-1 rounded font-mono">{'{NOM}'}</code>
            {' '}pour insérer automatiquement le nom de la structure.
          </p>
        </div>

        {/* Éditeur */}
        <div className="flex-1 overflow-hidden px-6 py-4 flex flex-col">
          <textarea
            value={text}
            onChange={handleChange}
            placeholder={`Bonjour,\n\nJe me permets de vous contacter au nom de l'Atelier Stéphan Hamache…\n\nNous proposons des services de tapisserie d'ameublement pour {NOM}.\n\n(Utilisez {NOM} pour insérer le nom de la structure)`}
            className="flex-1 w-full bg-ardoise-800 border border-ardoise-600 rounded px-4 py-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500 resize-none leading-relaxed"
            style={{ minHeight: '320px' }}
          />
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-ardoise-700 flex items-center justify-between">
          <div className="text-xs font-mono text-slate-600">
            {saving ? (
              <span className="text-amber-500 flex items-center gap-1">
                <span className="animate-spin inline-block">⟳</span> Enregistrement…
              </span>
            ) : savedAt ? (
              <span className="text-emerald-600">Sauvegardé à {savedAt} ✓</span>
            ) : (
              <span>Sauvegarde automatique après chaque modification</span>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-sm bg-ardoise-700 hover:bg-ardoise-600 text-white px-4 py-2 rounded transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  )
}
