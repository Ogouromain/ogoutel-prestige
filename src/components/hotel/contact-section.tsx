'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  MessageSquare,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';

const contactSchema = z.object({
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  email: z.string().email('Veuillez entrer une adresse email valide'),
  phone: z.string().min(8, 'Veuillez entrer un numéro de téléphone valide'),
  subject: z.string().min(1, 'Veuillez sélectionner un sujet'),
  message: z.string().min(10, 'Le message doit contenir au moins 10 caractères'),
});

type ContactFormValues = z.infer<typeof contactSchema>;

const subjectOptions = [
  { value: 'reservation', label: 'Réservation' },
  { value: 'information', label: 'Demande d\'information' },
  { value: 'evenement', label: 'Événement privé' },
  { value: 'partenariat', label: 'Partenariat' },
  { value: 'reclamation', label: 'Réclamation' },
  { value: 'autre', label: 'Autre' },
];

const contactInfo = [
  {
    icon: Mail,
    label: 'Email',
    value: 'omouitsi@gmail.com',
    href: 'mailto:omouitsi@gmail.com',
  },
  {
    icon: Phone,
    label: 'WhatsApp',
    value: '+225 0576103277',
    href: 'https://wa.me/2250576103277',
  },
  {
    icon: MapPin,
    label: 'Adresse',
    value: 'Cocody Riviera, Abidjan, Côte d\'Ivoire',
    href: null,
  },
  {
    icon: Clock,
    label: 'Réception',
    value: '24h/24, 7j/7',
    href: null,
  },
];

export function ContactSection() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      subject: '',
      message: '',
    },
  });

  async function onSubmit(data: ContactFormValues) {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        toast({
          title: 'Message envoyé !',
          description:
            'Merci pour votre message. Notre équipe vous répondra dans les plus brefs délais.',
        });
        form.reset();
      } else {
        throw new Error('Erreur lors de l\'envoi');
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

  return (
    <section id="contact" className="py-20 lg:py-28 bg-background">
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
            Restons en contact
          </p>
          <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Contactez-nous
          </h2>
          <div className="w-20 h-0.5 bg-gold mx-auto mb-6" />
          <p className="text-muted-foreground max-w-2xl mx-auto text-base">
            Notre équipe est à votre écoute pour répondre à toutes vos
            questions et vous accompagner dans l&apos;organisation de votre
            séjour.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 lg:gap-16">
          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-3"
          >
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nom complet</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Votre nom"
                            {...field}
                            className="h-11"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="votre@email.com"
                            {...field}
                            className="h-11"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Téléphone</FormLabel>
                        <FormControl>
                          <Input
                            type="tel"
                            placeholder="+225 XX XX XX XX"
                            {...field}
                            className="h-11"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="subject"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sujet</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="h-11 w-full">
                              <SelectValue placeholder="Sélectionnez un sujet" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {subjectOptions.map((option) => (
                              <SelectItem
                                key={option.value}
                                value={option.value}
                              >
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Message</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Écrivez votre message ici..."
                          className="min-h-[140px] resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-gold text-charcoal hover:bg-gold-dark font-semibold tracking-wide rounded-full px-8 h-12"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-charcoal/30 border-t-charcoal" />
                      Envoi en cours...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Send className="h-4 w-4" />
                      Envoyer le message
                    </div>
                  )}
                </Button>
              </form>
            </Form>
          </motion.div>

          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-2"
          >
            <div className="space-y-6">
              {contactInfo.map((info) => (
                <Card
                  key={info.label}
                  className="border-border/50 hover:border-gold/30 transition-colors bg-card"
                >
                  <CardContent className="p-5 flex items-start gap-4">
                    <div className="w-11 h-11 rounded-full bg-gold/10 flex items-center justify-center shrink-0">
                      <info.icon className="h-5 w-5 text-gold" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">
                        {info.label}
                      </p>
                      {info.href ? (
                        <a
                          href={info.href}
                          target={
                            info.href.startsWith('http')
                              ? '_blank'
                              : undefined
                          }
                          rel={
                            info.href.startsWith('http')
                              ? 'noopener noreferrer'
                              : undefined
                          }
                          className="text-foreground font-medium hover:text-gold transition-colors"
                        >
                          {info.value}
                        </a>
                      ) : (
                        <p className="text-foreground font-medium">
                          {info.value}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Decorative Map Placeholder */}
              <Card className="border-border/50 overflow-hidden bg-card">
                <div className="relative h-48 bg-gradient-to-br from-charcoal to-[#2A2520] flex items-center justify-center">
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-4 left-4 w-16 h-16 border border-gold rounded-full" />
                    <div className="absolute top-8 left-8 w-24 h-24 border border-gold rounded-full" />
                    <div className="absolute top-12 left-12 w-32 h-32 border border-gold rounded-full" />
                  </div>
                  <div className="relative text-center">
                    <MapPin className="h-8 w-8 text-gold mx-auto mb-2" />
                    <p className="text-white/80 text-sm font-medium">
                      Cocody Riviera
                    </p>
                    <p className="text-white/50 text-xs">Abidjan, Côte d&apos;Ivoire</p>
                  </div>
                </div>
              </Card>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
