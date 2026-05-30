'use client'
import Link from 'next/link'
import { Hotel, Mail, Phone, MessageCircle, Heart, ArrowUp } from 'lucide-react'

const QUICK_LINKS = [
  { label: 'Accueil', href: '#hero' },
  { label: 'Fonctionnalités', href: '#fonctionnalites' },
  { label: 'Tarifs', href: '#tarifs' },
  { label: 'Connexion', href: '/login' },
]

export function Footer() {
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })

  return (
    <footer className="no-print bg-elegant-black text-white">
      {/* Main footer content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Logo + slogan */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Hotel className="h-7 w-7 text-gold" />
              <span className="text-xl font-bold">OGOUTEL<span className="text-gold">_Prestige</span></span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed max-w-sm mb-6">
              La gestion hôtelière intelligente pour la Côte d&apos;Ivoire. Simplifiez votre quotidien, augmentez vos revenus.
            </p>
          </div>

          {/* Liens rapides */}
          <div>
            <h4 className="font-semibold text-white mb-4">Liens rapides</h4>
            <ul className="space-y-2">
              {QUICK_LINKS.map(link => (
                <li key={link.href}>
                  {link.href.startsWith('#') ? (
                    <button onClick={() => document.querySelector(link.href)?.scrollIntoView({ behavior: 'smooth' })} className="text-gray-400 hover:text-gold text-sm transition-colors">
                      {link.label}
                    </button>
                  ) : (
                    <Link href={link.href} className="text-gray-400 hover:text-gold text-sm transition-colors">
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-white mb-4">Contact</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-gray-400 text-sm">
                <Mail className="h-4 w-4 text-gold" />
                omouitsi@gmail.com
              </li>
              <li className="flex items-center gap-2 text-gray-400 text-sm">
                <Phone className="h-4 w-4 text-gold" />
                +225 0576103277
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Separator */}
      <div className="border-t border-white/10" />

      {/* Bottom bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-gray-500 text-sm">
          © 2025 OGOUTEL_Prestige. Tous droits réservés. Fait avec <Heart className="inline h-3 w-3 text-red-500" /> en Côte d&apos;Ivoire 🇨🇮
        </p>
        <div className="flex items-center gap-4 text-gray-500 text-sm">
          <Link href="#" className="hover:text-gold transition-colors">Conditions d&apos;utilisation</Link>
          <Link href="#" className="hover:text-gold transition-colors">Politique de confidentialité</Link>
        </div>
      </div>

      {/* WhatsApp floating button */}
      <a
        href="https://wa.me/2250576103277?text=Bonjour%20OGOU%2C%20je%20suis%20int%C3%A9ress%C3%A9%20par%20OGOUTEL_Prestige"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center shadow-lg animate-whatsapp-pulse transition-transform hover:scale-110"
        aria-label="Discuter sur WhatsApp"
      >
        <MessageCircle className="h-7 w-7 text-white" />
      </a>

      {/* Scroll to top */}
      <button
        onClick={scrollToTop}
        className="fixed bottom-6 right-24 z-50 w-10 h-10 bg-gold hover:bg-gold-dark rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110"
        aria-label="Retour en haut"
      >
        <ArrowUp className="h-5 w-5 text-black" />
      </button>
    </footer>
  )
}
