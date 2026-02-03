import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Calendar, Clock, ArrowLeft, Check, X, AlertCircle, User, Loader, Shield } from 'lucide-react'
import { professionalService, availabilitySlotService, consultationService } from '../services/api'
import { useAuthStore } from '../store'
import { VerificationBadge } from '../components/VerificationBadge'

function ConsultBookingPage() {
  const { expertId } = useParams()
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAuthStore()
  
  const [expert, setExpert] = useState(null)
  const [slots, setSlots] = useState([])
  const [loading, setLoading] = useState(true)
  const [bookingLoading, setBookingLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [isOwnProfile, setIsOwnProfile] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    fetchData()
  }, [expertId, isAuthenticated])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Fetch expert details
      const expertResponse = await professionalService.getById(expertId)
      setExpert(expertResponse.data)
      
      // Check if user is viewing their own profile
      if (user && expertResponse.data.user && user.id === expertResponse.data.user.id) {
        setIsOwnProfile(true)
        setError('You cannot book a consultation with yourself.')
        setLoading(false)
        return
      }
      
      // Fetch available slots
      const slotsResponse = await availabilitySlotService.getAvailable(expertId)
      setSlots(slotsResponse.data)
    } catch (error) {
      console.error('Failed to fetch data:', error)
      setError('Failed to load expert or availability information.')
    } finally {
      setLoading(false)
    }
  }

  const handleBookSlot = async (slot) => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    
    // Double-check user can't book themselves
    if (isOwnProfile) {
      setError('You cannot book a consultation with yourself.')
      return
    }

    try {
      setBookingLoading(true)
      setError(null)
      setSelectedSlot(slot.id)
      
      // Create consultation with the slot
      const response = await consultationService.create({
        expert_id: parseInt(expertId),
        availability_id: slot.id,
        title: `Consultation with ${expert?.user?.username}`,
        description: 'Consultation booked via availability slot.'
      })
      
      setSuccess({
        message: 'Consultation booked successfully! You can now message the expert.',
        consultationId: response.data.id
      })
      
      // Refresh slots to show updated status
      await fetchData()
    } catch (error) {
      console.error('Failed to book slot:', error)
      const errorMessage = error.response?.data?.error || 
                           error.response?.data?.detail || 
                           error.response?.data?.expert_id?.[0] ||
                           error.response?.data?.availability_id?.[0] ||
                           'Failed to book consultation. Please try again.'
      setError(errorMessage)
    } finally {
      setBookingLoading(false)
      setSelectedSlot(null)
    }
  }

  const formatDateTime = (dateTimeString) => {
    const date = new Date(dateTimeString)
    return {
      date: date.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' }),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  }

  const getDuration = (startTime, endTime) => {
    const start = new Date(startTime)
    const end = new Date(endTime)
    const durationMs = end - start
    const durationMinutes = Math.round(durationMs / 60000)
    
    if (durationMinutes < 60) {
      return `${durationMinutes} min`
    }
    const hours = Math.floor(durationMinutes / 60)
    const mins = durationMinutes % 60
    if (mins === 0) {
      return `${hours} hr`
    }
    return `${hours} hr ${mins} min`
  }

  // Group slots by date
  const groupedSlots = slots.reduce((acc, slot) => {
    const date = new Date(slot.start_time).toLocaleDateString()
    if (!acc[date]) {
      acc[date] = []
    }
    acc[date].push(slot)
    return acc
  }, {})

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader className="w-10 h-10 text-primary-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Loading availability...</p>
        </div>
      </div>
    )
  }

  if (!expert) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Expert Not Found
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mb-4">
          The expert you're looking for doesn't exist.
        </p>
        <button
          onClick={() => navigate(-1)}
          className="btn-primary"
        >
          Go Back
        </button>
      </div>
    )
  }

  // Show message if user is viewing their own profile
  if (isOwnProfile) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto px-4 py-8"
      >
        <div className="flex items-center mb-8">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg mr-4"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Book Consultation
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Select an available time slot
            </p>
          </div>
        </div>
        
        <div className="card p-8 text-center bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
          <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Cannot Book Own Profile
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            You cannot book a consultation with yourself. This feature is for booking time with other experts.
          </p>
          <button
            onClick={() => navigate(-1)}
            className="btn-primary"
          >
            Go Back
          </button>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto px-4 py-8"
    >

      {/* Header */}
      <div className="flex items-center mb-8">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg mr-4"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Book Consultation
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Select an available time slot with {expert.user?.username}
          </p>
        </div>
      </div>

      {/* Expert Info Card */}
      <div className="card p-6 mb-8">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center overflow-hidden">
            {expert.photo ? (
              <img 
                src={expert.photo} 
                alt={expert.user?.username}
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-8 h-8 text-primary-600 dark:text-primary-400" />
            )}
          </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {expert.user?.username}
              </h2>
              <p className="text-gray-500 dark:text-gray-400">
                {expert.field?.name || 'General'} {expert.subfield && `• ${expert.subfield}`}
              </p>
              {expert.verification_level && (
                <span className="inline-flex items-center">
                  <VerificationBadge type={expert.verification_level} />
                </span>
              )}
            </div>
        </div>
        {expert.bio && (
          <p className="mt-4 text-gray-600 dark:text-gray-300 line-clamp-2">
            {expert.bio}
          </p>
        )}
      </div>

      {/* Success Message */}
      {success && (
        <div className="card p-6 mb-8 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
          <div className="flex items-center space-x-3 mb-4">
            <Check className="w-6 h-6 text-green-600 dark:text-green-400" />
            <h3 className="text-lg font-semibold text-green-800 dark:text-green-300">
              Booking Successful!
            </h3>
          </div>
          <p className="text-green-700 dark:text-green-400 mb-4">
            {success.message}
          </p>
          <div className="flex space-x-3">
            <button
              onClick={() => navigate(`/messages?expert_id=${expertId}`)}
              className="btn-primary"
            >
              Go to Messages
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="btn-secondary"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="card p-4 mb-6 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
          <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* Availability Section */}
      {!success && (
        <>
          <div className="flex items-center space-x-2 mb-4">
            <Calendar className="w-5 h-5 text-primary-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Available Time Slots
            </h3>
          </div>

          {slots.length === 0 ? (
            <div className="card p-8 text-center">
              <Calendar className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No Available Slots
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                This expert hasn't scheduled any available time slots yet.
                Please check back later or contact them directly.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedSlots).map(([date, dateSlots]) => (
                <div key={date}>
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wide">
                    {date}
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {dateSlots.map((slot) => {
                      const { date: slotDate, time: slotTime } = formatDateTime(slot.start_time)
                      const isSelected = selectedSlot === slot.id
                      const isBooking = bookingLoading && isSelected

                      return (
                        <button
                          key={slot.id}
                          onClick={() => handleBookSlot(slot)}
                          disabled={bookingLoading || slot.is_booked}
                          className={`card p-4 text-left transition-all ${
                            slot.is_booked || slot.is_expired
                              ? 'opacity-50 cursor-not-allowed bg-gray-50 dark:bg-dark-700'
                              : 'hover:border-primary-500 dark:hover:border-primary-400 hover:shadow-md'
                          } ${
                            isSelected ? 'border-primary-500 ring-2 ring-primary-500' : ''
                          }`}
                        >
                          <div className="flex items-center space-x-2 mb-2">
                            <Clock className={`w-4 h-4 ${
                              slot.is_booked || slot.is_expired
                                ? 'text-gray-400'
                                : 'text-primary-500'
                            }`} />
                            <span className={`font-medium ${
                              slot.is_booked || slot.is_expired
                                ? 'text-gray-400'
                                : 'text-gray-900 dark:text-white'
                            }`}>
                              {slotTime}
                            </span>
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {getDuration(slot.start_time, slot.end_time)}
                          </div>
                          {slot.is_booked || slot.is_expired ? (
                            <div className="flex items-center space-x-1 mt-2 text-xs text-gray-400">
                              <X className="w-3 h-3" />
                              <span>Unavailable</span>
                            </div>
                          ) : isBooking ? (
                            <div className="flex items-center space-x-1 mt-2 text-xs text-primary-500">
                              <Loader className="w-3 h-3 animate-spin" />
                              <span>Booking...</span>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-1 mt-2 text-xs text-green-500">
                              <Check className="w-3 h-3" />
                              <span>Available</span>
                            </div>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Help Text */}
      {!success && slots.length > 0 && (
        <div className="mt-8 p-4 bg-gray-50 dark:bg-dark-700 rounded-lg">
          <h4 className="font-medium text-gray-900 dark:text-white mb-2">
            How booking works:
          </h4>
          <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
            <li className="flex items-center space-x-2">
              <span className="w-1.5 h-1.5 bg-primary-500 rounded-full" />
              <span>Select an available time slot above</span>
            </li>
            <li className="flex items-center space-x-2">
              <span className="w-1.5 h-1.5 bg-primary-500 rounded-full" />
              <span>A consultation will be created and you can start messaging</span>
            </li>
            <li className="flex items-center space-x-2">
              <span className="w-1.5 h-1.5 bg-primary-500 rounded-full" />
              <span>Messages can be sent only during the scheduled consultation time</span>
            </li>
          </ul>
        </div>
      )}
    </motion.div>
  )
}

export default ConsultBookingPage
