'use client'

import { useState, useRef } from 'react'
import Papa from 'papaparse'
import { pb } from '@/lib/pocketbase'

interface Props {
  onImported: () => void
  onClose: () => void
}

interface CSVRow {
  nom?: string
  categorie?: string
  adresse?: string
  ville?: string
  code_postal?: string
  contact_nom?: string
  contact_tel?: string
  contact_email?: string
  statut?: string
  notes?: string
  [key: string]: string | undefined
}

async function geocode(adresse: string, ville: string, cp: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const query = encodeURIComponent(`${adresse} ${cp} ${ville}`)
    const res = await fetch(`https://api-adresse.data.gouv.fr/search/?q=${query}&limit=1`)
    const data = await res.json()
    if (data.features?.length > 0) {
      const [lng, lat] = data.features[0].geometry.coordinates
      return { lat, lng }
    }
  } catch (e) {
    console.error('Geocode error', e)
  }
  return null
}

export default function ImportCSV({ onImported, onClose }: Props) {
  const [step, setStep] = useState<'upload' | 'preview' | 'importing' | 'done'>('upload')
  const [rows, setRows] = useState<CSVRow[]>([])
  const [progress, setProgress] = useState(0)
  const [errors, setErrors] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = (file: File) => {
    Papa.parse<CSVRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setRows(results.data)
        setStep('preview')
      },
    })
  }

  const handleImport = async () => {
    setStep('importing')
    const errs: string[] = []
    let done = 0

    for (const row of rows) {
      try {
        // Géocodage automatique via BAN/BANO
        let lat = 0
        let lng = 0
        if (row.adresse || row.ville) {
          const coords = await geocode(row.adresse || '', row.ville || '', row.code_postal || '')
          if (coords) { lat = coords.lat; lng = coords.lng }
        }

        const STATUTS_VALIDES = ['À contacter', 'En cours', 'RDV planifié', 'Signé', 'Sans suite']
        const statutValue = (row.statut || '').trim()

        const payload: Record<string, unknown> = {
          nom: row.nom || 'Sans nom',
          categorie: row.categorie || '',
          adresse: row.adresse || '',
          ville: row.ville || '',
          code_postal: row.code_postal || '',
          lat,
          lng,
          contact_nom: row.contact_nom || '',
          contact_tel: row.contact_tel || '',
          notes: row.notes || '',
        }
        if (statutValue && STATUTS_VALIDES.includes(statutValue)) payload.statut = statutValue
        if (row.contact_email?.trim()) payload.contact_email = row.contact_email.trim()

        await pb.collection('structures').create(payload)
      } catch (e: any) {
        const detail = e?.data ? ` | ${JSON.stringify(e.data)}` : ''
        errs.push(`${row.nom}: ${e.message}${detail}`)
      }

      done++
      setProgress(Math.round((done / rows.length) * 100))
    }

    setErrors(errs)
    setStep('done')
    if (errs.length === 0) {
      setTimeout(() => { onImported(); onClose() }, 1500)
    } else {
      onImported()
    }
  }

  return (
    <div className="fixed inset-0 z-[2000] bg-black/70 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-ardoise-900 border border-ardoise-700 rounded-xl shadow-2xl w-full max-w-lg fade-up"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-ardoise-700 flex items-center justify-between">
          <h3 className="font-bold text-white">Import CSV</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white text-xl leading-none">×</button>
        </div>

        <div className="p-6">
          {step === 'upload' && (
            <div>
              <p className="text-sm text-slate-400 mb-4">
                Colonnes attendues : <span className="font-mono text-amber-400 text-xs">nom, categorie, adresse, ville, code_postal, contact_nom, contact_tel, contact_email, statut, notes</span>
              </p>
              <div
                className="border-2 border-dashed border-ardoise-600 hover:border-amber-500 rounded-lg p-8 text-center cursor-pointer transition-colors"
                onClick={() => inputRef.current?.click()}
                onDragOver={e => e.preventDefault()}
                onDrop={e => {
                  e.preventDefault()
                  const file = e.dataTransfer.files[0]
                  if (file) handleFile(file)
                }}
              >
                <div className="text-3xl mb-2">📂</div>
                <div className="text-slate-400 text-sm">Glisse ton CSV ici ou clique pour choisir</div>
                <input
                  ref={inputRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]) }}
                />
              </div>
              <a
                href="/template.csv"
                download
                className="mt-3 block text-center text-xs text-amber-500 hover:text-amber-400"
              >
                ↓ Télécharger le template CSV
              </a>
            </div>
          )}

          {step === 'preview' && (
            <div>
              <p className="text-sm text-slate-400 mb-3">
                <span className="text-white font-bold">{rows.length} lignes</span> détectées. Les adresses seront géocodées automatiquement.
              </p>
              <div className="bg-ardoise-800 rounded-lg overflow-auto max-h-48 mb-4">
                <table className="text-xs w-full">
                  <thead>
                    <tr className="text-slate-500 border-b border-ardoise-700">
                      {Object.keys(rows[0] || {}).slice(0, 5).map(k => (
                        <th key={k} className="px-3 py-2 text-left font-mono">{k}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, 5).map((row, i) => (
                      <tr key={i} className="border-b border-ardoise-700/50">
                        {Object.values(row).slice(0, 5).map((v, j) => (
                          <td key={j} className="px-3 py-2 text-slate-300 truncate max-w-[120px]">{v}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button
                onClick={handleImport}
                className="w-full bg-amber-500 hover:bg-amber-400 text-ardoise-950 font-bold rounded px-4 py-2.5 transition-colors"
              >
                Importer {rows.length} structures
              </button>
            </div>
          )}

          {step === 'importing' && (
            <div className="text-center py-4">
              <div className="text-slate-400 text-sm mb-3">Import en cours… ({progress}%)</div>
              <div className="w-full bg-ardoise-800 rounded-full h-2">
                <div
                  className="bg-amber-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="text-xs text-slate-600 mt-2">Géocodage des adresses via BANO…</div>
            </div>
          )}

          {step === 'done' && (
            <div className="text-center py-4">
              {errors.length === 0 ? (
                <div>
                  <div className="text-3xl mb-2">✅</div>
                  <div className="text-white font-bold">{rows.length} structures importées</div>
                </div>
              ) : (
                <div>
                  <div className="text-amber-400 font-bold mb-2">{rows.length - errors.length} importées, {errors.length} erreurs</div>
                  <div className="text-xs text-red-400 text-left bg-ardoise-800 rounded p-3 max-h-32 overflow-auto">
                    {errors.map((e, i) => <div key={i}>{e}</div>)}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
