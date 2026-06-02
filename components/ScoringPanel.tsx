'use client'

import {
  BAREME,
  LIBELLES,
  NIVEAU_META,
  scoreMax,
  scoreProspect,
  niveau,
  type ProspectScoring,
  type NiveauKey,
} from '@/lib/prospection-scoring'

interface Props {
  values: ProspectScoring
  editing: boolean
  onChange: (field: keyof ProspectScoring, value: string) => void
}

const MAX = scoreMax()

export default function ScoringPanel({ values, editing, onChange }: Props) {
  const score = scoreProspect(values)
  const niv   = niveau(score) as NiveauKey | null
  const meta  = niv ? NIVEAU_META[niv] : null

  const pct = score != null ? Math.round((score / MAX) * 100) : 0

  return (
    <div className="space-y-5">
      {/* Jauge + badge niveau */}
      <div className="bg-ardoise-800 rounded-lg px-4 py-4 flex items-center gap-4">
        <div className="flex-1">
          <div className="flex items-baseline justify-between mb-1.5">
            <span className="text-xs font-mono text-slate-500 uppercase tracking-widest">Score RDV</span>
            <span className="text-lg font-bold text-white tabular-nums">
              {score != null ? score : '—'}
              <span className="text-sm font-normal text-slate-500">/{MAX}</span>
            </span>
          </div>
          {/* Barre de progression */}
          <div className="h-2 rounded-full bg-ardoise-700 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${pct}%`,
                backgroundColor: meta?.couleur ?? '#374151',
              }}
            />
          </div>
          {/* Seuils visuels */}
          <div className="relative mt-1 h-2">
            <span
              className="absolute text-[9px] font-mono text-slate-600"
              style={{ left: `${Math.round((BAREME.seuils.tiede / MAX) * 100)}%` }}
            >
              {BAREME.seuils.tiede}
            </span>
            <span
              className="absolute text-[9px] font-mono text-slate-600"
              style={{ left: `${Math.round((BAREME.seuils.chaud / MAX) * 100)}%` }}
            >
              {BAREME.seuils.chaud}
            </span>
          </div>
        </div>

        {/* Badge niveau */}
        <div
          className="flex-shrink-0 w-16 h-16 rounded-full flex items-center justify-center border-2 transition-all duration-300"
          style={{
            borderColor: meta?.couleur ?? '#374151',
            backgroundColor: meta ? `${meta.couleur}22` : 'transparent',
          }}
        >
          {meta ? (
            <span className="text-sm font-bold" style={{ color: meta.couleur }}>
              {meta.texte}
            </span>
          ) : (
            <span className="text-xs text-slate-600 text-center leading-tight">Non renseigné</span>
          )}
        </div>
      </div>

      {/* Critères */}
      <div className="space-y-4">
        {(Object.keys(BAREME.criteres) as (keyof ProspectScoring)[]).map((critere) => {
          const lib = LIBELLES[critere as string]
          const valeur = values[critere] ?? ''
          return (
            <div key={critere}>
              <label className="block text-xs font-mono text-slate-500 uppercase tracking-widest mb-2">
                {lib.label}
              </label>
              {editing ? (
                <div className="grid grid-cols-1 gap-1.5">
                  {Object.entries(lib.options).map(([key, texte]) => {
                    const pts = BAREME.criteres[critere as string][key]
                    const selected = valeur === key
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => onChange(critere, selected ? '' : key)}
                        className={`flex items-center justify-between px-3 py-2 rounded text-sm text-left transition-all border ${
                          selected
                            ? 'border-amber-500 bg-amber-500/10 text-amber-200'
                            : 'border-ardoise-600 bg-ardoise-800 text-slate-300 hover:border-ardoise-500 hover:text-white'
                        }`}
                      >
                        <span>{texte}</span>
                        <span
                          className={`ml-2 text-xs font-mono font-bold flex-shrink-0 ${
                            selected ? 'text-amber-400' : 'text-slate-600'
                          }`}
                        >
                          +{pts}
                        </span>
                      </button>
                    )
                  })}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  {valeur ? (
                    <>
                      <span className="text-sm text-slate-200">{lib.options[valeur]}</span>
                      <span className="text-xs font-mono text-amber-500 font-bold">
                        +{BAREME.criteres[critere as string][valeur]}
                      </span>
                    </>
                  ) : (
                    <span className="text-sm text-slate-600 italic">—</span>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Légende seuils */}
      <div className="border-t border-ardoise-800 pt-3 flex gap-4 text-xs font-mono text-slate-600">
        {(Object.keys(NIVEAU_META) as NiveauKey[]).map((k) => (
          <span key={k} className="flex items-center gap-1.5">
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: NIVEAU_META[k].couleur }}
            />
            {NIVEAU_META[k].texte} ≥{k === 'chaud' ? BAREME.seuils.chaud : k === 'tiede' ? BAREME.seuils.tiede : 0}
          </span>
        ))}
      </div>
    </div>
  )
}
