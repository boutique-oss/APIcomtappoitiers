'use client'

import { useState, useEffect } from 'react'
import { Structure } from '@/lib/pocketbase'

const STORAGE_KEY = 'dossiers_list'

interface Props {
  structures: Structure[]
  activeDossier: string | null
  onSelectDossier: (name: string | null) => void
  onMoveToDossier: (structureId: string, dossier: string) => void
}

function loadDossiers(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveDossiers(list: string[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}

export default function FolderManager({ structures, activeDossier, onSelectDossier, onMoveToDossier }: Props) {
  const [dossiers, setDossiers] = useState<string[]>([])
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [dragOver, setDragOver] = useState<string | null>(null)
  const [renaming, setRenaming] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  useEffect(() => {
    const stored = loadDossiers()
    const fromStructures = structures
      .map(s => s.dossier)
      .filter((d): d is string => Boolean(d && d.trim()))
    const merged = Array.from(new Set([...stored, ...fromStructures]))
    setDossiers(merged)
    if (merged.length !== stored.length) saveDossiers(merged)
  }, [structures])

  const countIn = (name: string) => structures.filter(s => s.dossier === name).length
  const countUnclassified = structures.filter(s => !s.dossier || !s.dossier.trim()).length

  const handleDrop = (e: React.DragEvent, targetDossier: string) => {
    e.preventDefault()
    const id = e.dataTransfer.getData('structure_id')
    if (id) onMoveToDossier(id, targetDossier)
    setDragOver(null)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOver(null)
  }

  const commitCreate = () => {
    const name = newName.trim()
    if (name && !dossiers.includes(name)) {
      const updated = [...dossiers, name]
      setDossiers(updated)
      saveDossiers(updated)
    }
    setCreating(false)
    setNewName('')
  }

  const commitRename = (oldName: string) => {
    const name = renameValue.trim()
    setRenaming(null)
    if (!name || name === oldName) return
    const updated = dossiers.map(d => d === oldName ? name : d)
    setDossiers(updated)
    saveDossiers(updated)
    structures.filter(s => s.dossier === oldName).forEach(s => onMoveToDossier(s.id, name))
    if (activeDossier === oldName) onSelectDossier(name)
  }

  const deleteFolder = (name: string) => {
    const updated = dossiers.filter(d => d !== name)
    setDossiers(updated)
    saveDossiers(updated)
    structures.filter(s => s.dossier === name).forEach(s => onMoveToDossier(s.id, ''))
    if (activeDossier === name) onSelectDossier(null)
  }

  const itemClass = (key: string) =>
    `group flex items-center gap-1.5 px-2 py-1.5 rounded-lg cursor-pointer transition-all text-xs mb-0.5 border ${
      dragOver === key
        ? 'bg-amber-500/20 border-amber-500/50 text-white'
        : activeDossier === key
        ? 'bg-ardoise-700 border-ardoise-600 text-white'
        : 'border-transparent hover:bg-ardoise-800 text-slate-400 hover:text-slate-200'
    }`

  return (
    <div className="px-3 py-2 border-b border-ardoise-700">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-mono text-slate-500 uppercase tracking-widest">Dossiers</span>
        <button
          onClick={() => setCreating(true)}
          title="Nouveau dossier"
          className="text-slate-600 hover:text-amber-400 transition-colors w-5 h-5 flex items-center justify-center rounded hover:bg-ardoise-700 text-base leading-none"
        >
          +
        </button>
      </div>

      {/* Tous les prospects */}
      <div
        className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg cursor-pointer transition-all text-xs mb-0.5 border ${
          activeDossier === null
            ? 'bg-ardoise-700 border-ardoise-600 text-white'
            : 'border-transparent hover:bg-ardoise-800 text-slate-400 hover:text-slate-200'
        }`}
        onClick={() => onSelectDossier(null)}
      >
        <span className="text-sm leading-none">📋</span>
        <span className="flex-1 font-medium">Tous les prospects</span>
        <span className="text-xs font-mono text-slate-600">{structures.length}</span>
      </div>

      {/* Non classé */}
      <div
        className={itemClass('Non classé')}
        onClick={() => onSelectDossier('Non classé')}
        onDragOver={e => { e.preventDefault(); setDragOver('Non classé') }}
        onDragLeave={handleDragLeave}
        onDrop={e => handleDrop(e, '')}
      >
        <span className="text-sm leading-none">📁</span>
        <span className="flex-1 font-medium">Non classé</span>
        <span className="text-xs font-mono text-slate-600">{countUnclassified}</span>
      </div>

      {/* Dossiers personnalisés */}
      {dossiers.map(name => (
        <div key={name}>
          {renaming === name ? (
            <div className="flex items-center gap-1 px-1 py-1 mb-0.5">
              <span className="text-sm leading-none ml-1">📂</span>
              <input
                autoFocus
                className="flex-1 bg-ardoise-700 border border-amber-500 rounded px-2 py-0.5 text-xs text-white outline-none"
                value={renameValue}
                onChange={e => setRenameValue(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') commitRename(name)
                  if (e.key === 'Escape') setRenaming(null)
                }}
                onBlur={() => commitRename(name)}
              />
            </div>
          ) : confirmDelete === name ? (
            <div className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-red-900/20 border border-red-500/30 text-xs mb-0.5">
              <span className="flex-1 text-red-300 truncate">Supprimer «&nbsp;{name}&nbsp;» ?</span>
              <button
                onClick={e => { e.stopPropagation(); deleteFolder(name); setConfirmDelete(null) }}
                className="text-red-400 hover:text-red-300 font-bold px-1"
              >
                Oui
              </button>
              <button
                onClick={e => { e.stopPropagation(); setConfirmDelete(null) }}
                className="text-slate-500 hover:text-white px-1"
              >
                Non
              </button>
            </div>
          ) : (
            <div
              className={itemClass(name)}
              onClick={() => onSelectDossier(name)}
              onDragOver={e => { e.preventDefault(); setDragOver(name) }}
              onDragLeave={handleDragLeave}
              onDrop={e => handleDrop(e, name)}
            >
              <span className="text-sm leading-none">📂</span>
              <span className="flex-1 truncate font-medium">{name}</span>
              <span className="text-xs font-mono text-slate-600 group-hover:hidden">{countIn(name)}</span>
              <button
                onClick={e => { e.stopPropagation(); setRenaming(name); setRenameValue(name) }}
                className="hidden group-hover:flex items-center justify-center text-slate-600 hover:text-amber-400 transition-colors text-xs leading-none px-0.5"
                title="Renommer"
              >
                ✏️
              </button>
              <button
                onClick={e => { e.stopPropagation(); setConfirmDelete(name) }}
                className="hidden group-hover:flex items-center justify-center text-slate-600 hover:text-red-400 transition-colors text-sm leading-none"
                title="Supprimer le dossier"
              >
                ×
              </button>
            </div>
          )}
        </div>
      ))}

      {/* Créer un nouveau dossier */}
      {creating && (
        <div className="flex items-center gap-1.5 px-1 py-1 mt-1">
          <span className="text-sm leading-none ml-1">📂</span>
          <input
            autoFocus
            placeholder="Nom du dossier…"
            className="flex-1 bg-ardoise-700 border border-amber-500 rounded px-2 py-0.5 text-xs text-white placeholder-slate-600 outline-none"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') commitCreate()
              if (e.key === 'Escape') { setCreating(false); setNewName('') }
            }}
            onBlur={commitCreate}
          />
        </div>
      )}
    </div>
  )
}
