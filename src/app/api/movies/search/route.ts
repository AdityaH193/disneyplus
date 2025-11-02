import { NextRequest, NextResponse } from 'next/server'
import { TMDBClient } from '@/lib/tmdb/client'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('query')
    const genre = searchParams.get('genre')
    const year = searchParams.get('year')
    const rating = searchParams.get('rating')
    const sortBy = searchParams.get('sortBy') || 'popularity'
    const page = parseInt(searchParams.get('page') || '1')

    if (!query) {
      return NextResponse.json(
        { success: false, error: 'Query parameter is required' },
        { status: 400 }
      )
    }

    const filters = {
      genre: genre ? parseInt(genre) : undefined,
      year: year ? parseInt(year) : undefined,
      rating: rating ? parseFloat(rating) : undefined,
      sortBy: sortBy as any,
    }

    const results = await TMDBClient.searchMovies(query, filters, page)

    return NextResponse.json({
      success: true,
      data: results
    })
  } catch (error) {
    console.error('Search API error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to search movies' },
      { status: 500 }
    )
  }
}