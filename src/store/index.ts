import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { AppState, AppActions, User, MoodCategory, Recommendation, Favorite, Watchlist, Movie } from '@/types'

interface AppStore extends AppState, AppActions {}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      currentMood: null,
      recommendations: [],
      favorites: [],
      watchlist: [],
      loading: false,
      error: null,

      // Actions
      setUser: (user: User | null) => {
        set({ user })
      },

      setCurrentMood: (mood: MoodCategory | null) => {
        set({ currentMood: mood })
      },

      setRecommendations: (recommendations: Recommendation[]) => {
        set({ recommendations })
      },

      addToFavorites: (movie: Movie) => {
        const { favorites } = get()
        const exists = favorites.some(fav => fav.movieId === movie.id)

        if (!exists) {
          const newFavorite: Favorite = {
            id: `fav_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            userId: get().user?.id || 'guest',
            movieId: movie.id,
            movieData: movie,
            createdAt: new Date()
          }
          set({ favorites: [...favorites, newFavorite] })
        }
      },

      removeFromFavorites: (movieId: number) => {
        const { favorites } = get()
        set({ favorites: favorites.filter(fav => fav.movieId !== movieId) })
      },

      addToWatchlist: (movie: Movie) => {
        const { watchlist } = get()
        const exists = watchlist.some(item => item.movieId === movie.id)

        if (!exists) {
          const newWatchlistItem: Watchlist = {
            id: `wl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            userId: get().user?.id || 'guest',
            movieId: movie.id,
            movieData: movie,
            createdAt: new Date()
          }
          set({ watchlist: [...watchlist, newWatchlistItem] })
        }
      },

      removeFromWatchlist: (movieId: number) => {
        const { watchlist } = get()
        set({ watchlist: watchlist.filter(item => item.movieId !== movieId) })
      },

      setLoading: (loading: boolean) => {
        set({ loading })
      },

      setError: (error: string | null) => {
        set({ error })
      },

      // Additional computed actions
      isFavorite: (movieId: number) => {
        const { favorites } = get()
        return favorites.some(fav => fav.movieId === movieId)
      },

      isInWatchlist: (movieId: number) => {
        const { watchlist } = get()
        return watchlist.some(item => item.movieId === movieId)
      },

      getFavoriteMovies: () => {
        const { favorites } = get()
        return favorites.map(fav => fav.movieData)
      },

      getWatchlistMovies: () => {
        const { watchlist } = get()
        return watchlist.map(item => item.movieData)
      },

      clearUserData: () => {
        set({
          favorites: [],
          watchlist: [],
          currentMood: null,
          recommendations: []
        })
      },

      // Utility actions
      resetError: () => {
        set({ error: null })
      },

      addRecommendations: (newRecommendations: Recommendation[]) => {
        const { recommendations } = get()
        // Avoid duplicates
        const existingIds = new Set(recommendations.map(r => r.movie.id))
        const uniqueNew = newRecommendations.filter(r => !existingIds.has(r.movie.id))
        set({ recommendations: [...recommendations, ...uniqueNew] })
      },

      updateRecommendationScore: (movieId: number, newScore: number) => {
        const { recommendations } = get()
        const updated = recommendations.map(rec =>
          rec.movie.id === movieId ? { ...rec, finalScore: newScore } : rec
        )
        set({ recommendations: updated })
      }
    }),
    {
      name: 'disneyplus-store',
      storage: createJSONStorage(() => {
        if (typeof window === 'undefined') {
          return {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {}
          }
        }
        return localStorage
      }),
      partialize: (state) => ({
        // Only persist these fields to localStorage
        favorites: state.favorites,
        watchlist: state.watchlist,
        currentMood: state.currentMood,
        // Don't persist user, recommendations, loading, error
      })
    }
  )
)

// Selectors for specific state slices
export const useUser = () => useAppStore((state) => state.user)
export const useCurrentMood = () => useAppStore((state) => state.currentMood)
export const useRecommendations = () => useAppStore((state) => state.recommendations)
export const useFavorites = () => useAppStore((state) => state.favorites)
export const useWatchlist = () => useAppStore((state) => state.watchlist)
export const useLoading = () => useAppStore((state) => state.loading)
export const useError = () => useAppStore((state) => state.error)

// Action selectors
export const useUserActions = () => useAppStore((state) => ({
  setUser: state.setUser,
  clearUserData: state.clearUserData
}))

export const useMoodActions = () => useAppStore((state) => ({
  setCurrentMood: state.setCurrentMood,
  setRecommendations: state.setRecommendations,
  addRecommendations: state.addRecommendations,
  updateRecommendationScore: state.updateRecommendationScore
}))

export const useFavoriteActions = () => useAppStore((state) => ({
  addToFavorites: state.addToFavorites,
  removeFromFavorites: state.removeFromFavorites,
  isFavorite: state.isFavorite,
  getFavoriteMovies: state.getFavoriteMovies
}))

export const useWatchlistActions = () => useAppStore((state) => ({
  addToWatchlist: state.addToWatchlist,
  removeFromWatchlist: state.removeFromWatchlist,
  isInWatchlist: state.isInWatchlist,
  getWatchlistMovies: state.getWatchlistMovies
}))

export const useAppActions = () => useAppStore((state) => ({
  setLoading: state.setLoading,
  setError: state.setError,
  resetError: state.resetError
}))