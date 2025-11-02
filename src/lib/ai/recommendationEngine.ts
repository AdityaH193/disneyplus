import { Movie, MovieDetails, MoodCategory, Recommendation, UserPreferences, MoodAnalysis } from '@/types'
import { TMDBClient } from '../tmdb/client'
import { OpenAIClient } from './openaiClient'
import { MoodDetector } from './moodDetector'

export class RecommendationEngine {
  // Main recommendation generation
  static async generateMoodRecommendations(
    mood: MoodCategory,
    preferences: UserPreferences | null = null,
    limit: number = 20
  ): Promise<Recommendation[]> {
    try {
      // Get movies based on mood
      const moodFilters = MoodDetector.getMoodFilters(mood)
      const movies = await this.getMoodBasedMovies(mood, limit * 2) // Get more for filtering

      // Score and rank movies
      const scoredMovies = await Promise.all(
        movies.map(movie => this.scoreMovieForMood(movie, mood, preferences))
      )

      // Sort by final score and filter by minimum threshold
      const recommendations = scoredMovies
        .filter(rec => rec.finalScore >= 0.3) // Minimum relevance threshold
        .sort((a, b) => b.finalScore - a.finalScore)
        .slice(0, limit)

      return recommendations
    } catch (error) {
      console.error('Failed to generate mood recommendations:', error)
      throw new Error('Unable to generate recommendations at this time')
    }
  }

  // Get movies based on mood using TMDB
  private static async getMoodBasedMovies(mood: MoodCategory, limit: number): Promise<Movie[]> {
    try {
      // Try mood-specific search first
      const moodResponse = await TMDBClient.getMoviesByMood(mood, 1)

      if (moodResponse.results.length >= limit) {
        return moodResponse.results.slice(0, limit)
      }

      // Fallback to genre-based search
      const moodGenres = MoodDetector.getMoodGenres(mood)
      if (moodGenres.length > 0) {
        const genreMovies = await TMDBClient.getMoviesByGenre(moodGenres[0], 1)
        return genreMovies.results.slice(0, limit)
      }

      // Final fallback to popular movies
      const popularMovies = await TMDBClient.getPopularMovies(1)
      return popularMovies.results.slice(0, limit)
    } catch (error) {
      console.error('Failed to get mood-based movies:', error)
      // Return popular movies as fallback
      const popularMovies = await TMDBClient.getPopularMovies(1)
      return popularMovies.results.slice(0, limit)
    }
  }

  // Score individual movie for mood relevance
  private static async scoreMovieForMood(
    movie: Movie,
    mood: MoodCategory,
    preferences: UserPreferences | null
  ): Promise<Recommendation> {
    // Base scores
    let moodScore = await this.calculateMoodRelevance(movie, mood)
    let userScore = this.calculateUserPreferenceScore(movie, preferences)
    let popularityScore = this.calculatePopularityScore(movie)
    let freshnessScore = this.calculateFreshnessScore(movie)

    // Generate AI explanation for top recommendations
    let explanation = ''
    if (moodScore > 0.7) {
      try {
        const aiExplanation = await OpenAIClient.generateRecommendationExplanation(
          movie.title,
          movie.overview,
          mood
        )
        explanation = aiExplanation.explanation
        moodScore = aiExplanation.mood_match_score
      } catch (error) {
        explanation = this.getFallbackExplanation(mood)
      }
    } else {
      explanation = this.getFallbackExplanation(mood)
    }

    // Calculate final weighted score
    const finalScore = (
      moodScore * 0.4 +
      userScore * 0.3 +
      popularityScore * 0.2 +
      freshnessScore * 0.1
    )

    return {
      movie,
      moodScore,
      userScore,
      finalScore,
      explanation
    }
  }

  // Calculate mood relevance score
  private static async calculateMoodRelevance(movie: Movie, mood: MoodCategory): Promise<number> {
    const moodGenres = MoodDetector.getMoodGenres(mood)
    const matchingGenres = movie.genre_ids.filter(id => moodGenres.includes(id))

    // Base score from genre matching
    let genreScore = matchingGenres.length / Math.max(moodGenres.length, 1)

    // Adjust for specific movie characteristics based on mood
    let characteristicScore = 0

    switch (mood) {
      case 'happy':
        // Look for keywords suggesting uplifting content
        characteristicScore = this.analyzeKeywords(movie.overview, ['happy', 'joy', 'fun', 'adventure', 'comedy'])
        break
      case 'relaxed':
        characteristicScore = this.analyzeKeywords(movie.overview, ['peaceful', 'calm', 'family', 'gentle', 'heartwarming'])
        break
      case 'excited':
        characteristicScore = this.analyzeKeywords(movie.overview, ['action', 'thriller', 'adventure', 'intense', 'exciting'])
        break
      case 'romantic':
        characteristicScore = this.analyzeKeywords(movie.overview, ['love', 'romance', 'romantic', 'relationship', 'heart'])
        break
      case 'thoughtful':
        characteristicScore = this.analyzeKeywords(movie.overview, ['deep', 'meaningful', 'inspiring', 'thoughtful', 'powerful'])
        break
      case 'nostalgic':
        // Give higher score to older movies
        const releaseYear = new Date(movie.release_date).getFullYear()
        const currentYear = new Date().getFullYear()
        if (currentYear - releaseYear > 20) {
          characteristicScore = 0.3
        }
        break
    }

    return Math.min(1.0, (genreScore * 0.6 + characteristicScore * 0.4))
  }

