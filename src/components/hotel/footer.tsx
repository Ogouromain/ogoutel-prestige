'use client';

import {
  Phone,
  Mail,
  MapPin,
  Clock,
  MessageCircle,
} from 'lucide-react';

const quickLinks = [
  { label: 'Accueil', href: '#accueil' },
  { label: 'Chambres', href: '#chambres' },
  { label: 'Services', href: '#services' },
  { label: 'Témoignages', href: '#temoignages' },
  { label: 'Contact', href: '#contact' },
];

const services = [
  'Piscine à débordement',
  'Restaurant gastronomique',
  'Spa & Bien-être',
  'Room Service 24/7',
  'Parking sécurisé',
  'WiFi haut débit',
];

export function Footer() {
  const handleNavClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string
  ) => {
    e.preventDefault();
    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer className="bg-charcoal text-white">
      {/* Main Footer Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">
          {/* Brand Column */}
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-full bg-gold flex items-center justify-center">
                <span className="text-charcoal font-heading font-bold text-lg">
                  O
                </span>
              </div>
              <div className="flex flex-col">
                <span className="font-heading text-xl font-bold tracking-wide text-gold">
                  OgouTél
                </span>
                <span className="text-[10px] uppercase tracking-[0.3em] text-white/50">
                  Prestige
                </span>
              </div>
            </div>
            <p className="text-white/60 text-sm leading-relaxed mb-6">
              L&apos;excellence de l&apos;hospitalité au cœur d&apos;Abidjan.
              Un lieu d&apos;exception où luxe, confort et authenticité
              africaine se rencontrent.
            </p>
            {/* WhatsApp */}
            <a
              href="https://wa.me/2250576103277"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-gold/10 hover:bg-gold/20 text-gold rounded-full px-4 py-2 text-sm font-medium transition-colors"
            >
              <MessageCircle className="h-4 w-4" />
              WhatsApp
            </a>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-heading text-lg font-semibold mb-6 text-gold">
              Liens rapides
            </h4>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    onClick={(e) => handleNavClick(e, link.href)}
                    className="text-white/60 hover:text-gold text-sm transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-heading text-lg font-semibold mb-6 text-gold">
              Nos services
            </h4>
            <ul className="space-y-3">
              {services.map((service) => (
                <li key={service}>
                  <span className="text-white/60 text-sm">{service}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="font-heading text-lg font-semibold mb-6 text-gold">
              Contact
            </h4>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Mail className="h-4 w-4 text-gold mt-1 shrink-0" />
                <a
                  href="mailto:omouitsi@gmail.com"
                  className="text-white/60 hover:text-gold text-sm transition-colors"
                >
                  omouitsi@gmail.com
                </a>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="h-4 w-4 text-gold mt-1 shrink-0" />
                <a
                  href="https://wa.me/2250576103277"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/60 hover:text-gold text-sm transition-colors"
                >
                  +225 0576103277
                </a>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-gold mt-1 shrink-0" />
                <span className="text-white/60 text-sm">
                  Cocody Riviera, Abidjan
                  <br />
                  Côte d&apos;Ivoire
                </span>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="h-4 w-4 text-gold mt-1 shrink-0" />
                <span className="text-white/60 text-sm">
                  Réception ouverte
                  <br />
                  24h/24, 7j/7
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-white/40 text-sm">
            © 2025 OgouTél Prestige. Tous droits réservés.
          </p>
          <p className="text-white/30 text-xs">
            Hôtel de luxe à Abidjan, Côte d&apos;Ivoire
          </p>
        </div>
      </div>
    </footer>
  );
}
