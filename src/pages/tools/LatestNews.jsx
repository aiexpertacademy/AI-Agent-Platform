import { useState, useEffect, useCallback } from 'react'
import { Newspaper, Loader2, RefreshCw, ExternalLink, Clock, Globe, MapPin, Sparkles, ChevronDown, Filter, TrendingUp, IndianRupee, Cpu, Briefcase, Trophy, Earth, Clapperboard, HeartPulse, GraduationCap, Volume2, BookOpen } from 'lucide-react'
import ToolLayout from '../../components/ToolLayout'
import { callGemini } from '../../config/gemini'

const NEWS_API_KEY = import.meta.env.VITE_NEWS_API_KEY

const topics = [
  { id: 'top', label: 'Top Stories', icon: TrendingUp, color: '#ef4444' },
  { id: 'tech', label: 'Technology', icon: Cpu, color: '#6366f1' },
  { id: 'ai', label: 'AI & ML', icon: Sparkles, color: '#8b5cf6' },
  { id: 'business', label: 'Business', icon: Briefcase, color: '#f59e0b' },
  { id: 'sports', label: 'Sports', icon: Trophy, color: '#22c55e' },
  { id: 'world', label: 'World', icon: Earth, color: '#06b6d4' },
  { id: 'india', label: 'India', icon: MapPin, color: '#f97316' },
  { id: 'finance', label: 'Finance', icon: IndianRupee, color: '#10b981' },
  { id: 'entertainment', label: 'Entertainment', icon: Clapperboard, color: '#ec4899' },
  { id: 'health', label: 'Health', icon: HeartPulse, color: '#14b8a6' },
  { id: 'science', label: 'Science', icon: GraduationCap, color: '#a855f7' },
]

const regions = [
  { id: 'both', label: 'India + World' },
  { id: 'india', label: 'India Only' },
  { id: 'world', label: 'International Only' },
]

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const now = new Date()
  const date = new Date(dateStr)
  const diff = Math.floor((now - date) / 1000)
  if (diff < 60) return 'Just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

