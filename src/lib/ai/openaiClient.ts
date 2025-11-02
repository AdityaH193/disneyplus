import OpenAI from 'openai'
import { MoodAnalysis } from '@/types'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY environment variable is required')
}

export class OpenAIClient {
  private static readonly MOOD_ANALYSIS_PROMPT = `
Analyze the following mood description and categorize it into one of these primary moods:

- Happy/Uplifting (comedies, feel-good, adventures)
- Relaxed (light dramas, documentaries, family)
- Excited (action, thriller, high-energy)
- Romantic (romance, romantic comedies)
- Thoughtful (dramas, documentaries, indie)
- Nostalgic (classics, childhood favorites)

Return a JSON response with:
{
  "primary_mood": "category_name",
  "confidence": 0.85,
  "keywords": ["keyword1", "keyword2"],
  "explanation": "Brief explanation of why this mood matches"
}

Important guidelines:
- Map "primary_mood" to exactly one of: "happy", "relaxed", "excited", "romantic", "thoughtful", "nostalgic"
- Confidence should be between 0.0 and 1.0
- Keywords should be relevant to both the mood and movie preferences
- Keep explanation concise (under 100 characters)
- If uncertain, choose the closest match and reflect in confidence

User mood description: "{{USER_INPUT}}"
`

  private static readonly RECOMMENDATION_EXPLANATION_PROMPT = `
Given a movie and a user's mood, explain why this movie is a good match for their current emotional state.

Movie: "{{MOVIE_TITLE}}"
Overview: "{{MOVIE_OVERVIEW}}"
Mood: "{{USER_MOOD}}"

Return a JSON response with:
{
  "explanation": "Brief, personalized explanation (under 150 characters)",
  "mood_match_score": 0.85,
  "key_elements": ["element1", "element2", "element3"]
}

Guidelines:
- mood_match_score should be between 0.0 and 1.0
- key_elements should be specific aspects that match the mood
- Make explanation feel personal and relevant
- Focus on emotional connection between mood and content
`

  static async analyzeMood(userInput: string): Promise<MoodAnalysis> {
    try {
      const prompt = this.MOOD_ANALYSIS_PROMPT.replace('{{USER_INPUT}}', userInput)

      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at analyzing emotions and mapping them to entertainment preferences. Always return valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 200,
      })

      const response = completion.choices[0]?.message?.content
      if (!response) {
        throw new Error('No response from OpenAI')
      }

      // Clean and parse JSON response
      const cleanResponse = response.replace(/```json\n?|\n?```/g, '').trim()
      const analysis = JSON.parse(cleanResponse)

