'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { MovieDetails } from '@/types'
import { TMDBClient } from '@/lib/tmdb/client'
import { YouTubeClient } from '@/lib/youtube/client'
import { Button } from '@/components/ui/Button'
import { LoadingState } from '@/components/ui/LoadingSpinner'
import { useFavoriteActions, useWatchlistActions } from '@/store'
import { Star, Clock, Calendar, Play, X, Heart, Plus, Share2 } from 'lucide-react'

export default function MovieDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [movie, setMovie] = useState<MovieDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [trailerUrl, setTrailerUrl] = useState<string | null>(null)
  const [showTrailer, setShowTrailer] = useState(false)

  const { addToFavorites, removeFromFavorites, isFavorite } = useFavoriteActions()
  const { addToWatchlist, removeFromWatchlist, isInWatchlist } = useWatchlistActions()

  const movieId = params.id as string

  useEffect(() => {
    if (movieId) {
      loadMovieDetails()
    }
  }, [movieId])

  const loadMovieDetails = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/movies/${movieId}`)
      const data = await response.json()

      if (data.success) {
        setMovie(data.data)
        loadTrailer(data.data.title, data.data.release_date.split('-')[0])
      } else {
        setError('Failed to load movie details')
      }
    } catch (error) {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const loadTrailer = async (title: string, year?: string) => {
    try {
      const response = await fetch(`/api/youtube/trailer?title=${encodeURIComponent(title)}${year ? `&year=${year}` : ''}`)
      const data = await response.json()

      if (data.success && data.data) {
        setTrailerUrl(YouTubeClient.getEmbedUrl(data.data.id))
      }
    } catch (error) {
      console.error('Failed to load trailer:', error)
    }
  }

  const handleFavoriteClick = () => {
    if (!movie) return

    if (isFavorite(movie.id)) {
      removeFromFavorites(movie.id)
    } else {
      addToFavorites(movie)
    }
  }

  const handleWatchlistClick = () => {
    if (!movie) return

    if (isInWatchlist(movie.id)) {
      removeFromWatchlist(movie.id)
    } else {
      addToWatchlist(movie)
    }
  }

  const handleShare = async () => {
    if (!movie) return

    const shareUrl = window.location.href
    if (navigator.share) {
      await navigator.share({
        title: movie.title,
        text: movie.overview,
        url: shareUrl,
      })
    } else {
      await navigator.clipboard.writeText(shareUrl)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingState message="Loading movie details..." />
      </div>
    )
  }

  if (error || !movie) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {error || 'Movie not found'}
          </h2>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    )
  }

  const favorite = isFavorite(movie.id)
  const watchlisted = isInWatchlist(movie.id)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section with Backdrop */}
      <div className="relative h-96 lg:h-[500px]">
        {movie.backdrop_path ? (
          <Image
            src={TMDBClient.getImageUrl(movie.backdrop_path, 'w1280')}
            alt={movie.title}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-600 to-purple-600" />
        )}

        <div className="absolute inset-0 bg-black/50" />

        {/* Back Button */}
        <div className="absolute top-4 left-4">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="text-white hover:bg-white/20"
          >
            ← Back
          </Button>
        </div>

        {/* Movie Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-4xl lg:text-6xl font-bold text-white mb-4">
              {movie.title}
            </h1>
            <div className="flex items-center space-x-6 text-white">
              <div className="flex items-center space-x-1">
                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                <span>{movie.vote_average.toFixed(1)}/10</span>
              </div>
              <div className="flex items-center space-x-1">
                <Calendar className="w-5 h-5" />
                <span>{new Date(movie.release_date).getFullYear()}</span>
              </div>
              {movie.runtime && (
                <div className="flex items-center space-x-1">
                  <Clock className="w-5 h-5" />
                  <span>{Math.floor(movie.runtime / 60)}h {movie.runtime % 60}m</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Movie Poster and Actions */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-4">
              <div className="relative aspect-[2/3] rounded-xl overflow-hidden shadow-xl">
                {movie.poster_path ? (
                  <Image
                    src={TMDBClient.getImageUrl(movie.poster_path, 'w500')}
                    alt={movie.title}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                    <span className="text-gray-400">No Poster</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                {trailerUrl && (
                  <Button
                    onClick={() => setShowTrailer(true)}
                    className="w-full"
                    size="lg"
                  >
                    <Play className="w-5 h-5 mr-2" />
                    Watch Trailer
                  </Button>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    onClick={handleFavoriteClick}
                    className={favorite ? 'text-red-500 border-red-500' : ''}
                  >
                    <Heart className={`w-5 h-5 mr-2 ${favorite ? 'fill-current' : ''}`} />
                    {favorite ? 'Favorited' : 'Favorite'}
                  </Button>

                  <Button
                    variant="outline"
                    onClick={handleWatchlistClick}
                    className={watchlisted ? 'text-blue-500 border-blue-500' : ''}
                  >
                    <Plus className={`w-5 h-5 mr-2 ${watchlisted ? 'rotate-45' : ''}`} />
                    {watchlisted ? 'Added' : 'Watchlist'}
                  </Button>
                </div>

                <Button
                  variant="outline"
                  onClick={handleShare}
                  className="w-full"
                >
                  <Share2 className="w-5 h-5 mr-2" />
                  Share
                </Button>
              </div>
            </div>
          </div>

          {/* Movie Details */}
          <div className="lg:col-span-2 space-y-8">
            {/* Overview */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Overview
              </h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {movie.overview}
              </p>
            </div>

            {/* Genres */}
            {movie.genres.length > 0 && (
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  Genres
                </h3>
                <div className="flex flex-wrap gap-2">
                  {movie.genres.map((genre) => (
                    <span
                      key={genre.id}
                      className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm"
                    >
                      {genre.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Similar Movies */}
            {movie.similar.length > 0 && (
              <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  Similar Movies
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {movie.similar.slice(0, 8).map((similarMovie) => (
                    <div
                      key={similarMovie.id}
                      className="cursor-pointer group"
                      onClick={() => router.push(`/movie/${similarMovie.id}`)}
                    >
                      <div className="relative aspect-[2/3] rounded-lg overflow-hidden mb-2">
                        {similarMovie.poster_path ? (
                          <Image
                            src={TMDBClient.getImageUrl(similarMovie.poster_path, 'w342')}
                            alt={similarMovie.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                            <span className="text-gray-400 text-xs">No Poster</span>
                          </div>
                        )}
                      </div>
                      <h4 className="font-medium text-sm text-gray-900 dark:text-white line-clamp-2">
                        {similarMovie.title}
                      </h4>
                      <p className="text-xs text-gray-500">
                        {new Date(similarMovie.release_date).getFullYear()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Trailer Modal */}
      {showTrailer && trailerUrl && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-4xl">
            <Button
              variant="ghost"
              onClick={() => setShowTrailer(false)}
              className="absolute -top-12 right-0 text-white hover:bg-white/20"
            >
              <X className="w-6 h-6" />
            </Button>
            <div className="aspect-video">
              <iframe
                src={trailerUrl}
                className="w-full h-full rounded-lg"
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}