'use client';

import { useState } from 'react';
import { Navbar } from '@/components/hotel/navbar';
import { HeroSection } from '@/components/hotel/hero-section';
import { RoomsSection, type Room } from '@/components/hotel/rooms-section';
import { AmenitiesSection } from '@/components/hotel/amenities-section';
import { TestimonialsSection, type Testimonial } from '@/components/hotel/testimonials-section';
import { ContactSection } from '@/components/hotel/contact-section';
import { BookingModal } from '@/components/hotel/booking-modal';
import { Footer } from '@/components/hotel/footer';

const rooms: Room[] = [
  {
    id: '1',
    name: 'Chambre Standard',
    description:
      'Un espace élégant et confortable, parfait pour les voyageurs exigeants. Décoration raffinée avec des touches africaines contemporaines.',
    price: 25000,
    image: '/hotel/room-standard.png',
    bedType: 'Lit double',
    size: '25 m²',
    features: ['WiFi gratuit', 'Climatisation', 'TV écran plat', 'Minibar'],
  },
  {
    id: '2',
    name: 'Chambre Deluxe',
    description:
      'Un havre de paix spacieux avec vue sur la ville. Prestations haut de gamme et attention particulière aux détails pour un séjour mémorable.',
    price: 45000,
    image: '/hotel/room-deluxe.png',
    bedType: 'Lit king size',
    size: '35 m²',
    features: ['WiFi gratuit', 'Climatisation', 'TV écran plat', 'Minibar'],
  },
  {
    id: '3',
    name: 'Suite Prestige',
    description:
      'L\'ultime expérience de luxe avec un salon séparé, terrasse privée et service de butler dédié. Le summum du raffinement abidjanais.',
    price: 85000,
    image: '/hotel/room-suite.png',
    bedType: 'Lit king size',
    size: '55 m²',
    features: ['WiFi gratuit', 'Climatisation', 'TV écran plat', 'Minibar'],
  },
];

const testimonials: Testimonial[] = [
  {
    id: '1',
    name: 'Aminata Diallo',
    location: 'Dakar, Sénégal',
    rating: 5,
    text: 'Un séjour absolument exceptionnel ! L\'accueil chaleureux, les chambres luxueuses et le restaurant gastronomique ont dépassé toutes mes attentes. Je recommande vivement OgouTél Prestige.',
    date: '2025-01-15',
  },
  {
    id: '2',
    name: 'Jean-Pierre Kouamé',
    location: 'Paris, France',
    rating: 5,
    text: 'À chaque visite à Abidjan, je choisis OgouTél Prestige. Le service est irréprochable, le spa est paradisiaque et la piscine à débordement offre une vue imprenable. Un vrai bijou.',
    date: '2025-02-20',
  },
  {
    id: '3',
    name: 'Fatou Bamba',
    location: 'Lomé, Togo',
    rating: 4,
    text: 'Le cadre est magnifique et le personnel extrêmement professionnel. La suite prestige est d\'une élégance rare. Un établissement qui honore la capitale ivoirienne.',
    date: '2025-03-10',
  },
  {
    id: '4',
    name: 'Olivier Chen',
    location: 'Shanghai, Chine',
    rating: 5,
    text: 'J\'ai voyagé dans le monde entier et OgouTél Prestige figure parmi mes meilleurs souvenirs hôteliers. La fusion entre luxe international et culture locale est parfaite.',
    date: '2025-04-05',
  },
];

export default function Home() {
  const [bookingRoom, setBookingRoom] = useState<Room | null>(null);
  const [bookingOpen, setBookingOpen] = useState(false);

  const handleBookingClick = () => {
    setBookingRoom(rooms[0]);
    setBookingOpen(true);
  };

  const handleBookRoom = (room: Room) => {
    setBookingRoom(room);
    setBookingOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar onBookingClick={handleBookingClick} />
      <main className="flex-1">
        <HeroSection onBookingClick={handleBookingClick} />
        <RoomsSection rooms={rooms} onBookRoom={handleBookRoom} />
        <AmenitiesSection />
        <TestimonialsSection testimonials={testimonials} />
        <ContactSection />
      </main>
      <Footer />

      <BookingModal
        room={bookingRoom}
        open={bookingOpen}
        onOpenChange={setBookingOpen}
      />
    </div>
  );
}
