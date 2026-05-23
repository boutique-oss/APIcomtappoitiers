import dynamic from 'next/dynamic'
import { Structure } from '@/lib/pocketbase'

const MapClient = dynamic(() => import('./MapClient'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-ardoise-900 flex items-center justify-center">
      <div className="text-slate-500 font-mono text-sm animate-pulse">Chargement carte…</div>
    </div>
  ),
})

interface Props {
  structures: Structure[]
  onSelect: (s: Structure) => void
  selected: Structure | null
}

export default function Map(props: Props) {
  return <MapClient {...props} />
}
