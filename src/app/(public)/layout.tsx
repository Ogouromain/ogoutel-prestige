import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'OGOUTEL_Prestige — La Gestion Hôtelière Intelligente en Côte d\'Ivoire',
  description: 'Gérez vos réservations, chambres et revenus depuis un seul tableau de bord. Le SaaS N°1 de gestion hôtelière en Côte d\'Ivoire. Démarrez gratuitement.',
  keywords: ['hôtel', 'gestion hôtelière', 'Côte d\'Ivoire', 'réservation', 'OGOUTEL', 'SaaS', 'Abidjan', 'logiciel hôtel'],
  openGraph: {
    title: 'OGOUTEL_Prestige — Gestion Hôtelière Intelligente',
    description: 'Le SaaS N°1 de gestion hôtelière en Côte d\'Ivoire',
    type: 'website',
    locale: 'fr_CI',
  },
}

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
