import { NextRequest, NextResponse } from 'next/server'
import { MoodDetector } from '@/lib/ai/moodDetector'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { text } = body

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Text input is required' },
        { status: 400 }
      )
    }

    const analysis = await MoodDetector.analyzeTextMood(text)

    return NextResponse.json({
      success: true,
      data: analysis
    })
  } catch (error) {
    console.error('Mood analysis API error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to analyze mood' },
      { status: 500 }
    )
  }
}