function NewsCard({ article, index }) {
  const [expanded, setExpanded] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const topicObj = topics.find(t => t.id === article.topic)

  function speakSummary() {
    window.speechSynthesis.cancel()
    if (speaking) { setSpeaking(false); return }
    const utterance = new SpeechSynthesisUtterance(article.summary)
    utterance.lang = 'en'
    utterance.rate = 0.95
    utterance.onend = () => setSpeaking(false)
    utterance.onerror = () => setSpeaking(false)
    setSpeaking(true)
    window.speechSynthesis.speak(utterance)
  }

  return (
    <div className={`bg-gray-900 border border-gray-800 rounded-xl overflow-hidden hover:border-gray-700 transition-all group ${index === 0 ? 'md:col-span-2 md:row-span-2' : ''}`}>
      {/* Image */}
      {article.image && (
        <div className={`relative overflow-hidden bg-gray-800 ${index === 0 ? 'h-56' : 'h-40'}`}>
          <img src={article.image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={e => { e.target.style.display = 'none' }} />
          {/* Region badge */}
          <div className="absolute top-2 left-2 flex gap-1.5">
            {article.region && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm ${
                article.region === 'India' ? 'bg-orange-500/80 text-white' : 'bg-blue-500/80 text-white'
              }`}>
                {article.region === 'India' ? '🇮🇳 India' : '🌍 World'}
              </span>
            )}
            {topicObj && (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full backdrop-blur-sm bg-black/50 text-white">
                {topicObj.label}
              </span>
            )}
          </div>
        </div>
      )}

      <div className="p-4 space-y-2.5">
        {/* Source + time */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {article.source && (
              <span className="text-[11px] font-semibold text-violet-400">{article.source}</span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {article.date && (
              <span className="text-[10px] text-gray-500 flex items-center gap-1">
                <Clock className="w-3 h-3" /> {timeAgo(article.date)}
              </span>
            )}
          </div>
        </div>

        {/* Title */}
        <h3 className={`font-bold text-white leading-snug ${index === 0 ? 'text-lg' : 'text-sm'}`}>
          {article.title}
        </h3>

        {/* AI Summary */}
        <div className="bg-violet-500/5 border border-violet-500/10 rounded-lg px-3 py-2.5">
          <div className="flex items-center gap-1 mb-1">
            <Sparkles className="w-3 h-3 text-violet-400" />
            <span className="text-[10px] font-semibold text-violet-400 uppercase tracking-wider">AI Summary</span>
          </div>
          <p className={`text-xs text-gray-300 leading-relaxed ${!expanded && index !== 0 ? 'line-clamp-3' : ''}`}>
            {article.summary}
          </p>
          {article.summary?.length > 150 && index !== 0 && (
            <button onClick={() => setExpanded(v => !v)}
              className="text-[10px] text-violet-400 hover:text-violet-300 cursor-pointer mt-1">
              {expanded ? 'Show less' : 'Read more'}
            </button>
          )}
        </div>

        {/* Key points */}
        {article.keyPoints?.length > 0 && (
          <div className="space-y-1">
            {article.keyPoints.map((point, i) => (
              <div key={i} className="flex items-start gap-1.5">
                <span className="w-1 h-1 rounded-full bg-violet-400 mt-1.5 flex-shrink-0" />
                <span className="text-[11px] text-gray-400 leading-relaxed">{point}</span>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1">
          {article.url && (
            <a href={article.url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-white text-xs rounded-lg transition-colors">
              <ExternalLink className="w-3 h-3" /> Read Full
            </a>
          )}
          <button onClick={speakSummary}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
              speaking ? 'bg-violet-600/20 text-violet-400' : 'bg-gray-800 hover:bg-gray-700 text-gray-400'
            }`}>
            <Volume2 className="w-3 h-3" /> {speaking ? 'Speaking...' : 'Listen'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function LatestNews() {
  const [topic, setTopic] = useState('top')
  const [region, setRegion] = useState('both')
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [error, setError] = useState('')
  const [articleCount, setArticleCount] = useState(12)
  const [newsSource, setNewsSource] = useState('') // 'newsapi' or 'gemini'

  const topicObj = topics.find(t => t.id === topic)

  // Fetch news via NewsAPI (if key available)
  // NOTE: NewsAPI free tier blocks browser CORS — only works from localhost dev or paid plan.
  // Falls back to Gemini automatically if CORS blocks the request.
  async function fetchFromNewsAPI(topicId, regionId) {
    if (!NEWS_API_KEY) return null

    const topicQueries = {
      top: 'breaking news',
      tech: 'technology software',
      ai: 'artificial intelligence OR machine learning OR AI',
      business: 'business economy market',
      sports: 'sports cricket football',
      world: 'world news international',
      india: 'India',
      finance: 'stock market finance banking',
      entertainment: 'entertainment movies bollywood',
      health: 'health medical',
      science: 'science space research',
    }

    const q = topicQueries[topicId] || topicId
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    try {
      if (regionId === 'both') {
        // Fetch India + international in parallel using 'everything' endpoint
        const [indiaRes, worldRes] = await Promise.all([
          fetch(`https://newsapi.org/v2/everything?q=${encodeURIComponent(q + ' India')}&from=${yesterday}&sortBy=publishedAt&pageSize=8&language=en&apiKey=${NEWS_API_KEY}`),
          fetch(`https://newsapi.org/v2/everything?q=${encodeURIComponent(q)}&from=${yesterday}&sortBy=publishedAt&pageSize=8&language=en&apiKey=${NEWS_API_KEY}`),
        ])

        // Check for CORS / auth errors
        if (!indiaRes.ok && !worldRes.ok) return null

        const india = indiaRes.ok ? await indiaRes.json() : { articles: [] }
        const world = worldRes.ok ? await worldRes.json() : { articles: [] }

        if (india.status === 'error' && world.status === 'error') return null

        const combined = [
          ...(india.articles || []).map(a => ({ ...a, _region: 'India' })),
          ...(world.articles || []).filter(a =>
            // Dedupe: skip if same title already in India set
            !(india.articles || []).some(ia => ia.title === a.title)
          ).map(a => ({ ...a, _region: 'International' })),
        ]
        combined.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
        return combined.length > 0 ? combined.slice(0, 16) : null
      }

      // Single region
      const regionQuery = regionId === 'india' ? `${q} India` : q
      const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(regionQuery)}&from=${yesterday}&sortBy=publishedAt&pageSize=16&language=en&apiKey=${NEWS_API_KEY}`

      const res = await fetch(url)
      if (!res.ok) return null
      const data = await res.json()
      if (data.status !== 'ok' || !data.articles?.length) return null

      return data.articles.map(a => ({
        ...a,
        _region: regionId === 'india' ? 'India' : 'International',
      }))
    } catch {
      // CORS error or network failure — silently fall back to Gemini
      return null
    }
  }

  // Format NewsAPI articles + get AI summaries
  async function summarizeNewsAPIArticles(rawArticles) {
    const titles = rawArticles.map((a, i) => `${i + 1}. "${a.title}" — ${a.source?.name || 'Unknown'} (${a.description || ''})`).join('\n')

    const reply = await callGemini(
      `Summarize each of these news articles in exactly 3 concise sentences. Also provide 2-3 key bullet points for each.

${titles}

Return a JSON array (no markdown, no fences):
[
  {
    "index": 0,
    "summary": "3-sentence AI summary",
    "keyPoints": ["point 1", "point 2"]
  }
]`,
      { temperature: 0.3, maxTokens: 4096 }
    )
    const cleaned = reply.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
    try {
      return JSON.parse(cleaned)
    } catch {
      return []
    }
  }

  // Fetch news via Gemini (fallback / primary when no NewsAPI key)
  async function fetchFromGemini(topicId, regionId) {
    const topicLabel = topics.find(t => t.id === topicId)?.label || topicId
    const regionHint = regionId === 'india' ? 'Focus ONLY on Indian news.'
      : regionId === 'world' ? 'Focus ONLY on international/global news, NOT India.'
      : 'Include BOTH Indian AND international news. Mix them. Label each with region.'

    const now = new Date()
    const dateStr = now.toISOString().split('T')[0]

    const reply = await callGemini(
      `You are a world-class news aggregator. Generate the latest ${articleCount} real news headlines and summaries from the LAST 24 HOURS (today is ${dateStr}) about: ${topicLabel}.

${regionHint}

IMPORTANT: Use ONLY real, factual, currently trending news stories. Do NOT make up news. Include actual source names, real dates, and genuine URLs where possible.

Return a JSON array (no markdown, no code fences):
[
  {
    "title": "Exact headline of the news story",
    "summary": "3-sentence AI summary of the article explaining what happened, why it matters, and what's next",
    "keyPoints": ["key point 1", "key point 2", "key point 3"],
    "source": "News source name (e.g., Reuters, NDTV, BBC, Times of India)",
    "date": "${dateStr}T10:00:00Z",
    "region": "India" or "International",
    "topic": "${topicId}",
    "url": "https://actual-article-url-if-known or empty string",
    "image": "https://placehold.co/600x400/1a1a2e/ffffff?text=News"
  }
]

Generate exactly ${articleCount} articles. Sort by importance/recency. For Indian news include sources like NDTV, Times of India, The Hindu, Economic Times, India Today, Hindustan Times. For international news use Reuters, BBC, CNN, Al Jazeera, Bloomberg, TechCrunch, The Verge, etc.`,
      {
        systemInstruction: 'You are a factual news aggregator. Return only real news from the last 24 hours. Return valid JSON only.',
        temperature: 0.4,
        maxTokens: 8192,
      }
    )
    const cleaned = reply.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
    return JSON.parse(cleaned)
  }

  // Main fetch function
  const fetchNews = useCallback(async () => {
    setLoading(true)
    setError('')
    setArticles([])

    try {
      // Try NewsAPI first
      const newsApiArticles = await fetchFromNewsAPI(topic, region)

      if (newsApiArticles && newsApiArticles.length > 0) {
        setNewsSource('newsapi')
        // Got real articles — now get AI summaries
        const summaries = await summarizeNewsAPIArticles(newsApiArticles)
        const merged = newsApiArticles.map((a, i) => {
          const s = summaries.find(s => s.index === i)
          return {
            title: a.title,
            summary: s?.summary || a.description || 'No summary available.',
            keyPoints: s?.keyPoints || [],
            source: a.source?.name || 'Unknown',
            date: a.publishedAt,
            region: a._region || 'International',
            topic,
            url: a.url,
            image: a.urlToImage || `https://placehold.co/600x400/1a1a2e/ffffff?text=${encodeURIComponent(topics.find(t => t.id === topic)?.label || 'News')}`,
          }
        })
        setArticles(merged)
      } else {
        // Fallback to Gemini
        setNewsSource('gemini')
        const geminiArticles = await fetchFromGemini(topic, region)
        setArticles(geminiArticles)
      }
      setLastUpdated(new Date())
    } catch (err) {
      setError(`Failed to fetch news: ${err.message}`)
    }
    setLoading(false)
  }, [topic, region, articleCount])

  // Auto-fetch on mount and topic/region change
  useEffect(() => {
    fetchNews()
  }, [fetchNews])

  const indianCount = articles.filter(a => a.region === 'India').length
  const worldCount = articles.filter(a => a.region === 'International' || a.region === 'World').length

  return (
    <ToolLayout icon={Newspaper} title="Latest News" description="AI-powered news with real-time summaries from India & the world" color="#ef4444">
      <div className="space-y-4">
        {/* Topic bar */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="flex flex-wrap gap-2">
            {topics.map(t => (
              <button key={t.id} onClick={() => setTopic(t.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium cursor-pointer transition-all ${
                  topic === t.id
                    ? 'text-white shadow-lg'
                    : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-750'
                }`}
                style={topic === t.id ? { backgroundColor: t.color } : {}}>
                <t.icon className="w-3.5 h-3.5" /> {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Filters bar */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            {/* Region */}
            <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1">
              {regions.map(r => (
                <button key={r.id} onClick={() => setRegion(r.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                    region === r.id ? 'bg-violet-600 text-white' : 'text-gray-500 hover:text-white'
                  }`}>
                  {r.id === 'india' && '🇮🇳 '}{r.id === 'world' && '🌍 '}{r.id === 'both' && '🌐 '}{r.label}
                </button>
              ))}
            </div>

            {/* Count */}
            <select value={articleCount} onChange={e => setArticleCount(+e.target.value)}
              className="bg-gray-900 border border-gray-800 text-gray-400 text-xs rounded-xl px-3 py-2 focus:outline-none cursor-pointer">
              <option value={6}>6 articles</option>
              <option value={12}>12 articles</option>
              <option value={18}>18 articles</option>
              <option value={24}>24 articles</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            {/* Stats */}
            {articles.length > 0 && (
              <div className="flex items-center gap-3 text-[11px] text-gray-500">
                {indianCount > 0 && <span>🇮🇳 {indianCount} Indian</span>}
                {worldCount > 0 && <span>🌍 {worldCount} International</span>}
              </div>
            )}

            {lastUpdated && (
              <span className="text-[10px] text-gray-600 flex items-center gap-1">
                <Clock className="w-3 h-3" /> Updated {lastUpdated.toLocaleTimeString()}
              </span>
            )}

            <button onClick={fetchNews} disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 border border-gray-800 hover:bg-gray-800 text-gray-400 text-xs rounded-xl cursor-pointer transition-colors disabled:opacity-50">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="w-8 h-8 text-red-400 animate-spin mx-auto mb-3" />
              <p className="text-sm text-gray-400">Fetching latest {topicObj?.label} news...</p>
              <p className="text-xs text-gray-600 mt-1">
                {NEWS_API_KEY ? 'Fetching from NewsAPI + AI summaries' : 'Generating with Gemini AI'}
              </p>
            </div>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm">{error}</div>
        )}

        {/* Source indicator */}
        {!loading && articles.length > 0 && (
          <div className={`rounded-xl px-4 py-2.5 flex items-center gap-2 ${
            newsSource === 'newsapi'
              ? 'bg-green-500/5 border border-green-500/15'
              : 'bg-violet-500/5 border border-violet-500/15'
          }`}>
            {newsSource === 'newsapi' ? (
              <>
                <Globe className="w-4 h-4 text-green-400 flex-shrink-0" />
                <p className="text-xs text-gray-400">
                  Live news from <span className="text-green-400 font-medium">NewsAPI</span> + AI summaries by <span className="text-violet-400 font-medium">Gemini</span>
                </p>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-violet-400 flex-shrink-0" />
                <p className="text-xs text-gray-400">
                  News powered by <span className="text-violet-400 font-medium">Gemini AI</span>.
                  {NEWS_API_KEY
                    ? ' NewsAPI was blocked by CORS — using Gemini as fallback.'
                    : <> Add <code className="text-[11px] bg-gray-800 px-1.5 py-0.5 rounded text-gray-300">VITE_NEWS_API_KEY</code> to .env for real-time NewsAPI headlines.</>
                  }
                </p>
              </>
            )}
          </div>
        )}

        {/* Articles grid */}
        {!loading && articles.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {articles.map((article, i) => (
              <NewsCard key={i} article={article} index={i} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && articles.length === 0 && !error && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl flex items-center justify-center h-64">
            <div className="text-center text-gray-500">
              <Newspaper className="w-12 h-12 mx-auto mb-3 text-gray-600" />
              <p className="text-sm">No articles found</p>
              <p className="text-xs text-gray-600 mt-1">Try a different topic or region</p>
            </div>
          </div>
        )}
      </div>
    </ToolLayout>
  )
}
