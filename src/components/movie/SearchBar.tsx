'use client'

import { useState, useEffect, useRef } from 'react'
import { Movie, MovieFilters } from '@/types'
import { TMDBClient } from '@/lib/tmdb/client'
import { Search, X, Filter, SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { cn, debounce } from '@/lib/utils'

interface SearchBarProps {
  onSearch: (query: string, filters?: MovieFilters) => void
  onMovieSelect?: (movie: Movie) => void
  placeholder?: string
  showFilters?: boolean
  className?: string
}

export function SearchBar({
  onSearch,
  onMovieSelect,
  placeholder = 'Search movies...',
  showFilters = true,
  className
}: SearchBarProps) {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<Movie[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showFiltersPanel, setShowFiltersPanel] = useState(false)
  const [filters, setFilters] = useState<MovieFilters>({})

  const searchRef = useRef<HTMLDivElement>(null)
  const debouncedSearch = debounce(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setSuggestions([])
      return
    }

    try {
      setLoading(true)
      const results = await TMDBClient.searchMovies(searchQuery, filters, 1)
      setSuggestions(results.results.slice(0, 5))
    } catch (error) {
      console.error('Search failed:', error)
      setSuggestions([])
    } finally {
      setLoading(false)
    }
  }, 300)

  useEffect(() => {
    if (query) {
      debouncedSearch(query)
    } else {
      setSuggestions([])
    }
  }, [query, debouncedSearch])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      onSearch(query.trim(), filters)
      setShowSuggestions(false)
    }
  }

  const handleSuggestionClick = (movie: Movie) => {
    setQuery(movie.title)
    setShowSuggestions(false)
    onMovieSelect?.(movie)
  }

  const handleFilterChange = (newFilters: Partial<MovieFilters>) => {
    const updatedFilters = { ...filters, ...newFilters }
    setFilters(updatedFilters)

    if (query.trim()) {
      onSearch(query.trim(), updatedFilters)
    }
  }

  const clearFilters = () => {
    setFilters({})
    if (query.trim()) {
      onSearch(query.trim())
    }
  }

  const hasActiveFilters = Object.keys(filters).some(key => filters[key as keyof MovieFilters] !== undefined)

  return (
    <div ref={searchRef} className={cn('relative w-full max-w-2xl', className)}>
      {/* Search Input */}
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            placeholder={placeholder}
            className={cn(
              'w-full pl-10 pr-12 py-3 border-2 rounded-xl',
              'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
              'border-gray-300 dark:border-gray-600',
              'bg-white dark:bg-gray-800',
              'text-gray-900 dark:text-white',
              'placeholder-gray-500 dark:placeholder-gray-400'
            )}
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('')
                setSuggestions([])
                onSearch('')
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Filter Button */}
        {showFilters && (
          <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center space-x-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowFiltersPanel(!showFiltersPanel)}
              className={cn(
                'px-2',
                hasActiveFilters && 'text-blue-600 dark:text-blue-400'
              )}
            >
              <SlidersHorizontal className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Loading Indicator */}
        {loading && (
          <div className="absolute right-12 top-1/2 -translate-y-1/2">
            <LoadingSpinner size="sm" />
          </div>
        )}
      </form>

      {/* Search Suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-50 max-h-80 overflow-y-auto">
          <div className="p-2">
            {suggestions.map((movie) => (
              <button
                key={movie.id}
                onClick={() => handleSuggestionClick(movie)}
                className="w-full text-left p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center space-x-3"
              >
                <img
                  src={TMDBClient.getImageUrl(movie.poster_path, 'w92')}
                  alt={movie.title}
                  className="w-12 h-16 object-cover rounded"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.src = '/placeholder-movie.jpg'
                  }}
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 dark:text-white truncate">
                    {movie.title}
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(movie.release_date).getFullYear()} • {'★'} {movie.vote_average.toFixed(1)}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Filters Panel */}
      {showFilters && showFiltersPanel && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-50 p-4">
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">Filters</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Genre Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Genre
                </label>
                <select
                  value={filters.genre || ''}
                  onChange={(e) => handleFilterChange({ genre: e.target.value ? parseInt(e.target.value) : undefined })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">All Genres</option>
                  <option value="28">Action</option>
                  <option value="12">Adventure</option>
                  <option value="16">Animation</option>
                  <option value="35">Comedy</option>
                  <option value="80">Crime</option>
                  <option value="18">Drama</option>
                  <option value="14">Fantasy</option>
                  <option value="36">History</option>
                  <option value="27">Horror</option>
                  <option value="10402">Music</option>
                  <option value="9648">Mystery</option>
                  <option value="10749">Romance</option>
                  <option value="878">Science Fiction</option>
                  <option value="53">Thriller</option>
                  <option value="10752">War</option>
                  <option value="37">Western</option>
                </select>
              </div>

              {/* Year Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Year
                </label>
                <input
                  type="number"
                  value={filters.year || ''}
                  onChange={(e) => handleFilterChange({ year: e.target.value ? parseInt(e.target.value) : undefined })}
                  placeholder="e.g. 2023"
                  min="1900"
                  max={new Date().getFullYear()}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              {/* Rating Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Minimum Rating
                </label>
                <select
                  value={filters.rating || ''}
                  onChange={(e) => handleFilterChange({ rating: e.target.value ? parseFloat(e.target.value) : undefined })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Any Rating</option>
                  <option value="9">9+ Stars</option>
                  <option value="8">8+ Stars</option>
                  <option value="7">7+ Stars</option>
                  <option value="6">6+ Stars</option>
                  <option value="5">5+ Stars</option>
                </select>
              </div>

              {/* Sort By */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Sort By
                </label>
                <select
                  value={filters.sortBy || 'popularity'}
                  onChange={(e) => handleFilterChange({ sortBy: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="popularity">Popularity</option>
                  <option value="rating">Rating</option>
                  <option value="release_date">Release Date</option>
                  <option value="title">Title</option>
                </select>
              </div>
            </div>

            {/* Filter Actions */}
            <div className="flex justify-end space-x-2 pt-2 border-t border-gray-200 dark:border-gray-700">
              {hasActiveFilters && (
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  Clear Filters
                </Button>
              )}
              <Button size="sm" onClick={() => setShowFiltersPanel(false)}>
                Apply Filters
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}