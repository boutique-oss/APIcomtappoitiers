import PocketBase from 'pocketbase'

const PB_URL = process.env.NEXT_PUBLIC_PB_URL || 'http://127.0.0.1:8090'

export const pb = new PocketBase(PB_URL)

export type Statut = 'À contacter' | 'En cours' | 'RDV planifié' | 'Signé' | 'Sans suite'

export interface Structure {
  id: string
  nom: string
  categorie: string
  adresse: string
  ville: string
  code_postal: string
  lat: number
  lng: number
  contact_nom: string
  contact_tel: string
  contact_email: string
  statut: Statut
  notes: string
  created: string
  updated: string
}

export const STATUT_COLORS: Record<Statut, string> = {
  'À contacter': '#6b7280',
  'En cours':    '#f59e0b',
  'RDV planifié':'#3b82f6',
  'Signé':       '#10b981',
  'Sans suite':  '#ef4444',
}

export const STATUT_BG: Record<Statut, string> = {
  'À contacter': 'bg-gray-500/20 text-gray-300 border-gray-500/30',
  'En cours':    'bg-amber-500/20 text-amber-300 border-amber-500/30',
  'RDV planifié':'bg-blue-500/20 text-blue-300 border-blue-500/30',
  'Signé':       'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  'Sans suite':  'bg-red-500/20 text-red-300 border-red-500/30',
}
