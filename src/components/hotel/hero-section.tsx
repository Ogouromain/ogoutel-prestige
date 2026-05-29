'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function HeroSection({
  onBookingClick,
}: {
  onBookingClick?: () => void;
}) {
  const [mouseY, setMouseY] = useState(0);

  const handleScrollDown = () => {
    const target = document.querySelector('#chambres');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleDiscover = () => {
    const target = document.querySelector('#chambres');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section
      id="accueil"
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src="/hotel/hero.png"
          alt="OgouTél Prestige"
          className="w-full h-full object-cover"
        />
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Decorative line */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="w-24 h-px bg-gold mx-auto mb-8"
        />

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="text-gold uppercase tracking-[0.3em] text-sm mb-4"
        >
          Bienvenue à Abidjan
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="font-heading text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-white font-bold mb-6 leading-tight"
        >
          Bienvenue à{' '}
          <span className="text-gold">OgouTél Prestige</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="text-white/70 text-lg sm:text-xl md:text-2xl font-heading italic mb-6"
        >
          L&apos;élégance au cœur d&apos;Abidjan
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.9 }}
          className="text-white/60 text-sm sm:text-base max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          Vivez une expérience inoubliable dans notre hôtel de luxe, où le
          raffinement africain rencontre l&apos;excellence de l&apos;hospitalité
          internationale. Chaque détail a été pensé pour votre plus grand
          confort.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.1 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          <Button
            onClick={handleDiscover}
            size="lg"
            className="bg-gold text-charcoal hover:bg-gold-dark font-semibold tracking-wide rounded-full px-8 h-12 text-base"
          >
            Découvrir nos chambres
          </Button>
          <Button
            onClick={onBookingClick}
            size="lg"
            variant="outline"
            className="border-white/30 text-white hover:bg-white/10 hover:text-white font-semibold tracking-wide rounded-full px-8 h-12 text-base"
          >
            Réserver maintenant
          </Button>
        </motion.div>

        {/* Decorative line */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 1, delay: 1.3 }}
          className="w-24 h-px bg-gold mx-auto mt-10"
        />
      </div>

      {/* Scroll Down Indicator */}
      <motion.button
        onClick={handleScrollDown}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
        aria-label="Défiler vers le bas"
      >
        <span className="text-white/50 text-xs uppercase tracking-widest">
          Découvrir
        </span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <ChevronDown className="h-6 w-6 text-gold" />
        </motion.div>
      </motion.button>
    </section>
  );
}
