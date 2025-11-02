import { NextRequest, NextResponse } from 'next/server'
import { TMDBClient } from '@/lib/tmdb/client'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const movieId = parseInt(params.id)

    if (isNaN(movieId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid movie ID' },
        { status: 400 }
      )
    }

    const movieDetails = await TMDBClient.getMovieDetails(movieId)

    return NextResponse.json({
      success: true,
      data: movieDetails
    })
  } catch (error) {
    console.error('Movie details API error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch movie details' },
      { status: 500 }
    )
  }
}