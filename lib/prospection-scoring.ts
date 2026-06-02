/**
 * prospection-scoring.ts
 * Logique d'acceptabilité RDV — reproduction exacte du barème Excel.
 */

export interface Bareme {
  criteres: Record<string, Record<string, number>>
  seuils: { chaud: number; tiede: number }
}

export const BAREME: Bareme = {
  criteres: {
    potentielMobilier: { eleve: 3, moyen: 2, faible: 1 },
    proximite:         { poitiers: 3, vienne: 2, hors86: 0 },
    relation:          { chaud: 3, echange: 2, inconnu: 0 },
    besoin:            { identifie: 3, probable: 2, non: 0 },
  },
  seuils: { chaud: 9, tiede: 5 },
}

export const LIBELLES: Record<string, { label: string; options: Record<string, string> }> = {
  potentielMobilier: {
    label: 'Potentiel mobilier',
    options: {
      eleve:  'Élevé (sièges anciens, salles à équiper)',
      moyen:  'Moyen',
      faible: 'Faible',
    },
  },
  proximite: {
    label: 'Proximité',
    options: {
      poitiers: 'Poitiers / agglo',
      vienne:   'Vienne (86)',
      hors86:   'Hors 86',
    },
  },
  relation: {
    label: 'Relation',
    options: {
      chaud:   'Contact chaud / déjà client',
      echange: 'Déjà un échange / reco',
      inconnu: 'Inconnu',
    },
  },
  besoin: {
    label: 'Besoin',
    options: {
      identifie: 'Identifié (mobilier vu / annoncé)',
      probable:  'Probable',
      non:       'Non / inconnu',
    },
  },
}

export type NiveauKey = 'chaud' | 'tiede' | 'froid'

export const NIVEAU_META: Record<NiveauKey, { texte: string; couleur: string; priorite: number }> = {
  chaud: { texte: 'Chaud',  couleur: '#C6543C', priorite: 1 },
  tiede: { texte: 'Tiède',  couleur: '#E9B44C', priorite: 2 },
  froid: { texte: 'Froid',  couleur: '#ADB5BD', priorite: 3 },
}

export function scoreMax(bareme = BAREME): number {
  return Object.values(bareme.criteres).reduce(
    (tot, opts) => tot + Math.max(...Object.values(opts)),
    0,
  )
}

export type ProspectScoring = Partial<{
  potentielMobilier: string
  proximite: string
  relation: string
  besoin: string
}>

export function scoreProspect(prospect: ProspectScoring, bareme = BAREME): number | null {
  const renseignes = Object.keys(bareme.criteres).filter(
    (c) => (prospect as Record<string, string>)[c] != null && (prospect as Record<string, string>)[c] !== '',
  )
  if (renseignes.length === 0) return null
  return renseignes.reduce((tot, c) => {
    const points = bareme.criteres[c][(prospect as Record<string, string>)[c]]
    return tot + (Number.isFinite(points) ? points : 0)
  }, 0)
}

export function niveau(score: number | null, bareme = BAREME): NiveauKey | null {
  if (score == null) return null
  if (score >= bareme.seuils.chaud) return 'chaud'
  if (score >= bareme.seuils.tiede) return 'tiede'
  return 'froid'
}
