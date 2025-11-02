# Disney+ Clone - AI-Powered Mood Recommendations

A modern streaming platform clone with AI-powered mood-based movie recommendations and YouTube trailer integration.

## 🌟 Features

- **AI Mood Detection**: Select your mood through quick buttons or describe it naturally
- **Smart Recommendations**: Get personalized movie suggestions based on your emotional state
- **YouTube Integration**: Watch official trailers for every movie
- **Advanced Search**: Filter by genre, year, rating, and more
- **User Profiles**: Save favorites and create watchlists
- **Responsive Design**: Works perfectly on mobile, tablet, and desktop

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd disneyplus
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```

4. **Configure your API keys in `.env.local`:**
   ```env
   # Get these from the respective services
   TMDB_API_KEY=your_tmdb_api_key
   YOUTUBE_API_KEY=your_youtube_api_key
   OPENAI_API_KEY=your_openai_api_key

   # Generate a random secret
   NEXTAUTH_SECRET=your_random_secret_key
   NEXTAUTH_URL=http://localhost:3000
   ```

5. **Set up the database**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

6. **Run the development server**
   ```bash
   npm run dev
   ```

7. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📋 Required API Keys

### 1. TMDB API (The Movie Database)
- Visit [TMDB](https://www.themoviedb.org/settings/api)
- Sign up for a free account
- Request an API key
- Add to `TMDB_API_KEY`

### 2. YouTube Data API
- Visit [Google Cloud Console](https://console.cloud.google.com/)
- Create a new project or use existing one
- Enable YouTube Data API v3
- Create credentials (API Key)
- Add to `YOUTUBE_API_KEY`

### 3. OpenAI API
- Visit [OpenAI Platform](https://platform.openai.com/)
- Sign up and create an API key
- Add to `OPENAI_API_KEY`

## 🏗️ Project Structure

```
├── src/
│   ├── app/                    # Next.js app router pages
│   │   ├── (auth)/            # Authentication pages
│   │   ├── api/               # API routes
│   │   ├── dashboard/         # Main dashboard
│   │   ├── movie/[id]/        # Movie detail pages
│   │   └── mood/              # Mood finder page
│   ├── components/            # Reusable UI components
│   │   ├── ui/               # Base UI components
│   │   ├── mood/             # Mood detection components
│   │   ├── movie/            # Movie-related components
│   │   └── layout/           # Layout components
│   ├── lib/                   # Utility libraries
│   │   ├── ai/               # AI integration
│   │   ├── tmdb/             # TMDB API client
│   │   ├── youtube/          # YouTube API client
│   │   └── utils/            # Helper functions
│   └── types/                 # TypeScript type definitions
├── prisma/                    # Database schema and migrations
└── public/                    # Static assets
```

## 🎯 Core Features

### Mood Detection
- **Quick Selection**: Choose from 6 mood categories (Happy, Relaxed, Excited, Romantic, Thoughtful, Nostalgic)
- **Natural Language**: Describe your mood in words and let AI analyze it
- **Confidence Scoring**: See how confident the AI is about your mood classification

### Recommendation Engine
- **Multi-factor Scoring**: Combines mood relevance, user preferences, popularity, and freshness
- **Personalized Explanations**: AI explains why each movie matches your mood
- **Smart Filtering**: Takes into account your viewing history and preferences

### Movie Discovery
- **Advanced Search**: Search by title, genre, year, rating, and more
- **Rich Metadata**: Complete movie information including cast, crew, and technical details
- **Trailers**: Built-in YouTube trailer player for every movie

### User Features
- **Favorites**: Save movies you love
- **Watchlists**: Create lists of movies to watch later
- **Authentication**: Secure login with Google or email/password

## 🛠️ Technology Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS
- **Database**: SQLite (development), PostgreSQL (production)
- **ORM**: Prisma
- **Authentication**: NextAuth.js
- **AI**: OpenAI GPT API
- **Movie Data**: TMDB API
- **Videos**: YouTube Data API v3
- **State Management**: Zustand

## 📦 Deployment

### Vercel (Recommended)

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Deploy**
   ```bash
   vercel
   ```

3. **Configure Environment Variables**
   - Go to Vercel dashboard
   - Your project → Settings → Environment Variables
   - Add all required API keys

### Docker Deployment

1. **Build the image**
   ```bash
   docker build -t disneyplus-clone .
   ```

2. **Run the container**
   ```bash
   docker run -p 3000:3000 --env-file .env.local disneyplus-clone
   ```

### Traditional Hosting

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Start the production server**
   ```bash
   npm start
   ```

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npx prisma studio` - Open Prisma Studio
- `npx prisma generate` - Generate Prisma Client
- `npx prisma db push` - Push schema changes to database

### Code Quality

- **TypeScript**: Full type safety throughout the application
- **ESLint**: Consistent code formatting and error detection
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Error Handling**: Comprehensive error boundaries and fallbacks

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is for educational purposes only. All movie data and content are sourced from TMDB API and used in accordance with their terms of service.

## 🆘 Troubleshooting

### Common Issues

**API Key Errors**
- Ensure all API keys are correctly set in environment variables
- Check that APIs are enabled in respective consoles
- Verify API key permissions and quotas

**Database Issues**
- Run `npx prisma generate` after schema changes
- Use `npx prisma db push` to sync schema with database
- Check database connection string

**Build Errors**
- Ensure all dependencies are installed (`npm install`)
- Check TypeScript configuration
- Verify environment variables are properly set

### Getting Help

1. Check the [Issues](../../issues) page
2. Create a new issue with detailed description
3. Include error logs and environment details

---

Built with ❤️ using Next.js, TypeScript, and modern web technologies.