'use client'

import { useState } from 'react'
import { pb, Structure, STATUT_BG, STATUT_COLORS } from '@/lib/pocketbase'
import ImportCSV from '@/components/ImportCSV'

interface Props {
  structures: Structure[]
  onClose: () => void
  onRefresh: () => void
  onSelectStructure: (s: Structure) => void
}

export default function AdminPanel({ structures, onClose, onRefresh, onSelectStructure }: Props) {
  const [showImport, setShowImport] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const handleLogout = () => {
    sessionStorage.removeItem('admin_ok')
    onClose()
  }

  const exportCSV = () => {
    const cols = ['nom','categorie','adresse','ville','code_postal','contact_nom','contact_tel','contact_email','statut','notes','dossier'] as const
    const escape = (v: unknown) => {
      const s = String(v ?? '')
      return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s
    }
    const rows = [
      cols.join(','),
      ...structures.map(s => cols.map(c => escape(s[c as keyof typeof s])).join(','))
    ]
    const blob = new Blob(['﻿' + rows.join('\r\n')], { type: 'text/csv;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `prospects_${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleDelete = async (id: string) => {
    setDeleting(id)
    try {
      await pb.collection('structures').delete(id)
      onRefresh()
    } catch (e) {
      console.error(e)
      alert('Erreur lors de la suppression')
    } finally {
      setDeleting(null)
      setConfirmId(null)
    }
  }

  const filtered = structures.filter(s =>
    s.nom.toLowerCase().includes(search.toLowerCase()) ||
    s.categorie?.toLowerCase().includes(search.toLowerCase()) ||
    s.ville?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="fixed inset-0 z-[1500] bg-ardoise-950 flex flex-col">

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-ardoise-700 bg-ardoise-900">
        <div className="flex items-center gap-3">
          <span className="text-amber-500 font-mono text-xs uppercase tracking-widest">Admin</span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400 text-sm">{structures.length} structures</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            className="bg-ardoise-700 hover:bg-ardoise-600 text-slate-300 hover:text-white text-xs font-medium rounded px-3 py-1.5 transition-colors flex items-center gap-1.5"
          >
            <span>↓</span> Exporter CSV
          </button>
          <button
            onClick={() => setShowImport(true)}
            className="bg-ardoise-700 hover:bg-ardoise-600 text-slate-300 hover:text-white text-xs font-medium rounded px-3 py-1.5 transition-colors flex items-center gap-1.5"
          >
            <span>↑</span> Importer CSV
          </button>
          <button
            onClick={handleLogout}
            className="text-xs text-slate-500 hover:text-white border border-ardoise-700 rounded px-3 py-1.5 transition-colors"
          >
            Déconnexion
          </button>
          <button onClick={onClose} className="text-slate-500 hover:text-white text-xl leading-none ml-1">×</button>
        </div>
      </div>

      {/* Recherche */}
      <div className="px-5 py-3 border-b border-ardoise-700">
        <input
          type="text"
          placeholder="Rechercher par nom, catégorie, ville…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full max-w-sm bg-ardoise-800 border border-ardoise-600 rounded px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500"
        />
      </div>

      {/* Tableau */}
      <div className="flex-1 overflow-auto px-5 py-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs font-mono text-slate-500 uppercase tracking-widest border-b border-ardoise-700">
              <th className="pb-3 pr-4">Nom</th>
              <th className="pb-3 pr-4">Catégorie</th>
              <th className="pb-3 pr-4">Statut</th>
              <th className="pb-3 pr-4">Ville</th>
              <th className="pb-3 pr-4">Téléphone</th>
              <th className="pb-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(s => (
              <tr
                key={s.id}
                className="border-b border-ardoise-800 hover:bg-ardoise-900 transition-colors group"
              >
                <td className="py-3 pr-4">
                  <button
                    onClick={() => { onSelectStructure(s); onClose() }}
                    className="text-slate-200 hover:text-amber-400 font-medium text-left transition-colors"
                  >
                    {s.nom}
                  </button>
                </td>
                <td className="py-3 pr-4 text-slate-500 font-mono text-xs">{s.categorie || '—'}</td>
                <td className="py-3 pr-4">
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUT_BG[s.statut] || 'border-ardoise-700 text-slate-500'}`}>
                    {s.statut || '—'}
                  </span>
                </td>
                <td className="py-3 pr-4 text-slate-400 text-xs">{s.ville || '—'}</td>
                <td className="py-3 pr-4 text-slate-400 text-xs font-mono">{s.contact_tel || '—'}</td>
                <td className="py-3 text-right">
                  {confirmId === s.id ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="text-xs text-slate-400">Confirmer ?</span>
                      <button
                        onClick={() => handleDelete(s.id)}
                        disabled={deleting === s.id}
                        className="text-xs bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded px-2 py-1 transition-colors"
                      >
                        {deleting === s.id ? '…' : 'Oui'}
                      </button>
                      <button
                        onClick={() => setConfirmId(null)}
                        className="text-xs text-slate-500 hover:text-white border border-ardoise-700 rounded px-2 py-1 transition-colors"
                      >
                        Non
                      </button>
                    </span>
                  ) : (
                    <button
                      onClick={() => setConfirmId(s.id)}
                      className="text-xs text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      Supprimer
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="text-center text-slate-600 font-mono text-sm py-12">
            Aucune structure
          </div>
        )}
      </div>

      {showImport && (
        <ImportCSV
          onImported={() => { onRefresh(); setShowImport(false) }}
          onClose={() => setShowImport(false)}
        />
      )}
    </div>
  )
}
