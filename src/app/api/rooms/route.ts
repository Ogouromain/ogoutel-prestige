import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

export const dynamic = 'force-dynamic'

// GET /api/rooms - Fetch all available rooms with booking counts
export async function GET(request: NextRequest) {
  try {
    const rooms = await db.room.findMany({
      where: {
        available: true,
      },
      orderBy: {
        price: 'asc',
      },
      include: {
        _count: {
          select: {
            bookings: true,
          },
        },
      },
    })

    // Transform features from JSON string to array
    const transformedRooms = rooms.map((room) => ({
      ...room,
      features: JSON.parse(room.features),
      bookingCount: room._count.bookings,
    }))

    return NextResponse.json(transformedRooms)
  } catch (error) {
    console.error('Error fetching rooms:', error)

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return NextResponse.json(
        { error: 'Database error occurred while fetching rooms' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to fetch rooms' },
      { status: 500 }
    )
  }
}
