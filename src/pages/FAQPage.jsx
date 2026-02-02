import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ChevronUp, HelpCircle, AlertCircle, RefreshCw } from 'lucide-react'
import { faqService } from '../services/api'

function FAQPage() {
  const [allFaqs, setAllFaqs] = useState([])
  const [categories, setCategories] = useState(['general', 'verification', 'tiers', 'payments'])
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [openIndex, setOpenIndex] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch all FAQs once on mount
  useEffect(() => {
    const fetchFaqs = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await faqService.getAll()
        
        // Handle different response formats (array, paginated response, or object with results)
        let faqsData = response.data
        if (Array.isArray(faqsData)) {
          setAllFaqs(faqsData)
        } else if (faqsData && Array.isArray(faqsData.results)) {
          // Handle paginated response
          setAllFaqs(faqsData.results)
          faqsData = faqsData.results
        } else {
          console.error('Unexpected response format:', response.data)
          setAllFaqs([])
          faqsData = []
        }
        
        // Extract unique categories from database and merge with common categories
        const commonCategories = ['general', 'verification', 'tiers', 'payments']
        if (faqsData.length > 0) {
          const dbCategories = [...new Set(faqsData.map(faq => faq.category))]
          // Merge common categories with database categories, avoiding duplicates
          const allCategories = [...new Set([...commonCategories, ...dbCategories])]
          setCategories(allCategories)
        }
      } catch (err) {
        console.error('Error fetching FAQs:', err)
        setError('Failed to load FAQs. Please try again.')
        setAllFaqs([])
      } finally {
        setLoading(false)
      }
    }
    fetchFaqs()
  }, [])

  const handleRetry = () => {
    setLoading(true)
    setError(null)
    const fetchFaqs = async () => {
      try {
        const response = await faqService.getAll()
        let faqsData = response.data
        if (Array.isArray(faqsData)) {
          setAllFaqs(faqsData)
        } else if (faqsData && Array.isArray(faqsData.results)) {
          setAllFaqs(faqsData.results)
          faqsData = faqsData.results
        } else {
          setAllFaqs([])
          faqsData = []
        }
        
        const commonCategories = ['general', 'verification', 'tiers', 'payments']
        if (faqsData.length > 0) {
          const dbCategories = [...new Set(faqsData.map(faq => faq.category))]
          const allCategories = [...new Set([...commonCategories, ...dbCategories])]
          setCategories(allCategories)
        }
      } catch (err) {
        console.error('Error fetching FAQs:', err)
        setError('Failed to load FAQs. Please try again.')
        setAllFaqs([])
      } finally {
        setLoading(false)
      }
    }
    fetchFaqs()
  }

  // Filter FAQs based on selected category (local filtering)
  const filteredFaqs = selectedCategory === 'all' 
    ? allFaqs 
    : allFaqs.filter(faq => faq.category === selectedCategory)

  // Reset open index when category changes
  useEffect(() => {
    setOpenIndex(null)
  }, [selectedCategory])

  if (loading) {
    return (
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        className="max-w-3xl mx-auto"
      >
        <div className="text-center mb-12">
          <HelpCircle className="w-16 h-16 mx-auto text-primary-600 dark:text-primary-400 mb-4 animate-pulse" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Frequently Asked Questions</h1>
          <p className="text-gray-500 dark:text-gray-400">Loading FAQs...</p>
        </div>

        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card overflow-hidden animate-pulse">
              <div className="px-6 py-4 flex items-center justify-between">
                <div className="h-6 bg-gray-200 dark:bg-dark-600 rounded w-3/4"></div>
                <div className="w-5 h-5 bg-gray-200 dark:bg-dark-600 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    )
  }

  if (error) {
    return (
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        className="max-w-3xl mx-auto"
      >
        <div className="text-center mb-12">
          <HelpCircle className="w-16 h-16 mx-auto text-primary-600 dark:text-primary-400 mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Frequently Asked Questions</h1>
          <p className="text-gray-500 dark:text-gray-400">Find answers to common questions about MtaalamuX</p>
        </div>

        <div className="card p-8 text-center">
          <AlertCircle className="w-12 h-12 mx-auto text-red-500 mb-4" />
          <p className="text-gray-600 dark:text-gray-300 mb-4">{error}</p>
          <button 
            onClick={handleRetry}
            className="btn-primary inline-flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-3xl mx-auto">
      <div className="text-center mb-12">
        <HelpCircle className="w-16 h-16 mx-auto text-primary-600 dark:text-primary-400 mb-4" />
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Frequently Asked Questions</h1>
        <p className="text-gray-500 dark:text-gray-400">Find answers to common questions about MtaalamuX</p>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap justify-center gap-2 mb-8 sticky top-4 z-10 bg-white/80 dark:bg-dark-900/80 backdrop-blur-sm py-2">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            selectedCategory === 'all'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 dark:bg-dark-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-dark-600'
          }`}
        >
          All
        </button>
        {categories.map(category => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors capitalize ${
              selectedCategory === category
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 dark:bg-dark-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-dark-600'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedCategory}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {filteredFaqs.length > 0 ? (
              filteredFaqs.map((faq, index) => (
                <motion.div
                  key={faq.id || index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="card overflow-hidden"
                >
                  <button
                    onClick={() => setOpenIndex(openIndex === index ? null : index)}
                    className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors"
                  >
                    <span className="font-semibold text-gray-900 dark:text-white">{faq.question}</span>
                    {openIndex === index ? (
                      <ChevronUp className="w-5 h-5 text-gray-500 flex-shrink-0 ml-2" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0 ml-2" />
                    )}
                  </button>
                  <AnimatePresence>
                    {openIndex === index && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-gray-100 dark:border-dark-700"
                      >
                        <p className="px-6 py-4 text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{faq.answer}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400">No FAQs available in this category.</p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {allFaqs.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">No FAQs available at the moment.</p>
        </div>
      )}

      <div className="mt-12 text-center">
        <p className="text-gray-500 dark:text-gray-400 mb-4">Still have questions?</p>
        <a href="/feedback" className="btn-primary">Contact Us</a>
      </div>
    </motion.div>
  )
}

export default FAQPage
