'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { pb, Structure, Statut, STATUT_BG } from '@/lib/pocketbase'
import { scoreProspect, niveau, NIVEAU_META, type ProspectScoring, type NiveauKey } from '@/lib/prospection-scoring'

const STATUTS: Statut[] = ['À contacter', 'En cours', 'RDV planifié', 'Signé', 'Sans suite']

type Tab = 'fiche'

interface Props {
  structure: Structure
  scriptBase: string
  onClose: () => void
  onUpdate: (s: Structure) => void
}

export default function FicheModal({ structure, scriptBase, onClose, onUpdate }: Props) {
  const [activeTab, setActiveTab]     = useState<Tab>('fiche')
  const [editing, setEditing]         = useState(false)
  const [saving, setSaving]           = useState(false)
  const [autoSaveAt, setAutoSaveAt]   = useState<string | null>(null)
  const [form, setForm]               = useState<Partial<Structure>>(structure)
  const formRef                       = useRef(form)
  formRef.current                     = form

  const scoringValues: ProspectScoring = {
    potentielMobilier: form.potentielMobilier || '',
    proximite:         form.proximite || '',
    relation:          form.relation || '',
    besoin:            form.besoin || '',
  }
  const liveScore = scoreProspect(scoringValues)
  const liveNiv   = niveau(liveScore) as NiveauKey | null
  const liveMeta  = liveNiv ? NIVEAU_META[liveNiv] : null

  // Reset quand on change de structure
  useEffect(() => {
    setForm(structure)
    setEditing(false)
    setAutoSaveAt(null)
    setActiveTab('fiche')
  }, [structure.id])

  const handleSave = useCallback(async (silent = false) => {
    setSaving(true)
    try {
      const updated = await pb.collection('structures').update<Structure>(structure.id, formRef.current)
      onUpdate(updated)
      if (!silent) {
        setEditing(false)
      } else {
        const now = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
        setAutoSaveAt(now)
      }
    } catch (e) {
      console.error(e)
      if (!silent) alert('Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }, [structure.id, onUpdate])

  const handleSaveScript = useCallback(async (scriptValue: string) => {
    const updated = await pb.collection('structures').update<Structure>(structure.id, { script: scriptValue })
    onUpdate(updated)
  }, [structure.id, onUpdate])

  // Auto-sauvegarde toutes les 2 minutes en mode édition
  useEffect(() => {
    if (!editing) return
    const interval = setInterval(() => handleSave(true), 2 * 60 * 1000)
    return () => clearInterval(interval)
  }, [editing, handleSave])

  const Field = ({
    label, field, type = 'text', textarea = false
  }: {
    label: string
    field: keyof Structure
    type?: string
    textarea?: boolean
  }) => (
    <div className="mb-3">
      <label className="block text-xs font-mono text-slate-500 uppercase tracking-widest mb-1">
        {label}
      </label>
      {editing ? (
        textarea ? (
          <textarea
            value={(form[field] as string) || ''}
            onChange={e => setForm({ ...form, [field]: e.target.value })}
            rows={3}
            className="w-full bg-ardoise-800 border border-ardoise-600 rounded px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500 resize-none"
          />
        ) : (
          <input
            type={type}
            value={(form[field] as string) || ''}
            onChange={e => setForm({ ...form, [field]: e.target.value })}
            className="w-full bg-ardoise-800 border border-ardoise-600 rounded px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500"
          />
        )
      ) : (
        <div className="text-sm text-slate-200 py-1">
          {(structure[field] as string) || <span className="text-slate-600 italic">—</span>}
        </div>
      )}
    </div>
  )

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-end" onClick={onClose}>
      <div
        className="relative h-full w-full max-w-md bg-ardoise-900 border-l border-ardoise-700 shadow-2xl flex flex-col fade-up"
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="sticky top-0 z-10 bg-ardoise-900 border-b border-ardoise-700 px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xs font-mono text-amber-500 uppercase tracking-widest mb-1">
                {structure.categorie}
              </div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white leading-tight">{structure.nom}</h2>
                {liveMeta && (
                  <span
                    className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded"
                    style={{ color: liveMeta.couleur, backgroundColor: `${liveMeta.couleur}22` }}
                  >
                    {liveMeta.texte} {liveScore}/{12}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-500 hover:text-white transition-colors mt-1 text-xl leading-none"
            >
              ×
            </button>
          </div>

          {/* Statut */}
          <div className="mt-3">
            {editing ? (
              <select
                value={form.statut}
                onChange={e => setForm({ ...form, statut: e.target.value as Statut })}
                className="bg-ardoise-800 border border-ardoise-600 rounded px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-amber-500"
              >
                {STATUTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            ) : (
              <span className={`text-xs px-3 py-1 rounded-full border font-medium ${STATUT_BG[structure.statut]}`}>
                {structure.statut}
              </span>
            )}
          </div>

          {/* Onglets */}
          <div className="mt-4 flex gap-0 border-b border-ardoise-700 -mb-4">
            <button
              onClick={() => setActiveTab('fiche')}
              className={`px-4 py-2 text-xs font-mono uppercase tracking-widest border-b-2 transition-colors ${
                activeTab === 'fiche'
                  ? 'border-amber-500 text-amber-400'
                  : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              Fiche
            </button>
            <button
              onClick={() => window.open(`/structures/${structure.id}/score`, '_blank')}
              className="px-4 py-2 text-xs font-mono uppercase tracking-widest border-b-2 border-transparent text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-1.5"
            >
              Score
              {liveNiv && (
                <span
                  className="w-1.5 h-1.5 rounded-full inline-block"
                  style={{ backgroundColor: liveMeta?.couleur }}
                />
              )}
              <span className="text-ardoise-600 text-[10px]">↗</span>
            </button>
            <button
              onClick={() => window.open(`/structures/${structure.id}/script`, '_blank')}
              className="px-4 py-2 text-xs font-mono uppercase tracking-widest border-b-2 border-transparent text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-1.5"
            >
              Script
              {structure.script && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" title="Script personnalisé présent" />
              )}
              <span className="text-ardoise-600 text-[10px]">↗</span>
            </button>
          </div>
        </div>

        {/* ── Contenu : onglet Fiche ── */}
        {activeTab === 'fiche' && (
          <>
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <div className="mb-5">
                <div className="text-xs font-mono text-slate-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <span className="w-4 h-px bg-ardoise-600 inline-block"></span>
                  Localisation
                </div>
                <Field label="Adresse" field="adresse" />
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Ville" field="ville" />
                  <Field label="Code postal" field="code_postal" />
                </div>
                {structure.lat && structure.lng && (
                  <div className="text-xs font-mono text-slate-600 mt-1">
                    {structure.lat.toFixed(5)}, {structure.lng.toFixed(5)}
                  </div>
                )}
              </div>

              <div className="mb-5">
                <div className="text-xs font-mono text-slate-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <span className="w-4 h-px bg-ardoise-600 inline-block"></span>
                  Contact
                </div>
                <Field label="Nom" field="contact_nom" />
                <Field label="Téléphone" field="contact_tel" type="tel" />
                <Field label="Email" field="contact_email" type="email" />
              </div>

              <div className="mb-5">
                <div className="text-xs font-mono text-slate-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <span className="w-4 h-px bg-ardoise-600 inline-block"></span>
                  Notes
                </div>
                <Field label="" field="notes" textarea />
              </div>

              {!editing && (
                <div className="text-xs font-mono text-slate-700 border-t border-ardoise-800 pt-3">
                  Mis à jour : {new Date(structure.updated).toLocaleDateString('fr-FR')}
                </div>
              )}
            </div>

            {/* Footer fiche */}
            <div className="sticky bottom-0 bg-ardoise-900 border-t border-ardoise-700 px-5 py-3">
              {editing ? (
                <>
                  <div className="flex gap-2 mb-2">
                    <button
                      onClick={() => handleSave(false)}
                      disabled={saving}
                      className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-ardoise-950 font-bold text-sm rounded px-4 py-2.5 transition-colors flex items-center justify-center gap-2"
                    >
                      {saving ? (
                        <><span className="animate-spin inline-block">⟳</span> Enregistrement…</>
                      ) : (
                        <><span>↑</span> Enregistrer &amp; Sync</>
                      )}
                    </button>
                    <button
                      onClick={() => { setEditing(false); setForm(structure) }}
                      className="px-4 py-2 text-sm text-slate-400 hover:text-white border border-ardoise-700 rounded transition-colors"
                    >
                      Annuler
                    </button>
                  </div>
                  <div className="text-xs font-mono text-slate-600 text-center">
                    {saving ? (
                      <span className="text-amber-500">Enregistrement en cours…</span>
                    ) : autoSaveAt ? (
                      <span className="text-emerald-600">Sauvegarde auto à {autoSaveAt} ✓</span>
                    ) : (
                      <span>Sauvegarde automatique toutes les 2 min</span>
                    )}
                  </div>
                </>
              ) : (
                <button
                  onClick={() => setEditing(true)}
                  className="w-full bg-ardoise-700 hover:bg-ardoise-600 text-white text-sm font-medium rounded px-4 py-2.5 transition-colors flex items-center justify-center gap-2"
                >
                  <span>✎</span> Modifier la fiche
                </button>
              )}
            </div>
          </>
        )}

      </div>
    </div>
  )
}
