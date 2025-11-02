'use client'

import { MoodAnalysis, MoodCategory } from '@/types'
import { MoodDetector } from '@/lib/ai/moodDetector'
import { cn } from '@/lib/utils'

interface MoodDisplayProps {
  moodAnalysis: MoodAnalysis | null
  className?: string
  showExplanation?: boolean
  compact?: boolean
}

export function MoodDisplay({
  moodAnalysis,
  className,
  showExplanation = true,
  compact = false
}: MoodDisplayProps) {
  if (!moodAnalysis) return null

  const theme = MoodDetector.getMoodTheme(moodAnalysis.primary_mood)
  const quickMood = MoodDetector.getQuickMoods().find(m => m.mood === moodAnalysis.primary_mood)

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600 dark:text-green-400'
    if (confidence >= 0.6) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-600 dark:text-red-400'
  }

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.8) return 'High confidence'
    if (confidence >= 0.6) return 'Medium confidence'
    return 'Low confidence'
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Mood Header */}
      <div className={cn(
        'flex items-center space-x-4 p-4 rounded-xl',
        'bg-white dark:bg-gray-800 border-2',
        compact ? 'border-gray-200 dark:border-gray-700' : '',
        !compact && `border-opacity-20 bg-gradient-to-r ${theme.gradient} bg-opacity-10`
      )}
      style={!compact ? { borderColor: theme.primary } : {}}>
        {/* Mood Icon and Label */}
        <div className="flex items-center space-x-3">
          {quickMood && (
            <div className="text-3xl">{quickMood.emoji}</div>
          )}
          <div>
            <h3 className={cn(
              'font-semibold text-lg',
              compact ? 'text-gray-900 dark:text-white' : 'text-white'
            )}>
              {quickMood?.label || moodAnalysis.primary_mood.charAt(0).toUpperCase() + moodAnalysis.primary_mood.slice(1)}
            </h3>
            {!compact && (
              <p className="text-sm opacity-90">
                {quickMood?.description}
              </p>
            )}
          </div>
        </div>

        {/* Confidence Meter */}
        {!compact && (
          <div className="ml-auto text-right">
            <div className={cn('text-sm font-medium', getConfidenceColor(moodAnalysis.confidence))}>
              {getConfidenceLabel(moodAnalysis.confidence)}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              {Math.round(moodAnalysis.confidence * 100)}% match
            </div>
          </div>
        )}
      </div>

      {/* Mood Details */}
      {!compact && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Keywords */}
          {moodAnalysis.keywords.length > 0 && (
            <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900/50">
              <h4 className="font-medium text-sm text-gray-900 dark:text-white mb-2">
                Key Elements
              </h4>
              <div className="flex flex-wrap gap-2">
                {moodAnalysis.keywords.slice(0, 6).map((keyword, index) => (
                  <span
                    key={index}
                    className={cn(
                      'px-3 py-1 rounded-full text-xs font-medium',
                      'bg-white dark:bg-gray-800',
                      'text-gray-700 dark:text-gray-300',
                      'border border-gray-200 dark:border-gray-700'
                    )}
                    style={{ borderColor: theme.primary }}
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Explanation */}
          {showExplanation && moodAnalysis.explanation && (
            <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900/50">
              <h4 className="font-medium text-sm text-gray-900 dark:text-white mb-2">
                Why this mood?
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {moodAnalysis.explanation}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Mood Theme Visualization */}
      {!compact && (
        <div className="h-2 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
          <div
            className={cn('h-full transition-all duration-500', `bg-gradient-to-r ${theme.gradient}`)}
            style={{ width: `${moodAnalysis.confidence * 100}%` }}
          />
        </div>
      )}
    </div>
  )
}

// Compact version for use in cards and smaller spaces
export function MoodBadge({ mood, confidence }: { mood: MoodCategory; confidence?: number }) {
  const theme = MoodDetector.getMoodTheme(mood)
  const quickMood = MoodDetector.getQuickMoods().find(m => m.mood === mood)

  return (
    <div
      className={cn(
        'inline-flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium',
        'bg-white dark:bg-gray-800 border-2',
        'border-opacity-30'
      )}
      style={{ borderColor: theme.primary }}
    >
      <span>{quickMood?.emoji}</span>
      <span className="text-gray-900 dark:text-white">{quickMood?.label || mood}</span>
      {confidence && (
        <span className="text-xs text-gray-500">
          {Math.round(confidence * 100)}%
        </span>
      )}
    </div>
  )
}