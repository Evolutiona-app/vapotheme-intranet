import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Vapotheme — Espace équipe',
  description: 'Intranet Vapotheme',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
      </head>
      <body>{children}</body>
    </html>
  )
}
