'use client'

import { useState } from 'react'
import { MoodSelector } from '@/components/mood/MoodSelector'
import { MoodDisplay } from '@/components/mood/MoodDisplay'
import { MovieGrid } from '@/components/movie/MovieGrid'
import { LoadingState } from '@/components/ui/LoadingSpinner'
import { MoodAnalysis, Recommendation } from '@/types'
import { Button } from '@/components/ui/Button'

export default function MoodFinderPage() {
  const [moodAnalysis, setMoodAnalysis] = useState<MoodAnalysis | null>(null)
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [loading, setLoading] = useState(false)

  const handleMoodSelect = async (analysis: MoodAnalysis) => {
    setMoodAnalysis(analysis)
    setLoading(true)

    try {
      const response = await fetch('/api/ai/recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mood: analysis.primary_mood,
          limit: 20,
        }),
      })

      const data = await response.json()
      if (data.success) {
        setRecommendations(data.data)
      }
    } catch (error) {
      console.error('Failed to get recommendations:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleNewMood = () => {
    setMoodAnalysis(null)
    setRecommendations([])
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Find Your Perfect Movie
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Tell us how you&apos;re feeling and our AI will recommend the perfect movies for your mood.
            Whether you&apos;re happy, sad, excited, or nostalgic, we&apos;ve got you covered.
          </p>
        </div>

        {/* Mood Selection */}
        {!moodAnalysis ? (
          <div className="max-w-2xl mx-auto">
            <MoodSelector onMoodSelect={handleMoodSelect} loading={loading} />
          </div>
        ) : (
          <div className="space-y-8">
            {/* Mood Analysis Display */}
            <div className="max-w-2xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Your Mood Analysis
                </h2>
                <Button
                  variant="outline"
                  onClick={handleNewMood}
                >
                  Try Different Mood
                </Button>
              </div>
              <MoodDisplay moodAnalysis={moodAnalysis} />
            </div>

            {/* Loading State */}
            {loading && (
              <LoadingState message="Finding perfect movies for your mood..." />
            )}

            {/* Recommendations */}
            {recommendations.length > 0 && (
              <div>
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                    Recommended for {moodAnalysis.primary_mood.charAt(0).toUpperCase() + moodAnalysis.primary_mood.slice(1)} Mood
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Based on your mood analysis, we found {recommendations.length} perfect matches for you
                  </p>
                </div>

                <MovieGrid
                  movies={recommendations.map(r => r.movie)}
                  showMoodScore={true}
                  mood={moodAnalysis.primary_mood}
                />
              </div>
            )}

            {/* Mood Tips */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 max-w-2xl mx-auto">
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-300 mb-3">
                💡 Pro Tip
              </h3>
              <p className="text-blue-800 dark:text-blue-200">
                The more specific you are about your mood, the better our recommendations will be.
                Try describing specific emotions, activities you want to do, or even the time of day!
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}