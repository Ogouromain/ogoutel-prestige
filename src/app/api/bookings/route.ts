import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'
import { Prisma } from '@prisma/client'
import { checkRateLimit, getClientIp, RATE_LIMIT_BOOKING } from '@/lib/rate-limit'

const bookingSchema = z.object({
  roomId: z.string().min(1, 'Room ID is required'),
  guestName: z.string().min(2, 'Guest name must be at least 2 characters'),
  guestEmail: z.string().email('Please provide a valid email address'),
  guestPhone: z.string().min(8, 'Phone number must be at least 8 characters'),
  checkIn: z
    .string()
    .refine(
      (val) => {
        const date = new Date(val)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        return !isNaN(date.getTime()) && date >= today
      },
      { message: 'Check-in date must be today or a future date' }
    ),
  checkOut: z
    .string()
    .refine(
      (val) => {
        const date = new Date(val)
        return !isNaN(date.getTime())
      },
      { message: 'Please provide a valid check-out date' }
    ),
  adults: z
    .number()
    .int()
    .min(1, 'At least 1 adult is required')
    .max(10, 'Maximum 10 adults allowed'),
  children: z
    .number()
    .int()
    .min(0, 'Children count cannot be negative')
    .max(10, 'Maximum 10 children allowed')
    .default(0),
  specialRequests: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    // ── Rate Limiting ──
    const clientIp = getClientIp(request)
    const rateLimit = checkRateLimit(clientIp, RATE_LIMIT_BOOKING)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: 'Trop de requêtes. Veuillez réessayer dans quelques minutes.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((rateLimit.resetAt.getTime() - Date.now()) / 1000)),
            'X-RateLimit-Remaining': '0',
          },
        }
      )
    }

    const body = await request.json()

    // Validate input
    const result = bookingSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: result.error.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        },
        { status: 400 }
      )
    }

    const data = result.data

    // Validate checkOut is after checkIn
    const checkInDate = new Date(data.checkIn)
    const checkOutDate = new Date(data.checkOut)

    if (checkOutDate <= checkInDate) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: [
            {
              field: 'checkOut',
              message: 'Check-out date must be after check-in date',
            },
          ],
        },
        { status: 400 }
      )
    }

    // Check if room exists
    const room = await db.room.findUnique({
      where: { id: data.roomId },
    })

    if (!room) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      )
    }

    if (!room.available) {
      return NextResponse.json(
        { error: 'This room is currently unavailable for booking' },
        { status: 400 }
      )
    }

    // Check room availability - no overlapping confirmed bookings
    const overlappingBooking = await db.booking.findFirst({
      where: {
        roomId: data.roomId,
        status: 'confirmed',
        checkIn: { lt: checkOutDate },
        checkOut: { gt: checkInDate },
      },
    })

    if (overlappingBooking) {
      return NextResponse.json(
        {
          error: 'Room is not available for the selected dates',
          details:
            'There is already a confirmed booking that overlaps with your requested dates. Please choose different dates.',
        },
        { status: 409 }
      )
    }

    // Calculate number of nights and total price
    const timeDiff = checkOutDate.getTime() - checkInDate.getTime()
    const numberOfNights = Math.ceil(timeDiff / (1000 * 60 * 60 * 24))
    const totalPrice = room.price * numberOfNights

    // Create the booking
    const booking = await db.booking.create({
      data: {
        roomId: data.roomId,
        guestName: data.guestName,
        guestEmail: data.guestEmail,
        guestPhone: data.guestPhone,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        adults: data.adults,
        children: data.children,
        totalPrice,
        specialRequests: data.specialRequests ?? null,
      },
      include: {
        room: {
          select: {
            id: true,
            name: true,
            category: true,
            price: true,
          },
        },
      },
    })

    return NextResponse.json(
      {
        message: 'Booking created successfully',
        booking: {
          ...booking,
          numberOfNights,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating booking:', error)

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return NextResponse.json(
        { error: 'Database error occurred while creating booking' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create booking' },
      { status: 500 }
    )
  }
}
