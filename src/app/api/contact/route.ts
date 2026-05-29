import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'
import { Prisma } from '@prisma/client'

const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please provide a valid email address'),
  phone: z
    .string()
    .min(8, 'Phone number must be at least 8 characters')
    .optional()
    .or(z.literal('')),
  subject: z.string().min(1, 'Subject is required'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const result = contactSchema.safeParse(body)
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

    // Save contact message to database
    await db.contactMessage.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone && data.phone.length > 0 ? data.phone : null,
        subject: data.subject,
        message: data.message,
      },
    })

    return NextResponse.json(
      {
        message:
          'Thank you for your message. We will get back to you shortly.',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error submitting contact form:', error)

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return NextResponse.json(
        {
          error:
            'Database error occurred while saving your message',
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to submit contact form' },
      { status: 500 }
    )
  }
}
