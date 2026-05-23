'use client'

import { useState } from 'react'

interface Props {
  onSuccess: () => void
  onClose?: () => void
  mandatory?: boolean
}

export default function AdminAuth({ onSuccess, onClose, mandatory = false }: Props) {
  const [code, setCode] = useState('')
  const [error, setError] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const expected = process.env.NEXT_PUBLIC_ADMIN_CODE
    if (code === expected) {
      sessionStorage.setItem('admin_ok', '1')
      onSuccess()
    } else {
      setError(true)
      setCode('')
    }
  }

  const handleBackdrop = () => {
    if (!mandatory && onClose) onClose()
  }

  return (
    <div
      className="fixed inset-0 z-[2000] bg-ardoise-950 flex items-center justify-center p-4"
      onClick={handleBackdrop}
    >
      <div
        className="bg-ardoise-900 border border-ardoise-700 rounded-xl shadow-2xl w-full max-w-xs fade-up"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-6 py-7">
          <div className="text-center mb-6">
            <div className="text-xs font-mono text-amber-500 uppercase tracking-widest mb-3">
              Atelier S. Hamache
            </div>
            <h1 className="text-xl font-bold text-white">Partenaires Grand Poitiers</h1>
            <p className="text-xs text-slate-500 mt-2">Entrez le code d'accès</p>
          </div>

          <form onSubmit={handleSubmit}>
            <input
              type="password"
              value={code}
              onChange={e => { setCode(e.target.value); setError(false) }}
              placeholder="Code…"
              autoFocus
              className={`w-full bg-ardoise-800 border rounded px-3 py-2.5 text-sm text-center text-slate-200 tracking-widest focus:outline-none transition-colors ${
                error ? 'border-red-500 focus:border-red-400' : 'border-ardoise-600 focus:border-amber-500'
              }`}
            />
            {error && (
              <p className="text-xs text-red-400 text-center mt-2">Code incorrect</p>
            )}
            <button
              type="submit"
              className="w-full mt-3 bg-amber-500 hover:bg-amber-400 text-ardoise-950 font-bold rounded px-4 py-2.5 text-sm transition-colors"
            >
              Accéder
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
