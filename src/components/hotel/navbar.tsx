'use client';

import { useState, useEffect, useCallback } from 'react';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

const navLinks = [
  { label: 'Accueil', href: '#accueil' },
  { label: 'Chambres', href: '#chambres' },
  { label: 'Services', href: '#services' },
  { label: 'Témoignages', href: '#temoignages' },
  { label: 'Contact', href: '#contact' },
];

export function Navbar({
  onBookingClick,
}: {
  onBookingClick?: () => void;
}) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
      e.preventDefault();
      const target = document.querySelector(href);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    },
    []
  );

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-500',
        scrolled
          ? 'bg-charcoal/95 backdrop-blur-md shadow-lg py-3'
          : 'bg-transparent py-5'
      )}
    >
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Logo */}
        <a
          href="#accueil"
          onClick={(e) => handleNavClick(e, '#accueil')}
          className="flex items-center gap-2"
        >
          <div className="w-10 h-10 rounded-full bg-gold flex items-center justify-center">
            <span className="text-charcoal font-heading font-bold text-lg">
              O
            </span>
          </div>
          <div className="flex flex-col">
            <span
              className={cn(
                'font-heading text-xl font-bold tracking-wide transition-colors duration-300',
                scrolled ? 'text-gold' : 'text-white'
              )}
            >
              OgouTél
            </span>
            <span
              className={cn(
                'text-[10px] uppercase tracking-[0.3em] transition-colors duration-300',
                scrolled ? 'text-gold-light' : 'text-white/70'
              )}
            >
              Prestige
            </span>
          </div>
        </a>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={(e) => handleNavClick(e, link.href)}
              className={cn(
                'text-sm font-medium tracking-wide transition-colors duration-300 hover:text-gold',
                scrolled ? 'text-white/90' : 'text-white/80'
              )}
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Desktop CTA */}
        <div className="hidden lg:block">
          <Button
            onClick={onBookingClick}
            className="bg-gold text-charcoal hover:bg-gold-dark font-semibold tracking-wide rounded-full px-6"
          >
            Réserver
          </Button>
        </div>

        {/* Mobile Menu */}
        <div className="lg:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  'hover:bg-transparent',
                  scrolled ? 'text-white' : 'text-white'
                )}
              >
                <Menu className="h-6 w-6" />
                <span className="sr-only">Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="bg-charcoal border-gold/20 w-[300px]"
            >
              <SheetHeader>
                <SheetTitle className="text-gold font-heading text-2xl">
                  OgouTél Prestige
                </SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-1 mt-8">
                {navLinks.map((link) => (
                  <SheetClose asChild key={link.href}>
                    <a
                      href={link.href}
                      onClick={(e) => handleNavClick(e, link.href)}
                      className="text-white/80 hover:text-gold text-lg font-medium py-3 px-2 rounded-md hover:bg-white/5 transition-colors"
                    >
                      {link.label}
                    </a>
                  </SheetClose>
                ))}
                <div className="mt-4 px-2">
                  <SheetClose asChild>
                    <Button
                      onClick={onBookingClick}
                      className="w-full bg-gold text-charcoal hover:bg-gold-dark font-semibold tracking-wide rounded-full"
                    >
                      Réserver
                    </Button>
                  </SheetClose>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
}
