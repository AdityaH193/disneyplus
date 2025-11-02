'use client'

import { useState } from 'react'
import { MoodCategory, MoodAnalysis } from '@/types'
import { MoodDetector } from '@/lib/ai/moodDetector'
import { cn } from '@/lib/utils'

interface MoodSelectorProps {
  onMoodSelect: (analysis: MoodAnalysis) => void
  loading?: boolean
  className?: string
}

export function MoodSelector({ onMoodSelect, loading = false, className }: MoodSelectorProps) {
  const [textInput, setTextInput] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const quickMoods = MoodDetector.getQuickMoods()

  const handleQuickMoodSelect = async (mood: MoodCategory) => {
    try {
      setError(null)
      const analysis = MoodDetector.classifyUIMood(mood)
      onMoodSelect(analysis)
    } catch (error) {
      setError('Failed to select mood. Please try again.')
    }
  }

  const handleTextMoodSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!textInput.trim()) {
      setError('Please describe your mood')
      return
    }

    try {
      setIsAnalyzing(true)
      setError(null)

      const analysis = await MoodDetector.analyzeTextMood(textInput)
      onMoodSelect(analysis)

      // Clear input after successful analysis
      setTextInput('')
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to analyze mood')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTextInput(e.target.value)
    if (error) setError(null)
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Quick Mood Selection */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          How are you feeling?
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {quickMoods.map(({ mood, label, emoji, description }) => {
            const theme = MoodDetector.getMoodTheme(mood)

            return (
              <button
                key={mood}
                onClick={() => handleQuickMoodSelect(mood)}
                disabled={loading || isAnalyzing}
                className={cn(
                  'relative p-4 rounded-xl border-2 transition-all duration-200',
                  'hover:scale-105 active:scale-100',
                  'focus:outline-none focus:ring-2 focus:ring-offset-2',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  'border-gray-200 dark:border-gray-700',
                  'hover:border-gray-300 dark:hover:border-gray-600',
                  'bg-white dark:bg-gray-800',
                  'hover:shadow-lg'
                )}
                style={{
                  '--tw-ring-color': theme.primary,
                } as React.CSSProperties}
              >
                <div className="text-center space-y-2">
                  <div className="text-3xl">{emoji}</div>
                  <div className="font-medium text-sm text-gray-900 dark:text-white">
                    {label}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {description}
                  </div>
                </div>

                {/* Hover effect with theme gradient */}
                <div
                  className={cn(
                    'absolute inset-0 rounded-xl opacity-0 hover:opacity-10 transition-opacity',
                    `bg-gradient-to-br ${theme.gradient}`
                  )}
                />
              </button>
            )
          })}
        </div>
      </div>

      {/* Text Mood Description */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Describe your mood
          </h3>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            or use the quick buttons above
          </span>
        </div>

        <form onSubmit={handleTextMoodSubmit} className="space-y-3">
          <div className="relative">
            <textarea
              value={textInput}
              onChange={handleInputChange}
              placeholder="I'm feeling... (e.g., happy and want to laugh, tired and need something relaxing, excited for action)"
              className={cn(
                'w-full p-4 rounded-lg border-2 resize-none',
                'focus:outline-none focus:ring-2 focus:ring-offset-2',
                'border-gray-300 dark:border-gray-600',
                'focus:border-blue-500 dark:focus:border-blue-400',
                'bg-white dark:bg-gray-800',
                'text-gray-900 dark:text-white',
                'placeholder-gray-500 dark:placeholder-gray-400',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                error && 'border-red-500 focus:border-red-500 focus:ring-red-500'
              )}
              rows={4}
              maxLength={500}
              disabled={loading || isAnalyzing}
            />
            <div className="absolute bottom-2 right-2 text-xs text-gray-400">
              {textInput.length}/500
            </div>
          </div>

          {error && (
            <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={!textInput.trim() || loading || isAnalyzing}
            className={cn(
              'w-full sm:w-auto px-6 py-3 rounded-lg font-medium',
              'transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-offset-2',
              'bg-blue-600 hover:bg-blue-700 text-white',
              'focus:ring-blue-500',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'disabled:hover:bg-blue-600'
            )}
          >
            {isAnalyzing ? (
              <span className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Analyzing mood...</span>
              </span>
            ) : (
              'Analyze My Mood'
            )}
          </button>
        </form>
      </div>

      {/* Loading overlay */}
      {(loading || isAnalyzing) && (
        <div className="absolute inset-0 bg-white/50 dark:bg-black/50 backdrop-blur-sm rounded-lg flex items-center justify-center">
          <div className="text-center space-y-3">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {isAnalyzing ? 'Analyzing your mood...' : 'Loading recommendations...'}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}