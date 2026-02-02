import { Users, BookOpen, MessageSquare, Star } from 'lucide-react'

/**
 * Reusable statistics grid component
 * @param {Object} stats - Stats object with total_experts, total_articles, total_research, total_consultations
 * @param {boolean} compact - Whether to use compact mode (simple text) or full mode (with icons and cards)
 * @param {string} className - Additional CSS classes
 */
function StatsGrid({ stats = {}, compact = false, className = '' }) {
  const defaultStats = {
    total_experts: 0,
    total_articles: 0,
    total_research: 0,
    total_consultations: 0,
  }

  const mergedStats = { ...defaultStats, ...stats }
  const { total_experts, total_articles, total_research, total_consultations } = mergedStats

  // Format numbers for display
  const formatValue = (value, defaultText) => {
    if (value > 0) {
      if (value >= 1000) {
        return `${(value / 1000).toFixed(1)}K+`
      }
      return `${value}+`
    }
    return defaultText
  }

  const statsData = [
    {
      icon: Users,
      value: formatValue(total_experts, '100+'),
      label: 'Experts',
      compactLabel: 'Experts',
    },
    {
      icon: BookOpen,
      value: formatValue(total_articles + total_research, '500+'),
      label: 'Articles & Research',
      compactLabel: 'Articles',
    },
    {
      icon: MessageSquare,
      value: formatValue(total_consultations, '1K+'),
      label: 'Consultations',
      compactLabel: 'Consultations',
    },
    {
      icon: Star,
      value: '98%',
      label: 'Satisfaction',
      compactLabel: 'Satisfaction',
    },
  ]

  if (compact) {
    return (
      <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto ${className}`}>
        {statsData.map((stat) => (
          <div key={stat.compactLabel} className="text-center">
            <div className="text-xl font-bold text-primary-600 dark:text-primary-400">
              {stat.value}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {stat.compactLabel}
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <section className={`grid grid-cols-2 md:grid-cols-4 gap-6 ${className}`}>
      {statsData.map((stat) => (
        <div
          key={stat.label}
          className="card p-6 text-center"
        >
          <stat.icon className="w-8 h-8 mx-auto mb-3 text-primary-600 dark:text-primary-400" />
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
        </div>
      ))}
    </section>
  )
}

export default StatsGrid
