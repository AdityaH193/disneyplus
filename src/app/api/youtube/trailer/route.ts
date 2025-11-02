import { NextRequest, NextResponse } from 'next/server'
import { YouTubeClient } from '@/lib/youtube/client'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const movieTitle = searchParams.get('title')
    const year = searchParams.get('year')

    if (!movieTitle) {
      return NextResponse.json(
        { success: false, error: 'Movie title is required' },
        { status: 400 }
      )
    }

    const trailer = await YouTubeClient.searchTrailer(movieTitle, year || undefined)

    return NextResponse.json({
      success: true,
      data: trailer
    })
  } catch (error) {
    console.error('YouTube trailer API error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch trailer' },
      { status: 500 }
    )
  }
}