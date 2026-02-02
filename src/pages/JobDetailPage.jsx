import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Briefcase, MapPin, Clock, DollarSign, ArrowLeft, FileText, Download } from 'lucide-react'
import { jobService } from '../services/api'
import { useAuthStore } from '../store'

function JobDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAuthStore()
  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState(false)
  const [applicationSubmitted, setApplicationSubmitted] = useState(false)

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const response = await jobService.getById(id)
        setJob(response.data)
      } catch (error) {
        console.error('Failed to fetch job:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchJob()
  }, [id])

  const handleApply = async () => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }

    setApplying(true)
    try {
      // Here you would implement the application logic
      // For now, just show success message
      setApplicationSubmitted(true)
    } catch (error) {
      console.error('Failed to apply:', error)
    } finally {
      setApplying(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    )
  }

  if (!job) {
    return <div className="text-center py-12">Job not found</div>
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto">
      <button
        onClick={() => navigate('/jobs')}
        className="flex items-center space-x-2 text-primary-600 hover:text-primary-700 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Jobs</span>
      </button>

      <div className="card p-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{job.title}</h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center space-x-1">
                <MapPin className="w-4 h-4" />
                <span>Remote</span>
              </span>
              <span className="flex items-center space-x-1">
                <DollarSign className="w-4 h-4" />
                <span>{job.budget ? `$${job.budget}` : 'Negotiable'}</span>
              </span>
              <span className="flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span>Posted {new Date(job.created_at).toLocaleDateString()}</span>
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className={`badge ${job.status === 'open' ? 'badge-success' : 'badge-gray'}`}>
              {job.status}
            </span>
          </div>
        </div>

        <div className="prose dark:prose-invert max-w-none mb-8">
          <h2 className="text-xl font-semibold mb-4">Job Description</h2>
          <p className="whitespace-pre-wrap">{job.description}</p>
        </div>

        {job.professional && (
          <div className="bg-gray-50 dark:bg-dark-700 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Posted by</h3>
            <p className="text-gray-600 dark:text-gray-300">{job.professional.user.username}</p>
            {job.professional.field && (
              <p className="text-sm text-gray-500">{job.professional.field.name}</p>
            )}
          </div>
        )}

        {job.documents && job.documents.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Attachments</h3>
            <div className="space-y-2">
              {job.documents.map((doc, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-dark-700 rounded-lg">
                  <FileText className="w-5 h-5 text-gray-500" />
                  <span className="flex-1 text-gray-700 dark:text-gray-300">{doc.description || 'Document'}</span>
                  <a
                    href={doc.document}
                    download
                    className="text-primary-600 hover:text-primary-700"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-4">
          {job.status === 'open' && !applicationSubmitted && (
            <button
              onClick={handleApply}
              disabled={applying}
              className="btn-primary flex-1"
            >
              {applying ? 'Applying...' : 'Apply for this Job'}
            </button>
          )}
          {applicationSubmitted && (
            <div className="flex-1 p-4 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg text-center">
              Application submitted successfully!
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default JobDetailPage
