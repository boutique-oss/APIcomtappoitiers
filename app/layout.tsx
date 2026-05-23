import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Grand Poitiers — Cartographie Partenaires',
  description: 'Outil de suivi des partenaires Grand Poitiers — Atelier Stéphan Hamache',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  )
}
