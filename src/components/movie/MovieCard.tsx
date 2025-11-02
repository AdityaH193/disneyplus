'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Movie, MoodCategory } from '@/types'
import { TMDBClient } from '@/lib/tmdb/client'
import { useFavoriteActions, useWatchlistActions } from '@/store'
import { cn, formatRating, formatDate } from '@/lib/utils'
import { Heart, Plus, Play, Star, Clock } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface MovieCardProps {
  movie: Movie
  showTrailer?: boolean
  showMoodScore?: boolean
  mood?: MoodCategory
  onTrailerClick?: (movie: Movie) => void
  className?: string
}

export function MovieCard({
  movie,
  showTrailer = true,
  showMoodScore = false,
  mood,
  onTrailerClick,
  className
}: MovieCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [imageError, setImageError] = useState(false)

  const { addToFavorites, removeFromFavorites, isFavorite } = useFavoriteActions()
  const { addToWatchlist, removeFromWatchlist, isInWatchlist } = useWatchlistActions()

  const favorite = isFavorite(movie.id)
  const watchlisted = isInWatchlist(movie.id)

  const posterUrl = TMDBClient.getImageUrl(movie.poster_path, 'w342')
  const backdropUrl = TMDBClient.getImageUrl(movie.backdrop_path, 'w780')

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (favorite) {
      removeFromFavorites(movie.id)
    } else {
      addToFavorites(movie)
    }
  }

  const handleWatchlistClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (watchlisted) {
      removeFromWatchlist(movie.id)
    } else {
      addToWatchlist(movie)
    }
  }

  const handleTrailerClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onTrailerClick?.(movie)
  }

  const getGenreNames = (genreIds: number[]) => {
    // This would need to be implemented with actual genre data
    // For now, return placeholder
    return genreIds.length > 0 ? ['Action', 'Drama', 'Comedy'].slice(0, genreIds.length) : []
  }

  return (
    <div
      className={cn(
        'group relative bg-white dark:bg-gray-800 rounded-xl overflow-hidden',
        'border border-gray-200 dark:border-gray-700',
        'transition-all duration-300 hover:scale-105 hover:shadow-xl',
        'cursor-pointer',
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => window.location.href = `/movie/${movie.id}`}
    >
      {/* Poster Image */}
      <div className="relative aspect-[2/3] overflow-hidden bg-gray-100 dark:bg-gray-900">
        {!imageError && posterUrl ? (
          <Image
            src={posterUrl}
            alt={movie.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-110"
            onError={() => setImageError(true)}
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-600">
            <div className="text-center p-4">
              <div className="text-2xl mb-2">🎬</div>
              <div className="text-sm">No Poster</div>
            </div>
          </div>
        )}

        {/* Hover Overlay */}
        {isHovered && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300">
            <div className="absolute inset-0 flex flex-col justify-end p-4">
              {/* Movie Info */}
              <div className="space-y-2 text-white">
                <h3 className="font-bold text-sm line-clamp-2">{movie.title}</h3>
                <p className="text-xs opacity-90 line-clamp-2">{movie.overview}</p>

                {/* Metadata */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1">
                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      <span>{formatRating(movie.vote_average)}</span>
                    </div>
                    <span>•</span>
                    <span>{new Date(movie.release_date).getFullYear()}</span>
                  </div>
                </div>

                {/* Genres */}
                <div className="flex flex-wrap gap-1">
                  {getGenreNames(movie.genre_ids).slice(0, 3).map((genre, index) => (
                    <span
                      key={index}
                      className="px-2 py-0.5 bg-white/20 backdrop-blur-sm rounded-full text-xs"
                    >
                      {genre}
                    </span>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center space-x-2 pt-2">
                  {showTrailer && (
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={handleTrailerClick}
                      className="flex-1"
                    >
                      <Play className="w-3 h-3 mr-1" />
                      Trailer
                    </Button>
                  )}

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleFavoriteClick}
                    className={cn(
                      'px-2',
                      favorite && 'text-red-500 hover:text-red-600'
                    )}
                  >
                    <Heart className={cn('w-4 h-4', favorite && 'fill-current')} />
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleWatchlistClick}
                    className={cn(
                      'px-2',
                      watchlisted && 'text-blue-500 hover:text-blue-600'
                    )}
                  >
                    <Plus className={cn('w-4 h-4', watchlisted && 'rotate-45')} />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Mood Score Badge */}
        {showMoodScore && mood && (
          <div className="absolute top-2 left-2 px-2 py-1 bg-black/70 backdrop-blur-sm rounded-full">
            <span className="text-xs text-white font-medium">
              {Math.round(Math.random() * 40 + 60)}% match
            </span>
          </div>
        )}

        {/* Rating Badge */}
        <div className="absolute top-2 right-2 px-2 py-1 bg-black/70 backdrop-blur-sm rounded-full flex items-center space-x-1">
          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
          <span className="text-xs text-white font-medium">
            {formatRating(movie.vote_average)}
          </span>
        </div>
      </div>

      {/* Movie Info (Always Visible) */}
      <div className="p-4 space-y-2">
        <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-1">
          {movie.title}
        </h3>

        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span>{formatRating(movie.vote_average)}</span>
            </div>
            <span>•</span>
            <span>{new Date(movie.release_date).getFullYear()}</span>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center space-x-2 pt-2 border-t border-gray-100 dark:border-gray-700">
          {showTrailer && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleTrailerClick}
              className="flex-1 text-xs"
            >
              <Play className="w-3 h-3 mr-1" />
              Trailer
            </Button>
          )}

          <Button
            size="sm"
            variant="ghost"
            onClick={handleFavoriteClick}
            className={cn(
              'px-2',
              favorite && 'text-red-500 hover:text-red-600'
            )}
          >
            <Heart className={cn('w-4 h-4', favorite && 'fill-current')} />
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={handleWatchlistClick}
            className={cn(
              'px-2',
              watchlisted && 'text-blue-500 hover:text-blue-600'
            )}
          >
            <Plus className={cn('w-4 h-4', watchlisted && 'rotate-45')} />
          </Button>
        </div>
      </div>
    </div>
  )
}