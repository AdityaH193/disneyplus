'use client'

import { Movie, MoodCategory } from '@/types'
import { MovieCard } from './MovieCard'
import { LoadingState } from '@/components/ui/LoadingSpinner'
import { cn } from '@/lib/utils'

interface MovieGridProps {
  movies: Movie[]
  loading?: boolean
  error?: string | null
  showTrailer?: boolean
  showMoodScore?: boolean
  mood?: MoodCategory
  onTrailerClick?: (movie: Movie) => void
  className?: string
  emptyMessage?: string
}

export function MovieGrid({
  movies,
  loading = false,
  error = null,
  showTrailer = true,
  showMoodScore = false,
  mood,
  onTrailerClick,
  className,
  emptyMessage = 'No movies found'
}: MovieGridProps) {
  if (loading) {
    return (
      <div className={cn('grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4', className)}>
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="aspect-[2/3] bg-gray-200 dark:bg-gray-700 rounded-xl mb-2" />
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-12', className)}>
        <div className="text-center space-y-4">
          <div className="text-4xl">😕</div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Oops! Something went wrong
            </h3>
            <p className="text-gray-600 dark:text-gray-400">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  if (movies.length === 0) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-12', className)}>
        <div className="text-center space-y-4">
          <div className="text-4xl">🎬</div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {emptyMessage}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Try adjusting your mood or search criteria
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4', className)}>
      {movies.map((movie) => (
        <MovieCard
          key={movie.id}
          movie={movie}
          showTrailer={showTrailer}
          showMoodScore={showMoodScore}
          mood={mood}
          onTrailerClick={onTrailerClick}
        />
      ))}
    </div>
  )
}

interface MovieCarouselProps {
  movies: Movie[]
  title?: string
  showTrailer?: boolean
  showMoodScore?: boolean
  mood?: MoodCategory
  onTrailerClick?: (movie: Movie) => void
  className?: string
}

export function MovieCarousel({
  movies,
  title,
  showTrailer = true,
  showMoodScore = false,
  mood,
  onTrailerClick,
  className
}: MovieCarouselProps) {
  if (movies.length === 0) return null

  return (
    <div className={cn('space-y-4', className)}>
      {title && (
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          {title}
        </h2>
      )}

      <div className="relative">
        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex space-x-4 pb-4">
            {movies.map((movie) => (
              <div key={movie.id} className="flex-none w-48">
                <MovieCard
                  movie={movie}
                  showTrailer={showTrailer}
                  showMoodScore={showMoodScore}
                  mood={mood}
                  onTrailerClick={onTrailerClick}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicators */}
        <button className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 bg-white dark:bg-gray-800 rounded-full shadow-lg flex items-center justify-center text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
          ←
        </button>
        <button className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-8 h-8 bg-white dark:bg-gray-800 rounded-full shadow-lg flex items-center justify-center text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
          →
        </button>
      </div>
    </div>
  )
}

// Add custom styles for hiding scrollbars
const style = document.createElement('style')
style.textContent = `
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
`
if (typeof document !== 'undefined') {
  document.head.appendChild(style)
}