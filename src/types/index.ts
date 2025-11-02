// User and Authentication Types
export interface User {
  id: string
  email: string
  name?: string
  image?: string
  createdAt: Date
  updatedAt: Date
  favoriteMoods: string[]
  moodHistory: MoodHistory[]
  favorites: Favorite[]
  watchlists: Watchlist[]
}

export interface MoodHistory {
  id: string
  userId: string
  mood: string
  input: string
  createdAt: Date
  user: User
}

export interface Favorite {
  id: string
  userId: string
  movieId: number
  movieData: Movie
  createdAt: Date
}

export interface Watchlist {
  id: string
  userId: string
  movieId: number
  movieData: Movie
  createdAt: Date
}

// Movie and Content Types
export interface Movie {
  id: number
  title: string
  overview: string
  poster_path: string
  backdrop_path: string
  release_date: string
  vote_average: number
  genre_ids: number[]
  adult: boolean
  original_language: string
}

export interface MovieDetails extends Movie {
  runtime: number
  genres: Genre[]
  videos: Video[]
  similar: Movie[]
}

export interface Genre {
  id: number
  name: string
}

export interface Video {
  id: string
  iso_639_1: string
  iso_3166_1: string
  key: string
  name: string
  official: boolean
  published_at: string
  site: string
  size: number
  type: string
}

// Mood and AI Types
export type MoodCategory =
  | 'happy'
  | 'relaxed'
  | 'excited'
  | 'romantic'
  | 'thoughtful'
  | 'nostalgic'

export interface MoodAnalysis {
  primary_mood: MoodCategory
  confidence: number
  keywords: string[]
  explanation: string
}

export interface UserPreferences {
  favoriteGenres: number[]
  minRating: number
  maxRating: number
  contentRatings: string[]
  language: string
}

export interface Recommendation {
  movie: Movie
  moodScore: number
  userScore: number
  finalScore: number
  explanation: string
}

// YouTube Integration Types
export interface YouTubeVideo {
  id: string
  title: string
  description: string
  thumbnail: string
  duration: string
  viewCount: string
  publishedAt: string
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

export interface PaginatedResponse<T> {
  results: T[]
  page: number
  totalPages: number
  totalResults: number
}

// Component Props Types
export interface MovieCardProps {
  movie: Movie
  showTrailer?: boolean
  showMoodScore?: boolean
  mood?: MoodCategory
}

export interface MoodSelectorProps {
  onMoodSelect: (mood: MoodCategory | string) => void
  loading?: boolean
}

export interface TrailerModalProps {
  movie: MovieDetails
  isOpen: boolean
  onClose: () => void
}

// Search and Filter Types
export interface MovieFilters {
  genre?: number
  year?: number
  rating?: number
  language?: string
  sortBy?: 'popularity' | 'rating' | 'release_date' | 'title'
  sortOrder?: 'asc' | 'desc'
}

export interface SearchParams {
  query: string
  filters?: MovieFilters
  page?: number
}

// State Management Types
export interface AppState {
  user: User | null
  currentMood: MoodCategory | null
  recommendations: Recommendation[]
  favorites: Favorite[]
  watchlist: Watchlist[]
  loading: boolean
  error: string | null
}

export interface AppActions {
  setUser: (user: User | null) => void
  setCurrentMood: (mood: MoodCategory | null) => void
  setRecommendations: (recommendations: Recommendation[]) => void
  addToFavorites: (movie: Movie) => void
  removeFromFavorites: (movieId: number) => void
  addToWatchlist: (movie: Movie) => void
  removeFromWatchlist: (movieId: number) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearUserData: () => void
}