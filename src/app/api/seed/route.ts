import { NextResponse } from 'next/server'
import { seedDemoData } from '@/lib/seed'

export async function POST() {
  try {
    const result = await seedDemoData()
    
    if (result.success) {
      return NextResponse.json({ message: 'Demo data seeded successfully!' })
    } else {
      return NextResponse.json(
        { error: 'Failed to seed demo data', details: result.error },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Seed API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}