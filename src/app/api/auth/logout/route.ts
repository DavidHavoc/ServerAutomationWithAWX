import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { db } from '@/lib/db'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key-change-in-production')

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value

    if (token) {
      try {
        const { payload } = await jwtVerify(token, JWT_SECRET)
        const userId = payload.userId as string

        // Log the activity
        await db.activityLog.create({
          data: {
            action: 'LOGOUT',
            details: `User logged out`,
            ipAddress: request.ip || 'unknown',
            userAgent: request.headers.get('user-agent') || 'unknown',
            userId
          }
        })
      } catch (error) {
        // Token is invalid, but we still want to clear the cookie
        console.error('Token verification error:', error)
      }
    }

    // Clear the auth cookie
    const response = NextResponse.json({ message: 'Logged out successfully' })
    response.cookies.delete('auth-token')

    return response
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}