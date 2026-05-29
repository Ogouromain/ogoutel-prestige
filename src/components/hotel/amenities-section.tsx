'use client';

import { motion } from 'framer-motion';
import {
  Waves,
  UtensilsCrossed,
  Sparkles,
  Wifi,
  Car,
  ConciergeBell,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const amenities = [
  {
    icon: Waves,
    title: 'Piscine à débordement',
    description:
      'Détendez-vous dans notre piscine à débordement avec vue panoramique, entourée de transats luxueux et de jardins tropicaux.',
    image: '/hotel/pool.png',
  },
  {
    icon: UtensilsCrossed,
    title: 'Restaurant Gastronomique',
    description:
      'Savourez une cuisine raffinée mêlant saveurs locales et influences internationales, élaborée par notre chef étoilé.',
    image: '/hotel/restaurant.png',
  },
  {
    icon: Sparkles,
    title: 'Spa & Bien-être',
    description:
      'Offrez-vous un moment de détente absolue avec nos soins exclusifs inspirés des traditions africaines.',
    image: '/hotel/spa.png',
  },
  {
    icon: Wifi,
    title: 'WiFi Haut Débit',
    description:
      'Restez connecté avec notre internet haut débit disponible dans tout l\'établissement, y compris les espaces communs.',
    image: null,
  },
  {
    icon: Car,
    title: 'Parking Sécurisé',
    description:
      'Profitez de notre parking privé surveillé 24h/24, avec service de voiturier disponible sur demande.',
    image: null,
  },
  {
    icon: ConciergeBell,
    title: 'Room Service 24/7',
    description:
      'Notre service d\'étage est à votre disposition jour et nuit pour répondre à toutes vos demandes.',
    image: null,
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut' },
  },
};

export function AmenitiesSection() {
  return (
    <section id="services" className="py-20 lg:py-28 bg-charcoal">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <p className="text-gold uppercase tracking-[0.3em] text-sm mb-3">
            Ce que nous offrons
          </p>
          <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            Nos Services
          </h2>
          <div className="w-20 h-0.5 bg-gold mx-auto mb-6" />
          <p className="text-white/60 max-w-2xl mx-auto text-base">
            Une expérience complète de luxe, avec des services pensés pour
            sublimer chaque instant de votre séjour.
          </p>
        </motion.div>

        {/* Amenities Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {amenities.map((amenity) => (
            <motion.div
              key={amenity.title}
              variants={itemVariants}
              className={cn(
                'group relative overflow-hidden rounded-xl transition-all duration-500',
                amenity.image
                  ? 'h-80'
                  : 'h-64 border border-white/10 hover:border-gold/30'
              )}
            >
              {amenity.image ? (
                <>
                  <img
                    src={amenity.image}
                    alt={amenity.title}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
                </>
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-charcoal to-[#2A2520]" />
              )}

              <div className="relative z-10 h-full flex flex-col justify-end p-6">
                <div className="w-12 h-12 rounded-full bg-gold/20 flex items-center justify-center mb-4 group-hover:bg-gold/30 transition-colors">
                  <amenity.icon className="h-6 w-6 text-gold" />
                </div>
                <h3 className="font-heading text-lg font-bold text-white mb-2">
                  {amenity.title}
                </h3>
                <p className="text-white/70 text-sm leading-relaxed">
                  {amenity.description}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
