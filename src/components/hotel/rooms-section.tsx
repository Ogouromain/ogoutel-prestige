'use client';

import { motion } from 'framer-motion';
import { BedDouble, Maximize2, Star, Wifi, Coffee, Tv, Wind } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface Room {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  bedType: string;
  size: string;
  features: string[];
}

const featureIcons: Record<string, React.ReactNode> = {
  'WiFi gratuit': <Wifi className="h-3.5 w-3.5" />,
  'Climatisation': <Wind className="h-3.5 w-3.5" />,
  'Minibar': <Coffee className="h-3.5 w-3.5" />,
  'TV écran plat': <Tv className="h-3.5 w-3.5" />,
};

interface RoomsSectionProps {
  rooms: Room[];
  onBookRoom?: (room: Room) => void;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
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

export function RoomsSection({ rooms, onBookRoom }: RoomsSectionProps) {
  return (
    <section id="chambres" className="py-20 lg:py-28 bg-background">
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
            Nos hébergements
          </p>
          <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Nos Chambres
          </h2>
          <div className="w-20 h-0.5 bg-gold mx-auto mb-6" />
          <p className="text-muted-foreground max-w-2xl mx-auto text-base">
            Chaque chambre est un havre de paix, conçu avec soin pour vous offrir
            un séjour d&apos;exception alliant confort moderne et élégance
            africaine.
          </p>
        </motion.div>

        {/* Rooms Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {rooms.map((room) => (
            <motion.div key={room.id} variants={itemVariants}>
              <Card className="group overflow-hidden border-border/50 hover:border-gold/30 transition-all duration-500 hover:shadow-xl hover:shadow-gold/5 hover:-translate-y-1 bg-card">
                {/* Room Image */}
                <div className="relative h-64 overflow-hidden">
                  <img
                    src={room.image}
                    alt={room.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <Badge className="absolute top-4 right-4 bg-gold/90 text-charcoal hover:bg-gold font-semibold">
                    {room.price.toLocaleString('fr-FR')} FCFA / nuit
                  </Badge>
                </div>

                <CardContent className="p-6">
                  {/* Room Name */}
                  <h3 className="font-heading text-xl font-bold text-foreground mb-2">
                    {room.name}
                  </h3>
                  <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                    {room.description}
                  </p>

                  {/* Room Details */}
                  <div className="flex items-center gap-4 mb-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <BedDouble className="h-4 w-4 text-gold" />
                      <span>{room.bedType}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Maximize2 className="h-4 w-4 text-gold" />
                      <span>{room.size}</span>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="flex flex-wrap gap-2 mb-6">
                    {room.features.map((feature) => (
                      <div
                        key={feature}
                        className="flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary/50 rounded-full px-3 py-1"
                      >
                        {featureIcons[feature] || (
                          <Star className="h-3 w-3 text-gold" />
                        )}
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* Book Button */}
                  <Button
                    onClick={() => onBookRoom?.(room)}
                    className="w-full bg-gold text-charcoal hover:bg-gold-dark font-semibold tracking-wide rounded-full h-11 transition-colors"
                  >
                    Réserver
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
