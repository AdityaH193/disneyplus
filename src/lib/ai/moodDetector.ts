import { MoodCategory, MoodAnalysis, UserPreferences } from '@/types'
import { OpenAIClient } from './openaiClient'

export class MoodDetector {
  // Quick mood mappings for UI buttons
  private static readonly QUICK_MOODS: Record<MoodCategory, {
    label: string
    emoji: string
    description: string
    keywords: string[]
  }> = {
    happy: {
      label: 'Happy & Uplifted',
      emoji: '😊',
      description: 'Feel-good entertainment',
      keywords: ['comedy', 'adventure', 'feel-good', 'uplifting']
    },
    relaxed: {
      label: 'Relaxed & Calm',
      emoji: '😌',
      description: 'Peaceful and easy-watching content',
      keywords: ['calm', 'peaceful', 'easy', 'gentle', 'light']
    },
    excited: {
      label: 'Excited & Thrilled',
      emoji: '🤩',
      description: 'High-energy and thrilling content',
      keywords: ['action', 'thriller', 'adventure', 'exciting', 'intense']
    },
    romantic: {
      label: 'Romantic',
      emoji: '💕',
      description: 'Love stories and romantic content',
      keywords: ['romance', 'love', 'relationships', 'heartwarming']
    },
    thoughtful: {
      label: 'Thoughtful & Deep',
      emoji: '🤔',
      description: 'Meaningful and reflective content',
      keywords: ['drama', 'documentary', 'inspiring', 'deep', 'meaningful']
    },
    nostalgic: {
      label: 'Nostalgic',
      emoji: '📻',
      description: 'Classics and throwback favorites',
      keywords: ['classic', 'vintage', 'throwback', 'memories', 'childhood']
    }
  }

  // Analyze text-based mood description using AI
  static async analyzeTextMood(text: string): Promise<MoodAnalysis> {
    if (!text || text.trim().length === 0) {
      throw new Error('Mood description cannot be empty')
    }

    try {
      return await OpenAIClient.analyzeMood(text.trim())
    } catch (error) {
      console.error('Text mood analysis failed:', error)
      throw new Error('Failed to analyze mood. Please try again.')
    }
  }

  // Classify UI button selection to standardized mood
  static classifyUIMood(selection: MoodCategory): MoodAnalysis {
    const moodConfig = this.QUICK_MOODS[selection]
    if (!moodConfig) {
      throw new Error(`Invalid mood selection: ${selection}`)
    }

    return {
      primary_mood: selection,
      confidence: 0.9, // High confidence for direct user selection
      keywords: moodConfig.keywords,
      explanation: `Selected mood: ${moodConfig.label}`
    }
  }

  // Get quick mood configurations for UI
  static getQuickMoods(): Array<{
    mood: MoodCategory
    label: string
    emoji: string
    description: string
  }> {
    return Object.entries(this.QUICK_MOODS).map(([mood, config]) => ({
      mood: mood as MoodCategory,
      label: config.label,
      emoji: config.emoji,
      description: config.description
    }))
  }

  // Validate mood category
  static isValidMood(mood: string): mood is MoodCategory {
    return Object.keys(this.QUICK_MOODS).includes(mood)
  }

  // Get mood-specific movie genre mappings
  static getMoodGenres(mood: MoodCategory): number[] {
    const genreMap: Record<MoodCategory, number[]> = {
      happy: [35, 10751, 16],        // Comedy, Family, Animation
      relaxed: [18, 99, 10749],      // Drama, Documentary, Romance
      excited: [28, 12, 53, 10752],  // Action, Adventure, Thriller, War
      romantic: [10749, 18, 35],     // Romance, Drama, Comedy
      thoughtful: [18, 99, 36],      // Drama, Documentary, History
      nostalgic: [36, 10752, 18]     // History, War, Drama
    }

    return genreMap[mood] || []
  }

  // Get mood-specific filters for TMDB API
  static getMoodFilters(mood: MoodCategory): {
    genres: number[]
    sortBy: string
    additionalFilters: Record<string, string>
  } {
    const genres = this.getMoodGenres(mood)

    const sortMap: Record<MoodCategory, string> = {
      happy: 'popularity.desc',
      relaxed: 'vote_average.desc',
      excited: 'popularity.desc',
      romantic: 'popularity.desc',
      thoughtful: 'vote_average.desc',
      nostalgic: 'primary_release_date.desc'
    }

    const additionalFilters: Record<MoodCategory, Record<string, string>> = {
      happy: { 'vote_average.gte': '6.5' },
      relaxed: { 'vote_average.gte': '7.0' },
      excited: { 'vote_average.gte': '6.0' },
      romantic: { 'vote_average.gte': '6.5' },
      thoughtful: { 'vote_average.gte': '7.5' },
      nostalgic: { 'primary_release_date.lte': new Date().getFullYear().toString() }
    }

    return {
      genres,
      sortBy: sortMap[mood],
      additionalFilters: additionalFilters[mood]
    }
  }

  // Get mood-specific UI theme colors
  static getMoodTheme(mood: MoodCategory): {
    primary: string
    secondary: string
    gradient: string
  } {
    const themes: Record<MoodCategory, { primary: string; secondary: string; gradient: string }> = {
      happy: {
        primary: '#FFD700',
        secondary: '#FFA500',
        gradient: 'from-yellow-400 to-orange-500'
      },
      relaxed: {
        primary: '#87CEEB',
        secondary: '#4682B4',
        gradient: 'from-blue-300 to-blue-600'
      },
      excited: {
        primary: '#FF4500',
        secondary: '#DC143C',
        gradient: 'from-red-500 to-red-700'
      },
      romantic: {
        primary: '#FF69B4',
        secondary: '#FF1493',
        gradient: 'from-pink-400 to-pink-600'
      },
      thoughtful: {
        primary: '#9370DB',
        secondary: '#6A5ACD',
        gradient: 'from-purple-400 to-purple-600'
      },
      nostalgic: {
        primary: '#8B4513',
        secondary: '#A0522D',
        gradient: 'from-amber-600 to-amber-800'
      }
    }

    return themes[mood]
  }

  // Get personalized mood suggestions based on history
  static getMoodSuggestions(userHistory: MoodAnalysis[]): MoodCategory[] {
    if (userHistory.length === 0) {
      return ['happy', 'relaxed', 'excited'] // Default suggestions
    }

    // Count mood frequencies
    const moodCounts: Record<MoodCategory, number> = {
      happy: 0,
      relaxed: 0,
      excited: 0,
      romantic: 0,
      thoughtful: 0,
      nostalgic: 0
    }

    userHistory.forEach(analysis => {
      moodCounts[analysis.primary_mood]++
    })

    // Sort by frequency and return top 3
    return Object.entries(moodCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([mood]) => mood as MoodCategory)
  }

  // Merge AI analysis with user preferences
  static enhanceMoodWithPreferences(
    analysis: MoodAnalysis,
    preferences: UserPreferences
  ): MoodAnalysis {
    // Adjust confidence based on preferences
    let adjustedConfidence = analysis.confidence

    // Boost confidence if mood matches favorite genres
    const moodGenres = this.getMoodGenres(analysis.primary_mood)
    const hasPreferredGenres = preferences.favoriteGenres.some(genre =>
      moodGenres.includes(genre)
    )

    if (hasPreferredGenres) {
      adjustedConfidence = Math.min(1.0, adjustedConfidence + 0.1)
    }

    return {
      ...analysis,
      confidence: adjustedConfidence,
      keywords: [
        ...analysis.keywords,
        `preferences: ${preferences.favoriteGenres.length} genres`
      ]
    }
  }
}