      // Validate and normalize the response
      return {
        primary_mood: this.normalizeMoodCategory(analysis.primary_mood),
        confidence: Math.min(1.0, Math.max(0.0, analysis.confidence || 0.5)),
        keywords: Array.isArray(analysis.keywords) ? analysis.keywords : [],
        explanation: analysis.explanation || 'Mood analyzed successfully'
      }
    } catch (error) {
      console.error('OpenAI mood analysis error:', error)

      // Fallback to simple keyword-based analysis
      return this.fallbackMoodAnalysis(userInput)
    }
  }

  static async generateRecommendationExplanation(
    movieTitle: string,
    movieOverview: string,
    userMood: string
  ): Promise<{
    explanation: string
    mood_match_score: number
    key_elements: string[]
  }> {
    try {
      const prompt = this.RECOMMENDATION_EXPLANATION_PROMPT
        .replace('{{MOVIE_TITLE}}', movieTitle)
        .replace('{{MOVIE_OVERVIEW}}', movieOverview)
        .replace('{{USER_MOOD}}', userMood)

      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at matching movies to emotions. Always return valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.5,
        max_tokens: 150,
      })

      const response = completion.choices[0]?.message?.content
      if (!response) {
        throw new Error('No response from OpenAI')
      }

      const cleanResponse = response.replace(/```json\n?|\n?```/g, '').trim()
      const explanation = JSON.parse(cleanResponse)

      return {
        explanation: explanation.explanation || 'Great match for your mood!',
        mood_match_score: Math.min(1.0, Math.max(0.0, explanation.mood_match_score || 0.7)),
        key_elements: Array.isArray(explanation.key_elements) ? explanation.key_elements : []
      }
    } catch (error) {
      console.error('OpenAI recommendation explanation error:', error)

      // Fallback explanation
      return {
        explanation: this.getFallbackExplanation(userMood),
        mood_match_score: 0.7,
        key_elements: this.getFallbackKeyElements(userMood)
      }
    }
  }

  private static normalizeMoodCategory(mood: string): MoodAnalysis['primary_mood'] {
    const moodMap: Record<string, MoodAnalysis['primary_mood']> = {
      'happy/uplifting': 'happy',
      'happy': 'happy',
      'uplifting': 'happy',
      'relaxed': 'relaxed',
      'excited': 'excited',
      'romantic': 'romantic',
      'thoughtful': 'thoughtful',
      'nostalgic': 'nostalgic'
    }

    const normalized = mood.toLowerCase().trim()
    return moodMap[normalized] || 'happy' // Default fallback
  }

  private static fallbackMoodAnalysis(userInput: string): MoodAnalysis {
    const input = userInput.toLowerCase()
    const moodKeywords = {
      happy: ['happy', 'joy', 'excited', 'cheerful', 'uplifted', 'good', 'great'],
      relaxed: ['relaxed', 'calm', 'peaceful', 'chill', 'laid back', 'easy'],
      excited: ['excited', 'thrill', 'action', 'adventure', 'energy', 'intense'],
      romantic: ['romantic', 'love', 'romance', 'dating', 'relationship'],
      thoughtful: ['thoughtful', 'deep', 'meaningful', 'inspiring', 'reflective'],
      nostalgic: ['nostalgic', 'classic', 'memories', 'childhood', 'throwback']
    }

    let detectedMood: MoodAnalysis['primary_mood'] = 'happy'
    let maxMatches = 0

    for (const [mood, keywords] of Object.entries(moodKeywords)) {
      const matches = keywords.filter(keyword => input.includes(keyword)).length
      if (matches > maxMatches) {
        maxMatches = matches
        detectedMood = mood as MoodAnalysis['primary_mood']
      }
    }

    return {
      primary_mood: detectedMood,
      confidence: maxMatches > 0 ? 0.6 : 0.3,
      keywords: input.split(' ').filter(word => word.length > 2),
      explanation: `Detected ${detectedMood} mood based on keywords`
    }
  }

  private static getFallbackExplanation(mood: string): string {
    const explanations: Record<string, string> = {
      happy: 'Perfect feel-good entertainment to lift your spirits!',
      relaxed: 'A calming choice for your peaceful state of mind.',
      excited: 'High-energy content to match your enthusiastic mood!',
      romantic: 'A romantic story perfect for your current feelings.',
      thoughtful: 'Deep, meaningful content that matches your reflective mood.',
      nostalgic: 'A classic choice that will bring back fond memories.'
    }

    return explanations[mood] || 'Great entertainment choice for your mood!'
  }

  private static getFallbackKeyElements(mood: string): string[] {
    const elements: Record<string, string[]> = {
      happy: ['uplifting story', 'positive themes', 'feel-good moments'],
      relaxed: ['gentle pacing', 'soothing narrative', 'peaceful atmosphere'],
      excited: ['action sequences', 'thrilling plot', 'high energy'],
      romantic: ['love story', 'emotional connection', 'heartwarming moments'],
      thoughtful: ['deep themes', 'character development', 'meaningful content'],
      nostalgic: ['classic appeal', 'timeless story', 'memorable moments']
    }

    return elements[mood] || ['engaging story', 'great characters', 'entertaining content']
  }
}