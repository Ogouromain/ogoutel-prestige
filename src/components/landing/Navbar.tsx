'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Hotel, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'

const NAV_LINKS = [
  { label: 'Fonctionnalités', href: '#fonctionnalites' },
  { label: 'Tarifs', href: '#tarifs' },
  { label: 'Témoignages', href: '#temoignages' },
  { label: 'Contact', href: '#contact' },
]

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollTo = (href: string) => {
    setOpen(false)
    const el = document.querySelector(href)
    el?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <header
      className={`no-print fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white shadow-md' : 'bg-white/80 backdrop-blur-md'
      }`}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Hotel className="h-7 w-7 text-gold" />
          <span className="text-xl font-bold text-elegant-black">
            OGOUTEL<span className="text-gold">_Prestige</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <button
              key={link.href}
              onClick={() => scrollTo(link.href)}
              className="text-sm font-medium text-gray-700 hover:text-gold transition-colors"
            >
              {link.label}
            </button>
          ))}
          <Link href="/login">
            <Button
              variant="outline"
              className="border-gold text-gold hover:bg-gold hover:text-black rounded-lg"
            >
              Se connecter
            </Button>
          </Link>
          <Button
            onClick={() => scrollTo('#contact')}
            className="bg-gold text-black hover:bg-gold-dark rounded-lg font-semibold"
          >
            Commencer
          </Button>
        </div>

        {/* Mobile */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72">
            <SheetTitle className="sr-only">Menu de navigation</SheetTitle>
            <div className="flex flex-col gap-6 mt-8">
              {NAV_LINKS.map((link) => (
                <button
                  key={link.href}
                  onClick={() => scrollTo(link.href)}
                  className="text-lg font-medium text-gray-700 hover:text-gold transition-colors text-left"
                >
                  {link.label}
                </button>
              ))}
              <Link href="/login" className="mt-4">
                <Button
                  variant="outline"
                  className="w-full border-gold text-gold hover:bg-gold hover:text-black rounded-lg"
                >
                  Se connecter
                </Button>
              </Link>
              <Button
                onClick={() => scrollTo('#contact')}
                className="w-full bg-gold text-black hover:bg-gold-dark rounded-lg font-semibold"
              >
                Commencer
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </nav>
    </header>
  )
}
