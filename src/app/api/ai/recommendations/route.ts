import { NextRequest, NextResponse } from 'next/server'
import { RecommendationEngine } from '@/lib/ai/recommendationEngine'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { mood, preferences, limit = 20 } = body

    if (!mood) {
      return NextResponse.json(
        { success: false, error: 'Mood is required' },
        { status: 400 }
      )
    }

    const recommendations = await RecommendationEngine.generateMoodRecommendations(
      mood,
      preferences || null,
      limit
    )

    return NextResponse.json({
      success: true,
      data: recommendations
    })
  } catch (error) {
    console.error('Recommendations API error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate recommendations' },
      { status: 500 }
    )
  }
}