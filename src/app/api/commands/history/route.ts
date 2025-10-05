import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const commandLogs = await db.commandLog.findMany({
      include: {
        server: {
          select: {
            name: true,
            hostname: true
          }
        },
        user: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        startTime: 'desc'
      },
      take: 50 // Limit to last 50 commands
    })

    return NextResponse.json(commandLogs)
  } catch (error) {
    console.error('Failed to fetch command history:', error)
    return NextResponse.json(
      { error: 'Failed to fetch command history' },
      { status: 500 }
    )
  }
}