  // Calculate user preference score
  private static calculateUserPreferenceScore(movie: Movie, preferences: UserPreferences | null): number {
    if (!preferences) return 0.5 // Neutral score for new users

    let score = 0.5

    // Genre preferences
    const genreMatches = movie.genre_ids.filter(id => preferences.favoriteGenres.includes(id)).length
    score += (genreMatches / Math.max(movie.genre_ids.length, 1)) * 0.3

    // Rating preferences
    if (movie.vote_average >= preferences.minRating && movie.vote_average <= preferences.maxRating) {
      score += 0.2
    } else {
      score -= 0.2
    }

    return Math.min(1.0, Math.max(0.0, score))
  }

  // Calculate popularity score
  private static calculatePopularityScore(movie: Movie): number {
    // Use TMDB popularity and vote average
    const popularityScore = Math.min(movie.vote_average / 10, 1.0)
    return popularityScore
  }

  // Calculate freshness score
  private static calculateFreshnessScore(movie: Movie): number {
    const releaseYear = new Date(movie.release_date).getFullYear()
    const currentYear = new Date().getFullYear()
    const yearsSinceRelease = currentYear - releaseYear

    // Newer movies get higher freshness scores
    if (yearsSinceRelease <= 1) return 1.0
    if (yearsSinceRelease <= 3) return 0.8
    if (yearsSinceRelease <= 5) return 0.6
    if (yearsSinceRelease <= 10) return 0.4
    return 0.2
  }

  // Analyze keywords in movie overview
  private static analyzeKeywords(text: string, keywords: string[]): number {
    const lowerText = text.toLowerCase()
    const matchingKeywords = keywords.filter(keyword => lowerText.includes(keyword.toLowerCase()))
    return matchingKeywords.length / keywords.length
  }

  // Get fallback explanation when AI fails
  private static getFallbackExplanation(mood: MoodCategory): string {
    const explanations: Record<MoodCategory, string> = {
      happy: 'Perfect choice to lift your spirits!',
      relaxed: 'A great match for your peaceful mood.',
      excited: 'High-energy entertainment awaits!',
      romantic: 'Ideal for your romantic mood.',
      thoughtful: 'Deep content for your reflective state.',
      nostalgic: 'A classic that matches your nostalgic mood.'
    }

    return explanations[mood] || 'Great entertainment choice!'
  }

  // Filter recommendations by user preferences
  static filterByUserPreferences(
    recommendations: Recommendation[],
    preferences: UserPreferences
  ): Recommendation[] {
    return recommendations.filter(rec => {
      const movie = rec.movie

      // Filter by content rating
      if (preferences.contentRatings.length > 0) {
        // This would need content rating data from TMDB
        // For now, we'll skip this filter
      }

      // Filter by rating range
      if (movie.vote_average < preferences.minRating || movie.vote_average > preferences.maxRating) {
        return false
      }

      // Filter by language
      if (preferences.language && movie.original_language !== preferences.language) {
        return false
      }

      return true
    })
  }

  // Get similar recommendations for a specific movie
  static async getSimilarRecommendations(
    movie: MovieDetails,
    mood: MoodCategory | null = null,
    limit: number = 10
  ): Promise<Recommendation[]> {
    try {
      const similarMovies = movie.similar.slice(0, limit * 2)

      const recommendations = await Promise.all(
        similarMovies.map(async (similarMovie) => {
          let moodScore = 0.5
          let explanation = 'Similar to your selected movie'

          if (mood) {
            moodScore = await this.calculateMoodRelevance(similarMovie, mood)
            if (moodScore > 0.6) {
              try {
                const aiExplanation = await OpenAIClient.generateRecommendationExplanation(
                  similarMovie.title,
                  similarMovie.overview,
                  mood
                )
                explanation = aiExplanation.explanation
                moodScore = aiExplanation.mood_match_score
              } catch (error) {
                // Keep fallback explanation
              }
            }
          }

          return {
            movie: similarMovie,
            moodScore,
            userScore: 0.7, // Higher score since it's similar to user's choice
            finalScore: (moodScore * 0.3 + 0.7 * 0.7),
            explanation
          }
        })
      )

      return recommendations
        .sort((a, b) => b.finalScore - a.finalScore)
        .slice(0, limit)
    } catch (error) {
      console.error('Failed to get similar recommendations:', error)
      return []
    }
  }

  // Explain why a movie matches a mood
  static async explainRecommendation(movie: MovieDetails, mood: MoodCategory): Promise<string> {
    try {
      const explanation = await OpenAIClient.generateRecommendationExplanation(
        movie.title,
        movie.overview,
        mood
      )
      return explanation.explanation
    } catch (error) {
      console.error('Failed to generate recommendation explanation:', error)
      return this.getFallbackExplanation(mood)
    }
  }
}