'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { MoodSelector } from '@/components/mood/MoodSelector'
import { MoodDisplay } from '@/components/mood/MoodDisplay'
import { MovieGrid } from '@/components/movie/MovieGrid'
import { LoadingState } from '@/components/ui/LoadingSpinner'
import { Button } from '@/components/ui/Button'
import { useAppStore } from '@/store'
import { MoodAnalysis, Recommendation } from '@/types'
import { SearchBar } from '@/components/movie/SearchBar'

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [moodAnalysis, setMoodAnalysis] = useState<MoodAnalysis | null>(null)
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [loading, setLoading] = useState(false)
  const [popularMovies, setPopularMovies] = useState([])

  const { setCurrentMood, setRecommendations: setStoreRecommendations } = useAppStore()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    // Load popular movies on mount
    loadPopularMovies()
  }, [])

  const loadPopularMovies = async () => {
    try {
      const response = await fetch('/api/movies/popular')
      const data = await response.json()
      if (data.success) {
        setPopularMovies(data.data.results)
      }
    } catch (error) {
      console.error('Failed to load popular movies:', error)
    }
  }

  const handleMoodSelect = async (analysis: MoodAnalysis) => {
    setMoodAnalysis(analysis)
    setCurrentMood(analysis.primary_mood)
    setLoading(true)

    try {
      const response = await fetch('/api/ai/recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mood: analysis.primary_mood,
          limit: 12,
        }),
      })

      const data = await response.json()
      if (data.success) {
        setRecommendations(data.data)
        setStoreRecommendations(data.data)
      }
    } catch (error) {
      console.error('Failed to get recommendations:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async (query: string, filters?: any) => {
    try {
      const params = new URLSearchParams({
        query,
        ...(filters?.genre && { genre: filters.genre.toString() }),
        ...(filters?.year && { year: filters.year.toString() }),
        ...(filters?.rating && { rating: filters.rating.toString() }),
        ...(filters?.sortBy && { sortBy: filters.sortBy }),
      })

      const response = await fetch(`/api/movies/search?${params}`)
      const data = await response.json()
      if (data.success) {
        setRecommendations([])
        setMoodAnalysis(null)
        // You might want to create a search results component
      }
    } catch (error) {
      console.error('Search failed:', error)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingState message="Loading..." />
      </div>
    )
  }

  if (!session) {
    return null // Will redirect
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Welcome back, {session.user?.name}!
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            How are you feeling today? Let us find the perfect movie for your mood.
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <SearchBar
            onSearch={handleSearch}
            placeholder="Search for movies..."
          />
        </div>

        {/* Mood Selection */}
        {!moodAnalysis && (
          <div className="mb-8">
            <MoodSelector onMoodSelect={handleMoodSelect} loading={loading} />
          </div>
        )}

        {/* Current Mood Display */}
        {moodAnalysis && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Your Mood: {moodAnalysis.primary_mood.charAt(0).toUpperCase() + moodAnalysis.primary_mood.slice(1)}
              </h2>
              <Button
                variant="outline"
                onClick={() => {
                  setMoodAnalysis(null)
                  setRecommendations([])
                  setCurrentMood(null)
                }}
              >
                Change Mood
              </Button>
            </div>
            <MoodDisplay moodAnalysis={moodAnalysis} />
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="mb-8">
            <LoadingState message="Finding perfect movies for your mood..." />
          </div>
        )}

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Recommended for You
            </h2>
            <MovieGrid
              movies={recommendations.map(r => r.movie)}
              showMoodScore={true}
              mood={moodAnalysis?.primary_mood}
            />
          </div>
        )}

        {/* Popular Movies (shown when no mood is selected) */}
        {!moodAnalysis && popularMovies.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Popular Movies
            </h2>
            <MovieGrid movies={popularMovies} />
          </div>
        )}
      </div>
    </div>
  )
}