import { YouTubeVideo, Video } from '@/types'

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3'
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY

if (!YOUTUBE_API_KEY) {
  throw new Error('YOUTUBE_API_KEY environment variable is required')
}

export class YouTubeClient {
  private static async fetchYouTube<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
    const url = new URL(`${YOUTUBE_API_BASE}${endpoint}`)
    url.searchParams.set('key', YOUTUBE_API_KEY || '')

    Object.entries(params).forEach(([key, value]) => {
      if (value) url.searchParams.set(key, value)
    })

    try {
      const response = await fetch(url.toString())

      if (!response.ok) {
        throw new Error(`YouTube API error: ${response.status} ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('YouTube API fetch error:', error)
      throw new Error('Failed to fetch data from YouTube')
    }
  }

  static async searchTrailer(movieTitle: string, year?: string): Promise<YouTubeVideo | null> {
    const searchQueries = [
      `${movieTitle} official trailer ${year || ''}`.trim(),
      `${movieTitle} trailer ${year || ''}`.trim(),
      `${movieTitle} trailer`.trim()
    ]

    for (const query of searchQueries) {
      try {
        const result = await this.searchVideo(query, 1)
        if (result.items.length > 0) {
          return result.items[0]
        }
      } catch (error) {
        console.warn(`Failed to search for: ${query}`, error)
        continue
      }
    }

    return null
  }

  private static async searchVideo(query: string, maxResults: number = 5): Promise<{ items: YouTubeVideo[] }> {
    const params = {
      q: query,
      part: 'snippet',
      maxResults: maxResults.toString(),
      type: 'video',
      videoEmbeddable: 'true',
      videoSyndicated: 'true'
    }

    const response = await this.fetchYouTube<{
      items: Array<{
        id: { videoId: string }
        snippet: {
          title: string
          description: string
          publishedAt: string
          thumbnails: {
            default: { url: string }
            medium: { url: string }
            high: { url: string }
          }
        }
      }>
    }>('/search', params)

    const videos: YouTubeVideo[] = response.items.map(item => ({
      id: item.id.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default.url,
      duration: '', // Will be populated if needed with additional API call
      viewCount: '0', // Will be populated if needed with additional API call
      publishedAt: item.snippet.publishedAt
    }))

    return { items: videos }
  }

  static async getVideoDetails(videoId: string): Promise<YouTubeVideo | null> {
    try {
      const response = await this.fetchYouTube<{
        items: Array<{
          id: string
          snippet: {
            title: string
            description: string
            publishedAt: string
            thumbnails: {
              default: { url: string }
              medium: { url: string }
              high: { url: string }
            }
          }
          contentDetails: {
            duration: string
          }
          statistics: {
            viewCount: string
          }
        }>
      }>('/videos', {
        part: 'snippet,contentDetails,statistics',
        id: videoId
      })

      if (response.items.length === 0) {
        return null
      }

      const item = response.items[0]
      return {
        id: item.id,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default.url,
        duration: item.contentDetails.duration,
        viewCount: item.statistics.viewCount,
        publishedAt: item.snippet.publishedAt
      }
    } catch (error) {
      console.error('Failed to get video details:', error)
      return null
    }
  }

  // Get trailer URL from TMDB videos first, fallback to YouTube search
  static async getTrailerUrl(movieTitle: string, year?: string, tmdbVideos?: Video[]): Promise<string | null> {
    // First try to get trailer from TMDB videos
    if (tmdbVideos && tmdbVideos.length > 0) {
      const trailer = tmdbVideos.find(video =>
        video.type === 'Trailer' &&
        video.site === 'YouTube' &&
        video.official
      )

      if (trailer) {
        return `https://www.youtube.com/watch?v=${trailer.key}`
      }

      // Fallback to any YouTube video
      const anyYouTube = tmdbVideos.find(video => video.site === 'YouTube')
      if (anyYouTube) {
        return `https://www.youtube.com/watch?v=${anyYouTube.key}`
      }
    }

    // Fallback to YouTube search
    const youtubeTrailer = await this.searchTrailer(movieTitle, year)
    if (youtubeTrailer) {
      return `https://www.youtube.com/watch?v=${youtubeTrailer.id}`
    }

    return null
  }

  // Get embed URL for iframe
  static getEmbedUrl(videoId: string): string {
    return `https://www.youtube.com/embed/${videoId}?rel=0&showinfo=0&modestbranding=1`
  }

  // Search for multiple trailers (for recommendations)
  static async searchMultipleTrailers(movieTitles: string[]): Promise<Record<string, YouTubeVideo | null>> {
    const results: Record<string, YouTubeVideo | null> = {}

    // Use Promise.allSettled to handle individual failures gracefully
    const promises = movieTitles.map(async (title) => {
      const trailer = await this.searchTrailer(title)
      results[title] = trailer
    })

    await Promise.allSettled(promises)
    return results
  }
}