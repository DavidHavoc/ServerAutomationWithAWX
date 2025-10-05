import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hash } from 'bcryptjs'

export async function GET() {
  try {
    const servers = await db.server.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(servers)
  } catch (error) {
    console.error('Failed to fetch servers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch servers' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, hostname, port, username, description, authType, password, privateKey } = body

    if (!name || !hostname || !username) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // For demo purposes, we'll use a hardcoded user ID
    // In a real app, this would come from authentication
    const userId = 'demo-user-id'

    const server = await db.server.create({
      data: {
        name,
        hostname,
        port: parseInt(port) || 22,
        username,
        description,
        authType,
        password: authType === 'PASSWORD' ? await hash(password, 10) : null,
        privateKey: authType === 'PRIVATE_KEY' ? privateKey : null,
        addedBy: userId
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    // Log the activity
    await db.activityLog.create({
      data: {
        action: 'CREATE_SERVER',
        details: `Created server "${name}" at ${hostname}:${port}`,
        userId
      }
    })

    return NextResponse.json(server, { status: 201 })
  } catch (error) {
    console.error('Failed to create server:', error)
    return NextResponse.json(
      { error: 'Failed to create server' },
      { status: 500 }
    )
  }
}