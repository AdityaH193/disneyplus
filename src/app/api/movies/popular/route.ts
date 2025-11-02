import { NextRequest, NextResponse } from 'next/server'
import { TMDBClient } from '@/lib/tmdb/client'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')

    const results = await TMDBClient.getPopularMovies(page)

    return NextResponse.json({
      success: true,
      data: results
    })
  } catch (error) {
    console.error('Popular movies API error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch popular movies' },
      { status: 500 }
    )
  }
}