import { Movie, MovieDetails, Genre, Video, MovieFilters, PaginatedResponse } from '@/types'

const TMDB_BASE_URL = 'https://api.themoviedb.org/3'
const TMDB_API_KEY = process.env.TMDB_API_KEY
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p'

if (!TMDB_API_KEY) {
  throw new Error('TMDB_API_KEY environment variable is required')
}

export class TMDBClient {
  private static async fetchTMDB<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
    const url = new URL(`${TMDB_BASE_URL}${endpoint}`)
    url.searchParams.set('api_key', TMDB_API_KEY)
    url.searchParams.set('language', 'en-US')

    Object.entries(params).forEach(([key, value]) => {
      if (value) url.searchParams.set(key, value)
    })

    try {
      const response = await fetch(url.toString())

      if (!response.ok) {
        throw new Error(`TMDB API error: ${response.status} ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('TMDB API fetch error:', error)
      throw new Error('Failed to fetch data from TMDB')
    }
  }

  static getImageUrl(path: string, size: 'w92' | 'w154' | 'w185' | 'w300' | 'w342' | 'w500' | 'w780' | 'w1280' | 'original' = 'w500'): string {
    if (!path) return '/placeholder-movie.jpg'
    return `${TMDB_IMAGE_BASE}/${size}${path}`
  }

  static async getPopularMovies(page: number = 1): Promise<PaginatedResponse<Movie>> {
    return this.fetchTMDB<PaginatedResponse<Movie>>('/movie/popular', { page: page.toString() })
  }

  static async searchMovies(query: string, filters: MovieFilters = {}, page: number = 1): Promise<PaginatedResponse<Movie>> {
    const params: Record<string, string> = {
      query,
      page: page.toString(),
      include_adult: 'false'
    }

    if (filters.genre) params.with_genres = filters.genre.toString()
    if (filters.year) params.year = filters.year.toString()
    if (filters.rating) params['vote_average.gte'] = filters.rating.toString()
    if (filters.language) params.language = filters.language
    if (filters.sortBy) params.sort_by = `${filters.sortBy}.${filters.sortOrder || 'desc'}`

    return this.fetchTMDB<PaginatedResponse<Movie>>('/search/movie', params)
  }

  static async getMovieDetails(movieId: number): Promise<MovieDetails> {
    const details = await this.fetchTMDB<MovieDetails>(`/movie/${movieId}`)
    const videos = await this.getMovieVideos(movieId)
    const similar = await this.getSimilarMovies(movieId)

    return {
      ...details,
      videos,
      similar: similar.results
    }
  }

  static async getMovieVideos(movieId: number): Promise<Video[]> {
    const response = await this.fetchTMDB<{ results: Video[] }>(`/movie/${movieId}/videos`)
    return response.results
  }

  static async getSimilarMovies(movieId: number, page: number = 1): Promise<PaginatedResponse<Movie>> {
    return this.fetchTMDB<PaginatedResponse<Movie>>(`/movie/${movieId}/similar`, { page: page.toString() })
  }

  static async getMoviesByGenre(genreId: number, page: number = 1): Promise<PaginatedResponse<Movie>> {
    return this.fetchTMDB<PaginatedResponse<Movie>>('/discover/movie', {
      with_genres: genreId.toString(),
      page: page.toString()
    })
  }

  static async getGenres(): Promise<Genre[]> {
    const response = await this.fetchTMDB<{ genres: Genre[] }>('/genre/movie/list')
    return response.genres
  }

  static async getTrendingMovies(timeWindow: 'day' | 'week' = 'day'): Promise<PaginatedResponse<Movie>> {
    return this.fetchTMDB<PaginatedResponse<Movie>>(`/trending/movie/${timeWindow}`)
  }

  static async getTopRatedMovies(page: number = 1): Promise<PaginatedResponse<Movie>> {
    return this.fetchTMDB<PaginatedResponse<Movie>>('/movie/top_rated', { page: page.toString() })
  }

  static async getUpcomingMovies(page: number = 1): Promise<PaginatedResponse<Movie>> {
    return this.fetchTMDB<PaginatedResponse<Movie>>('/movie/upcoming', { page: page.toString() })
  }

  // Helper function to get movies based on mood
  static async getMoviesByMood(mood: string, page: number = 1): Promise<PaginatedResponse<Movie>> {
    const moodGenreMap: Record<string, number[]> = {
      happy: [35, 10751, 16],      // Comedy, Family, Animation
      relaxed: [18, 99, 10749],    // Drama, Documentary, Romance
      excited: [28, 12, 53, 10752], // Action, Adventure, Thriller, War
      romantic: [10749, 18, 35],   // Romance, Drama, Comedy
      thoughtful: [18, 99, 36],    // Drama, Documentary, History
      nostalgic: [36, 10752, 18]   // History, War, Drama
    }

    const genres = moodGenreMap[mood.toLowerCase()] || []

    if (genres.length === 0) {
      return this.getPopularMovies(page)
    }

    return this.fetchTMDB<PaginatedResponse<Movie>>('/discover/movie', {
      with_genres: genres.join(','),
      page: page.toString(),
      sort_by: 'popularity.desc'
    })
  }
}