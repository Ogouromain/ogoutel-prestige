import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

const imagesDir = path.join(process.cwd(), 'public/hotel');

async function seed() {
  console.log('🌱 Seeding database...');

  // Clear existing data
  await prisma.booking.deleteMany();
  await prisma.testimonial.deleteMany();
  await prisma.room.deleteMany();

  // Create rooms
  const rooms = await prisma.room.createMany({
    data: [
      {
        name: 'Chambre Standard',
        description: 'Une chambre confortable et élégante avec tous les équipements modernes pour un séjour agréable. Idéale pour les voyageurs d\'affaires et les couples.',
        price: 35000,
        maxGuests: 2,
        bedType: 'Lit double',
        size: 28,
        image: '/hotel/room-standard.png',
        features: JSON.stringify(['Wi-Fi gratuit', 'Climatisation', 'TV écran plat', 'Minibar', 'Coffre-fort', 'Salle de bain privée']),
        available: true,
        category: 'standard',
      },
      {
        name: 'Chambre Deluxe',
        description: 'Un espace spacieux et raffiné offrant une vue imprenable. Parfaite pour ceux qui recherchent le confort et l\'élégance au cœur de l\'hôtellerie de prestige.',
        price: 55000,
        maxGuests: 3,
        bedType: 'Lit King Size',
        size: 42,
        image: '/hotel/room-deluxe.png',
        features: JSON.stringify(['Wi-Fi gratuit', 'Climatisation', 'TV 55 pouces', 'Minibar premium', 'Coffre-fort', 'Salle de bain luxueuse', 'Balcon', 'Room service 24h']),
        available: true,
        category: 'deluxe',
      },
      {
        name: 'Suite Présidentielle',
        description: 'L\'ultime expérience de luxe. Une suite spacieuse avec salon séparé, vue panoramique et un service attentionné pour un séjour inoubliable.',
        price: 120000,
        maxGuests: 4,
        bedType: 'Lit King Size + Canapé-lit',
        size: 75,
        image: '/hotel/room-suite.png',
        features: JSON.stringify(['Wi-Fi gratuit', 'Climatisation', 'TV 65 pouces', 'Minibar premium', 'Coffre-fort', 'Salle de bain marbre', 'Terrasse panoramique', 'Room service 24h', 'Accès spa gratuit', 'Transfert aéroport']),
        available: true,
        category: 'suite',
      },
    ],
  });
  console.log(`✅ Created ${rooms.count} rooms`);

  // Create testimonials
  const testimonials = await prisma.testimonial.createMany({
    data: [
      {
        name: 'Amadou Koné',
        location: 'Abidjan, Côte d\'Ivoire',
        rating: 5,
        comment: 'Un séjour exceptionnel ! L\'accueil était chaleureux, la chambre magnifique et le service impeccable. Je recommande vivement OgouTél Prestige pour tout séjour à Abidjan.',
      },
      {
        name: 'Marie Dupont',
        location: 'Paris, France',
        rating: 5,
        comment: 'Hôtel magnifique avec une vue imprenable. Le personnel est très professionnel et attentionné. La suite présidentielle est tout simplement somptueuse. Au top !',
      },
      {
        name: 'Kwame Asante',
        location: 'Accra, Ghana',
        rating: 4,
        comment: 'Très bel établissement, propre et bien entretenu. Le restaurant propose une cuisine délicieuse. Le seul petit bémol est le temps d\'attente au check-in lors des heures de pointe.',
      },
      {
        name: 'Fatou Diallo',
        location: 'Dakar, Sénégal',
        rating: 5,
        comment: 'C\'est devenu mon adresse préférée à Abidjan. Le rapport qualité-prix est excellent, le spa est divin et les chambres sont très confortables. Merci pour ce merveilleux séjour !',
      },
    ],
  });
  console.log(`✅ Created ${testimonials.count} testimonials`);

  console.log('🎉 Seeding completed!');
}

seed()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
