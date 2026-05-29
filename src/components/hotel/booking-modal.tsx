'use client';

import { useState, useMemo } from 'react';
import { CalendarDays, Users, Minus, Plus } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { format, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import type { Room } from './rooms-section';

const bookingSchema = z
  .object({
    name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
    email: z.string().email('Veuillez entrer une adresse email valide'),
    phone: z.string().min(8, 'Veuillez entrer un numéro de téléphone valide'),
    checkIn: z.date({ required_error: 'Veuillez sélectionner une date d\'arrivée' }),
    checkOut: z.date({ required_error: 'Veuillez sélectionner une date de départ' }),
    adults: z.number().min(1, 'Au moins 1 adulte').max(4, 'Maximum 4 adultes'),
    children: z.number().min(0).max(3, 'Maximum 3 enfants'),
    specialRequests: z.string().optional(),
  })
  .refine((data) => data.checkOut > data.checkIn, {
    message: 'La date de départ doit être après la date d\'arrivée',
    path: ['checkOut'],
  });

type BookingFormValues = z.infer<typeof bookingSchema>;

interface BookingModalProps {
  room: Room | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BookingModal({ room, open, onOpenChange }: BookingModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const { toast } = useToast();

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      adults: 1,
      children: 0,
      specialRequests: '',
    },
  });

  const watchCheckIn = form.watch('checkIn');
  const watchCheckOut = form.watch('checkOut');
  const watchAdults = form.watch('adults');
  const watchChildren = form.watch('children');

  const nights = useMemo(() => {
    if (watchCheckIn && watchCheckOut && watchCheckOut > watchCheckIn) {
      return differenceInDays(watchCheckOut, watchCheckIn);
    }
    return 0;
  }, [watchCheckIn, watchCheckOut]);

  const totalPrice = useMemo(() => {
    if (!room) return 0;
    return nights * room.price;
  }, [nights, room]);

  async function onSubmit(data: BookingFormValues) {
    if (!room) return;
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: room.id,
          guestName: data.name,
          guestEmail: data.email,
          guestPhone: data.phone,
          checkIn: data.checkIn.toISOString(),
          checkOut: data.checkOut.toISOString(),
          adults: data.adults,
          children: data.children,
          specialRequests: data.specialRequests || undefined,
        }),
      });

      if (res.ok) {
        setSuccess(true);
        toast({
          title: 'Réservation envoyée !',
          description: `Votre demande de réservation pour ${room.name} a été enregistrée.`,
        });
      } else {
        throw new Error('Erreur lors de la réservation');
      }
    } catch {
      toast({
        title: 'Erreur',
        description:
          'Une erreur est survenue. Veuillez réessayer ou nous contacter directement.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleClose = () => {
    setSuccess(false);
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto">
        {success ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-4">
              <CalendarDays className="h-8 w-8 text-gold" />
            </div>
            <h3 className="font-heading text-2xl font-bold text-foreground mb-2">
              Demande envoyée !
            </h3>
            <p className="text-muted-foreground mb-6">
              Votre demande de réservation a bien été enregistrée. Notre équipe
              vous confirmera la disponibilité par email dans les plus brefs
              délais.
            </p>
            <Button onClick={handleClose} className="bg-gold text-charcoal hover:bg-gold-dark rounded-full px-8">
              Fermer
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="font-heading text-xl font-bold text-foreground">
                Réserver — {room?.name}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                {room?.price.toLocaleString('fr-FR')} FCFA / nuit
                {nights > 0 && (
                  <span className="block mt-1 text-gold font-semibold">
                    {nights} nuit{nights > 1 ? 's' : ''} —{' '}
                    {totalPrice.toLocaleString('fr-FR')} FCFA
                  </span>
                )}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Name & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="booking-name">Nom complet</Label>
                  <Input
                    id="booking-name"
                    placeholder="Votre nom"
                    {...form.register('name')}
                    className="h-10"
                  />
                  {form.formState.errors.name && (
                    <p className="text-destructive text-xs">
                      {form.formState.errors.name.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="booking-email">Email</Label>
                  <Input
                    id="booking-email"
                    type="email"
                    placeholder="votre@email.com"
                    {...form.register('email')}
                    className="h-10"
                  />
                  {form.formState.errors.email && (
                    <p className="text-destructive text-xs">
                      {form.formState.errors.email.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="booking-phone">Téléphone</Label>
                <Input
                  id="booking-phone"
                  type="tel"
                  placeholder="+225 XX XX XX XX"
                  {...form.register('phone')}
                  className="h-10"
                />
                {form.formState.errors.phone && (
                  <p className="text-destructive text-xs">
                    {form.formState.errors.phone.message}
                  </p>
                )}
              </div>

              {/* Check-in & Check-out */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date d&apos;arrivée</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full h-10 justify-start text-left font-normal"
                      >
                        <CalendarDays className="mr-2 h-4 w-4 text-gold" />
                        {watchCheckIn
                          ? format(watchCheckIn, 'dd MMM yyyy', { locale: fr })
                          : 'Sélectionner'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={watchCheckIn}
                        onSelect={(date) =>
                          form.setValue('checkIn', date ?? new Date())
                        }
                        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                        locale={fr}
                      />
                    </PopoverContent>
                  </Popover>
                  {form.formState.errors.checkIn && (
                    <p className="text-destructive text-xs">
                      {form.formState.errors.checkIn.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Date de départ</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full h-10 justify-start text-left font-normal"
                      >
                        <CalendarDays className="mr-2 h-4 w-4 text-gold" />
                        {watchCheckOut
                          ? format(watchCheckOut, 'dd MMM yyyy', { locale: fr })
                          : 'Sélectionner'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={watchCheckOut}
                        onSelect={(date) =>
                          form.setValue('checkOut', date ?? new Date())
                        }
                        disabled={(date) =>
                          date < (watchCheckIn || new Date(new Date().setHours(0, 0, 0, 0)))
                        }
                        locale={fr}
                      />
                    </PopoverContent>
                  </Popover>
                  {form.formState.errors.checkOut && (
                    <p className="text-destructive text-xs">
                      {form.formState.errors.checkOut.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Adults & Children */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Adultes</Label>
                  <div className="flex items-center gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-10 w-10"
                      onClick={() =>
                        form.setValue(
                          'adults',
                          Math.max(1, (watchAdults || 1) - 1)
                        )
                      }
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="flex-1 text-center font-medium">
                      {watchAdults || 1}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-10 w-10"
                      onClick={() =>
                        form.setValue(
                          'adults',
                          Math.min(4, (watchAdults || 1) + 1)
                        )
                      }
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Enfants</Label>
                  <div className="flex items-center gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-10 w-10"
                      onClick={() =>
                        form.setValue(
                          'children',
                          Math.max(0, (watchChildren || 0) - 1)
                        )
                      }
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="flex-1 text-center font-medium">
                      {watchChildren || 0}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-10 w-10"
                      onClick={() =>
                        form.setValue(
                          'children',
                          Math.min(3, (watchChildren || 0) + 1)
                        )
                      }
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Special Requests */}
              <div className="space-y-2">
                <Label htmlFor="booking-requests">Demandes spéciales</Label>
                <Textarea
                  id="booking-requests"
                  placeholder="Allergies, préférences de chambre, occasions spéciales..."
                  className="min-h-[80px] resize-none"
                  {...form.register('specialRequests')}
                />
              </div>

              {/* Total Price Display */}
              {nights > 0 && room && (
                <div className="bg-secondary/50 rounded-lg p-4 text-center">
                  <p className="text-sm text-muted-foreground mb-1">
                    Total estimé pour {nights} nuit{nights > 1 ? 's' : ''}
                  </p>
                  <p className="font-heading text-2xl font-bold text-gold">
                    {totalPrice.toLocaleString('fr-FR')} FCFA
                  </p>
                </div>
              )}

              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  className="rounded-full"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-gold text-charcoal hover:bg-gold-dark font-semibold tracking-wide rounded-full"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-charcoal/30 border-t-charcoal" />
                      Envoi...
                    </div>
                  ) : (
                    'Confirmer la réservation'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
