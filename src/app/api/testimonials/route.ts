import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'
import { checkRateLimit, getClientIp, RATE_LIMIT_PUBLIC_READ } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

// GET /api/testimonials - Fetch approved testimonials
export async function GET(request: NextRequest) {
  try {
    // ── Rate Limiting ──
    const clientIp = getClientIp(request)
    const rateLimit = checkRateLimit(clientIp, RATE_LIMIT_PUBLIC_READ)
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
