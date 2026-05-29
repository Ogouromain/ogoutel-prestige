import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

export const dynamic = 'force-dynamic'

// GET /api/testimonials - Fetch approved testimonials
export async function GET(request: NextRequest) {
  try {
    const testimonials = await db.testimonial.findMany({
      where: {
        approved: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(testimonials)
  } catch (error) {
    console.error('Error fetching testimonials:', error)

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return NextResponse.json(
        {
          error:
            'Database error occurred while fetching testimonials',
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to fetch testimonials' },
      { status: 500 }
    )
  }
}
