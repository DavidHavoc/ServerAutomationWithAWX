import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hash } from 'bcryptjs'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { name, hostname, port, username, description, authType, password, privateKey } = body

    const server = await db.server.findUnique({
      where: { id: params.id }
    })

    if (!server) {
      return NextResponse.json(
        { error: 'Server not found' },
        { status: 404 }
      )
    }

    const updateData: any = {
      name,
      hostname,
      port: parseInt(port) || 22,
      username,
      description,
      authType
    }

    // Only update password/private key if provided
    if (password && authType === 'PASSWORD') {
      updateData.password = await hash(password, 10)
    }
    if (privateKey && authType === 'PRIVATE_KEY') {
      updateData.privateKey = privateKey
    }

    const updatedServer = await db.server.update({
      where: { id: params.id },
      data: updateData,
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
        action: 'UPDATE_SERVER',
        details: `Updated server "${name}" at ${hostname}:${port}`,
        userId: server.addedBy
      }
    })

    return NextResponse.json(updatedServer)
  } catch (error) {
    console.error('Failed to update server:', error)
    return NextResponse.json(
      { error: 'Failed to update server' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const server = await db.server.findUnique({
      where: { id: params.id }
    })

    if (!server) {
      return NextResponse.json(
        { error: 'Server not found' },
        { status: 404 }
      )
    }

    await db.server.delete({
      where: { id: params.id }
    })

    // Log the activity
    await db.activityLog.create({
      data: {
        action: 'DELETE_SERVER',
        details: `Deleted server "${server.name}" at ${server.hostname}:${server.port}`,
        userId: server.addedBy
      }
    })

    return NextResponse.json({ message: 'Server deleted successfully' })
  } catch (error) {
    console.error('Failed to delete server:', error)
    return NextResponse.json(
      { error: 'Failed to delete server' },
      { status: 500 }
    )
  }
}