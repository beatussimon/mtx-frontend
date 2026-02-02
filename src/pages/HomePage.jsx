import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Users, BookOpen, Briefcase, Star, TrendingUp, MessageSquare, Crown, Zap, Heart, Search, Filter } from 'lucide-react'
import { useAuthStore, tierHelpers } from '../store'
import { categoryService, articleService, professionalService, researchService, homepageService } from '../services/api'
import StatsGrid from '../components/StatsGrid'

function HomePage() {
  const navigate = useNavigate()
  const { isAuthenticated, tierInfo } = useAuthStore()
  const [categories, setCategories] = useState([])
  const [articles, setArticles] = useState([])
  const [research, setResearch] = useState([])
  const [topProfessionals, setTopProfessionals] = useState([])
  const [homepageData, setHomepageData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [stats, setStats] = useState({
    total_experts: 0,
    total_articles: 0,
    total_research: 0,
    total_consultations: 0,
  })

  const isBasic = tierHelpers.isBasic(tierInfo)
  const isPlus = tierHelpers.isPlus(tierInfo)
  const isPremium = tierHelpers.isPremium(tierInfo)
  const upgradeCTA = tierHelpers.getUpgradeCTA(tierInfo)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        // Try to fetch dynamic homepage data for authenticated users
        if (isAuthenticated) {
          try {
            const response = await homepageService.getData()
            setHomepageData(response.data)
            // Use homepage data if available
            if (response.data.categories) setCategories(response.data.categories || [])
            if (response.data.articles) setArticles(response.data.articles || [])
            if (response.data.top_professionals) setTopProfessionals(response.data.top_professionals || [])
            if (response.data.research) setResearch(response.data.research || [])
            if (response.data.statistics) setStats(response.data.statistics || {
              total_experts: 0,
              total_articles: 0,
              total_research: 0,
              total_consultations: 0,
            })
            setLoading(false)
            return
          } catch (homepageError) {
            // Continue with legacy data fetching
          }
        }

        // Legacy data fetching with fallback values
        const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))
        
        try {
          const catsRes = await categoryService.getWithProfessionals()
          setCategories((catsRes.data.results || catsRes.data || []))
        } catch (e) {
          console.warn('Failed to fetch categories:', e)
          setCategories([])
        }
        
        try {
          const artsRes = await articleService.getAll({ limit: 6 })
          setArticles((artsRes.data.results || artsRes.data || []))
        } catch (e) {
          console.warn('Failed to fetch articles:', e)
          setArticles([])
        }
        
        try {
          const profsRes = await professionalService.getAll({ limit: 4 })
          setTopProfessionals((profsRes.data.results || profsRes.data || []))
        } catch (e) {
          console.warn('Failed to fetch professionals:', e)
          setTopProfessionals([])
        }

        // Fetch research and stats for authenticated users only
        if (isAuthenticated) {
          try {
            const researchRes = await researchService.getTop()
            setResearch((researchRes.data.results || researchRes.data || []))
          } catch (e) {
            console.warn('Failed to fetch research:', e)
            setResearch([])
          }
          
          try {
            const statsRes = await homepageService.getData()
            if (statsRes.data.statistics) {
              setStats(statsRes.data.statistics)
            }
          } catch (e) {
            console.warn('Failed to fetch stats:', e)
          }
        }
      } catch (error) {
        console.error('Failed to fetch homepage data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [isAuthenticated])

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/professionals?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  const getTierButtonText = () => {
    if (!isAuthenticated) return 'Join Now'
    if (upgradeCTA) return upgradeCTA
    return 'Get Started'
  }

  const getTierButtonAction = () => {
    if (!isAuthenticated) return '/register'
    if (upgradeCTA) return '/upgrade'
    return '/professionals'
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-12"
    >
      {/* Compact Hero Section with Search Bar */}
      <section className="relative bg-gradient-to-r from-primary-50/50 to-primary-100/50 dark:from-primary-900/10 dark:to-primary-800/10 rounded-xl p-6 md:p-8">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h1
            variants={itemVariants}
            className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-3"
          >
            Welcome to
            <span className="text-primary-600 dark:text-primary-400 ml-2">MtaalamuX</span>
          </motion.h1>
          <motion.p
            variants={itemVariants}
            className="text-base text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-6"
          >
            {isAuthenticated
              ? 'Continue your learning journey with verified experts.'
              : 'Connect with verified professionals and access expert knowledge.'}
          </motion.p>

          {/* Search Bar */}
          <motion.form
            variants={itemVariants}
            onSubmit={handleSearch}
            className="max-w-xl mx-auto mb-6"
          >
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for experts, topics, or skills..."
                className="w-full pl-12 pr-4 py-3 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
              >
                Search
              </button>
            </div>
          </motion.form>

          {/* Quick Stats */}
          <motion.div variants={itemVariants}>
            <StatsGrid stats={stats} compact />
          </motion.div>

          {/* Tier indicator for authenticated users */}
          {isAuthenticated && tierInfo && (
            <motion.div
              variants={itemVariants}
              className="mt-4 flex items-center justify-center gap-3"
            >
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Your tier:
              </span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                isPremium
                  ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                  : isPlus
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
              }`}>
                {isPremium && <Crown className="w-3 h-3 mr-1" />}
                {isPlus && <Zap className="w-3 h-3 mr-1" />}
                {tierHelpers.getDisplayTier(tierInfo)}
              </span>
              {upgradeCTA && (
                <Link to="/upgrade" className="text-xs text-primary-600 dark:text-primary-400 hover:underline">
                  {upgradeCTA}
                </Link>
              )}
            </motion.div>
          )}
        </div>
      </section>

      {/* Dynamic Content for Authenticated Users */}
      {isAuthenticated && homepageData?.ongoing_consultations?.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              Your Consultations
            </h2>
            <Link to="/consultations" className="link flex items-center space-x-1">
              <span>View all</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {homepageData.ongoing_consultations.slice(0, 3).map((consultation) => (
              <Link
                key={consultation.id}
                to={`/consultations/${consultation.id}`}
                className="card p-4 hover:shadow-lg transition-all duration-300"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden">
                    {consultation.expert?.photo ? (
                      <img src={consultation.expert.photo} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-primary-100 flex items-center justify-center">
                        <Users className="w-5 h-5 text-primary-600" />
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {consultation.expert?.user?.username}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {consultation.subject}
                    </p>
                  </div>
                </div>
                <span className={`badge ${
                  consultation.status === 'completed' ? 'badge-success' :
                  consultation.status === 'in_progress' ? 'badge-warning' :
                  'badge-primary'
                }`}>
                  {consultation.status?.replace('_', ' ')}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}


      <section>
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            Browse by Category
          </h2>
          <Link to="/professionals" className="link flex items-center space-x-1">
            <span>View all</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="card p-6 h-32 animate-pulse">
                <div className="h-12 w-12 bg-gray-200 dark:bg-dark-700 rounded-lg mb-3" />
                <div className="h-4 bg-gray-200 dark:bg-dark-700 rounded w-3/4" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {categories.map((category) => (
              <Link
                key={category.id}
                to={`/professionals?category=${category.name}`}
                className="card p-6 hover:shadow-lg transition-all duration-300 group"
              >
                <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <span className="text-xl font-bold text-primary-600 dark:text-primary-400">
                    {category.initials || category.name?.charAt(0)}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                  {category.name}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {category.professional_count || 0} experts
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Top Professionals Section */}
      <section>
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            Top Experts
          </h2>
          <Link to="/professionals" className="link flex items-center space-x-1">
            <span>View all</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="card p-6 animate-pulse">
                <div className="h-24 w-24 bg-gray-200 dark:bg-dark-700 rounded-full mx-auto mb-4" />
                <div className="h-4 bg-gray-200 dark:bg-dark-700 rounded w-3/4 mx-auto mb-2" />
                <div className="h-3 bg-gray-200 dark:bg-dark-700 rounded w-1/2 mx-auto" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {topProfessionals.map((professional) => (
              <Link
                key={professional.id}
                to={`/professionals/${professional.id}`}
                className="card p-6 hover:shadow-lg transition-all duration-300 group"
              >
                <div className="text-center">
                  <div className="relative w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden ring-2 ring-primary-100 dark:ring-primary-900">
                    {professional.photo ? (
                      <img
                        src={professional.photo}
                        alt={professional.user?.username}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                        <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                          {professional.user?.username?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    {/* Verification checkmark */}
                    {professional.is_verified && (
                      <div className="absolute bottom-0 right-0 w-6 h-6 bg-white dark:bg-dark-800 rounded-full flex items-center justify-center">
                        {professional.verification_level === 'gold' ? (
                          <span className="text-yellow-500 text-sm">✓</span>
                        ) : (
                          <span className="text-green-500 text-sm">✓</span>
                        )}
                      </div>
                    )}
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                    {professional.user?.username}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                    {professional.field?.name || professional.specialization}
                  </p>
                  <div className="flex items-center justify-center space-x-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {professional.avg_rating?.toFixed(1) || '0.0'}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      ({professional.followers_count || 0} followers)
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Research Section (for authenticated users) */}
      {isAuthenticated && research.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              Top Research
            </h2>
            <Link to="/research" className="link flex items-center space-x-1">
              <span>View all</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {research.slice(0, 3).map((item) => (
              <Link
                key={item.id}
                to={`/research/${item.id}`}
                className="card overflow-hidden group"
              >
                <div className="h-48 overflow-hidden">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center">
                      <BookOpen className="w-12 h-12 text-white/50" />
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="badge-cyan">{item.category?.name}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(item.publish_date).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                    {item.abstract?.replace(/<[^>]*>/g, '').substring(0, 100)}...
                  </p>
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 dark:border-dark-700">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 rounded-full overflow-hidden">
                        {item.author?.photo ? (
                          <img
                            src={item.author.photo}
                            alt={item.author?.user?.username}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-primary-100 dark:bg-primary-900" />
                        )}
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {item.author?.user?.username}
                      </span>
                    </div>
                    <div className="flex items-center space-x-3 text-sm text-gray-500 dark:text-gray-400">
                      <span className="flex items-center space-x-1">
                        <Heart className="w-4 h-4" />
                        <span>{item.like_count || 0}</span>
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured Articles Section */}
      <section>
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            Featured Articles
          </h2>
          <Link to="/articles" className="link flex items-center space-x-1">
            <span>View all</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="card overflow-hidden animate-pulse">
                <div className="h-48 bg-gray-200 dark:bg-dark-700" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-gray-200 dark:bg-dark-700 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 dark:bg-dark-700 rounded w-full" />
                  <div className="h-3 bg-gray-200 dark:bg-dark-700 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article) => (
              <Link
                key={article.id}
                to={`/articles/${article.id}`}
                className="card overflow-hidden group"
              >
                <div className="h-48 overflow-hidden">
                  {article.image ? (
                    <img
                      src={article.image}
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                      <BookOpen className="w-12 h-12 text-white/50" />
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="badge-primary">{article.category?.name}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(article.publish_date).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                    {article.title}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                    {article.content?.replace(/<[^>]*>/g, '').substring(0, 100)}...
                  </p>
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 dark:border-dark-700">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 rounded-full overflow-hidden">
                        {article.author?.photo ? (
                          <img
                            src={article.author.photo}
                            alt={article.author?.user?.username}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-primary-100 dark:bg-primary-900" />
                        )}
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {article.author?.user?.username}
                      </span>
                      {article.author?.is_verified && (
                        <span className="text-green-500 text-xs">✓</span>
                      )}
                    </div>
                    <div className="flex items-center space-x-3 text-sm text-gray-500 dark:text-gray-400">
                      <span className="flex items-center space-x-1">
                        <Heart className="w-4 h-4" />
                        <span>{article.like_count || 0}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <TrendingUp className="w-4 h-4" />
                        <span>{article.views || 0}</span>
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* CTA Section */}
      <section className="card p-8 md:p-12 bg-gradient-to-r from-primary-600 to-primary-800 rounded-2xl">
        <div className="text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            {isAuthenticated ? 'Ready to Consult?' : 'Ready to Get Started?'}
          </h2>
          <p className="text-primary-100 mb-8 max-w-xl mx-auto">
            {isAuthenticated
              ? 'Browse our verified experts and start your consultation journey today.'
              : 'Join thousands of professionals and clients on MtaalamuX. Create your profile, connect with experts, and get answers.'}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {isAuthenticated ? (
              <Link to="/professionals" className="btn bg-white text-primary-600 hover:bg-primary-50 px-8 py-3">
                Browse Experts
              </Link>
            ) : (
              <>
                <Link to="/register" className="btn bg-white text-primary-600 hover:bg-primary-50 px-8 py-3">
                  Create Free Account
                </Link>
                <Link to="/faq" className="btn border-2 border-white text-white hover:bg-white/10 px-8 py-3">
                  Learn More
                </Link>
              </>
            )}
          </div>
        </div>
      </section>
    </motion.div>
  )
}

export default HomePage
