import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Star, Eye, Calendar, User, MessageSquare, Share2, AlertCircle, Lock, Crown } from 'lucide-react'
import { articleService } from '../services/api'
import { useAuthStore, tierHelpers } from '../store'

function ArticleDetailPage() {
  const { id } = useParams()
  const { isAuthenticated, tierInfo } = useAuthStore()
  const [article, setArticle] = useState(null)
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [newComment, setNewComment] = useState('')
  const [commentSubmitting, setCommentSubmitting] = useState(false)
  const [commentsError, setCommentsError] = useState(null)

  // Get user's tier from tierInfo
  const userTier = tierInfo?.tier || 'basic'
  const isBasicUser = userTier === 'basic'
  const canAccessFullContent = tierHelpers.isPlus(tierInfo) || tierHelpers.isPremium(tierInfo)

  const fetchData = useCallback(async () => {
    setError(null)
    setCommentsError(null)
    try {
      // Fetch article with tier-aware content
      const articleRes = await articleService.getById(id)
      setArticle(articleRes.data)
      
      // Try to fetch comments (non-blocking - may fail for unauthenticated)
      try {
        const commentsRes = await articleService.getComments(id)
        setComments(commentsRes.data.results || commentsRes.data)
      } catch (commentErr) {
        console.warn('Comments unavailable:', commentErr)
        setCommentsError('Comments could not be loaded')
        // Don't fail the whole page for comments
      }
    } catch (err) {
      console.error('Failed to fetch article:', err)
      if (err.response?.status === 404) {
        setError('Article not found')
      } else if (err.response?.status === 500) {
        setError('Server error. Please try again later.')
      } else {
        setError('Failed to load article. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleLike = async () => {
    if (!isAuthenticated) {
      alert('Please log in to like articles')
      return
    }
    try {
      await articleService.like(id)
      setArticle({ ...article, like_count: (article.like_count || 0) + 1, is_liked: true })
    } catch (err) {
      console.error('Failed to like:', err)
      if (err.response?.status === 401) {
        alert('Please log in to like articles')
      }
    }
  }

  const handleComment = async (e) => {
    e.preventDefault()
    if (!newComment.trim() || commentSubmitting) return
    
    setCommentSubmitting(true)
    try {
      await articleService.createComment(id, { content: newComment })
      setNewComment('')
      // Refresh comments
      try {
        const commentsRes = await articleService.getComments(id)
        setComments(commentsRes.data.results || commentsRes.data)
      } catch (commentErr) {
        console.warn('Failed to refresh comments:', commentErr)
      }
    } catch (err) {
      console.error('Failed to comment:', err)
      if (err.response?.status === 401) {
        alert('Please log in to post comments')
      } else {
        alert('Failed to post comment. Please try again.')
      }
    } finally {
      setCommentSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Oops!</h2>
        <p className="text-gray-600 dark:text-gray-300 text-center max-w-md">{error}</p>
      </div>
    )
  }

  if (!article) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <AlertCircle className="w-16 h-16 text-gray-400 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Not Found</h2>
        <p className="text-gray-600 dark:text-gray-300">This article does not exist or has been removed.</p>
      </div>
    )
  }

  // Render content based on tier
  const renderContent = () => {
    if (canAccessFullContent || !article.is_blurred) {
      return (
        <div 
          className="prose dark:prose-invert max-w-none mt-8" 
          dangerouslySetInnerHTML={{ __html: article.content_full || article.content }} 
        />
      )
    }

    // Basic user - show preview with blur
    return (
      <div className="relative">
        <div 
          className="prose dark:prose-invert max-w-none mt-8 blur-sm select-none pointer-events-none"
          dangerouslySetInnerHTML={{ __html: article.content }} 
        />
        {/* Blur overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/80 to-white dark:via-dark-900/80 dark:to-dark-900" />
        {/* Upgrade CTA */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center p-6 bg-white dark:bg-dark-800 rounded-2xl shadow-xl border border-gray-200 dark:border-dark-700 max-w-md mx-4">
          <Crown className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Upgrade to Plus or Premium
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Get full access to this article and unlock premium features.
          </p>
          <Link 
            to="/upgrade" 
            className="inline-flex items-center justify-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
          >
            <Crown className="w-5 h-5 mr-2" />
            Upgrade Now
          </Link>
        </div>
      </div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto">
      <article>
        {article.image && (
          <div className="h-64 md:h-96 rounded-2xl overflow-hidden mb-8">
            <img src={article.image} alt={article.title} className="w-full h-full object-cover" />
          </div>
        )}
        
        <div className="flex items-center space-x-4 mb-4">
          <span className="badge-primary">{article.category?.name}</span>
          <span className="text-sm text-gray-500">
            {new Date(article.publish_date).toLocaleDateString()}
          </span>
          {isBasicUser && article.is_blurred && (
            <span className="badge-yellow">
              <Lock className="w-3 h-3 mr-1" />
              Basic Tier
            </span>
          )}
        </div>
        
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
          {article.title}
        </h1>
        
        <div className="flex items-center justify-between py-4 border-y border-gray-200 dark:border-dark-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full overflow-hidden">
              {article.author?.photo ? (
                <img src={article.author.photo} alt={article.author?.user?.username} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                  <span className="text-primary-600 dark:text-primary-400 font-medium">
                    {article.author?.user?.username?.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">{article.author?.user?.username}</p>
              <p className="text-sm text-gray-500">{article.author?.field?.name}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <button 
              onClick={handleLike} 
              className={`flex items-center space-x-1 ${article.is_liked ? 'text-primary-600' : 'text-gray-500'}`}
            >
              <Star className={`w-5 h-5 ${article.is_liked ? 'fill-current' : ''}`} />
              <span>{article.like_count || 0}</span>
            </button>
            <button className="flex items-center space-x-1 text-gray-500">
              <Eye className="w-5 h-5" />
              <span>{article.views || 0}</span>
            </button>
            <button className="flex items-center space-x-1 text-gray-500">
              <Share2 className="w-5 h-5" />
              <span>{article.shares || 0}</span>
            </button>
          </div>
        </div>
        
        {renderContent()}
      </article>
      
      <section className="mt-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
          <MessageSquare className="w-6 h-6 mr-2" />
          Comments ({comments.length})
        </h2>
        
        {commentsError && (
          <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p className="text-yellow-700 dark:text-yellow-300 text-sm">{commentsError}</p>
          </div>
        )}
        
        {isAuthenticated ? (
          <form onSubmit={handleComment} className="mb-8">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              className="input h-24 resize-none"
              disabled={commentSubmitting}
            />
            <button 
              type="submit" 
              className="btn-primary mt-2"
              disabled={commentSubmitting || !newComment.trim()}
            >
              {commentSubmitting ? 'Posting...' : 'Post Comment'}
            </button>
          </form>
        ) : (
          <div className="mb-8 p-4 bg-gray-50 dark:bg-dark-700 rounded-lg">
            <p className="text-gray-600 dark:text-gray-300">
              <Link to="/login" className="text-primary-600 hover:underline">Log in</Link> or{' '}
              <Link to="/register" className="text-primary-600 hover:underline">create an account</Link> to post comments.
            </p>
          </div>
        )}
        
        <div className="space-y-6">
          {comments.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">No comments yet. Be the first to comment!</p>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="card p-4">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                    <span className="text-primary-600 dark:text-primary-400 text-sm font-medium">
                      {comment.user?.username?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-900 dark:text-white">{comment.user?.username}</span>
                      <span className="text-sm text-gray-500">{new Date(comment.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 mt-1">{comment.content}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </motion.div>
  )
}

export default ArticleDetailPage
