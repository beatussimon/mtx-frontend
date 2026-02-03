import { useState, useEffect, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Send, User, Image, Paperclip, MoreVertical, Phone, Video, ArrowLeft, Clock, AlertCircle, Calendar } from 'lucide-react'
import { messageService, conversationService, consultationService } from '../services/api'
import { useAuthStore, tierHelpers } from '../store'
import { VerificationBadge } from '../components/VerificationBadge'

function MessagesPage() {
  const { user, tierInfo } = useAuthStore()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [conversations, setConversations] = useState([])
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(null)
  const [selectedFile, setSelectedFile] = useState(null)
  const [filePreview, setFilePreview] = useState(null)
  const [consultationStatus, setConsultationStatus] = useState(null)
  const [initiateLoading, setInitiateLoading] = useState(false)
  const messagesEndRef = useRef(null)
  const fileInputRef = useRef(null)
  const imageInputRef = useRef(null)

  const isProfessional = tierHelpers.isProfessional(tierInfo)
  const isPremium = tierHelpers.isPremium(tierInfo)

  const canMessage = isProfessional || isPremium

  // Check if messaging is allowed based on consultation status
  const canSendMessages = consultationStatus?.can_send_messages || false

  // Determine the UI state based on consultation status
  const getConsultationState = () => {
    if (!consultationStatus) return 'none'
    if (consultationStatus.state === 'scheduled') return 'scheduled'
    if (consultationStatus.can_send_messages) return 'active'
    return 'expired'
  }

  const consultationState = getConsultationState()

  useEffect(() => {
    fetchConversations()
  }, [])

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id)
      // Update consultation status from selected conversation
      setConsultationStatus(selectedConversation.consultation_status || null)
    }
  }, [selectedConversation])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Handle expert_id query parameter - calls /api/messages/initiate/
  useEffect(() => {
    const expertId = searchParams.get('expert_id')
    if (expertId && canMessage && !initiateLoading) {
      // Use a timeout to prevent duplicate calls
      const timer = setTimeout(() => {
        handleExpertId(expertId)
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [searchParams, canMessage, initiateLoading])

  const initiateConversation = async (expertId) => {
    setInitiateLoading(true)
    setError(null)
    
    try {
      // Call the initiate endpoint
      const response = await messageService.initiate({ expert_id: parseInt(expertId) })
      
      const data = response.data
      
      // Check for UX-safe response
      if (data.status === 'NO_ACTIVE_CONSULTATION') {
        // Handle UX-safe response - redirect booking page to
        setError(data.message)
        setConsultationStatus({
          can_send_messages: false,
          consultation_id: null,
          consultation_status: null,
          redirect_to: data.redirect_to,
          status: data.status
        })
        setInitiateLoading(false)
        return data
      }
      
      if (data.conversation_id) {
        // Conversation initiated successfully (201 created or 200 existing)
        const conversationId = data.conversation_id
        
        // Fetch the full conversation details
        try {
          const convResponse = await conversationService.get(conversationId)
          const conversation = convResponse.data
          
          setSelectedConversation(conversation)
          setConsultationStatus({
            consultation_id: data.consultation_id,
            consultation_status: data.consultation_status,
            consultation_end_time: data.consultation_end_time,
            can_send_messages: data.can_send_messages,
            status: 'ACTIVE'
          })
          
          // Fetch messages for the new conversation
          await fetchMessages(conversationId)
          
          // Refresh conversations list
          await fetchConversations()
        } catch (convError) {
          console.error('Failed to fetch conversation details:', convError)
          // Still show the conversation even if details fail
          setSelectedConversation({ id: conversationId })
        }
      }
      
      // Clear the query parameter
      setSearchParams({})
      
      return data
    } catch (error) {
      console.error('Failed to initiate conversation:', error)
      
      // Handle different error types
      if (error.response) {
        const { status, data: errorData } = error.response
        
        if (status === 403) {
          // Forbidden - no active consultation with UX-safe response
          setError(errorData?.message || errorData?.error || 'You must have an active consultation to message this expert.')
          setConsultationStatus({
            can_send_messages: false,
            consultation_id: null,
            consultation_status: null,
            status: 'NO_ACTIVE_CONSULTATION'
          })
        } else if (status === 404) {
          // Expert not found
          setError('Expert not found. Please try again.')
        } else if (status === 400) {
          // Bad request
          setError(errorData?.message || errorData?.error || 'Invalid request. Please try again.')
        } else if (status === 401) {
          // Unauthorized
          setError('Please log in to message experts.')
        } else {
          setError('Failed to start conversation. Please try again.')
        }
      } else if (error.request) {
        setError('Network error. Please check your connection.')
      } else {
        setError('An unexpected error occurred. Please try again.')
      }
      
      throw error
    } finally {
      setInitiateLoading(false)
    }
  }

  const handleExpertId = async (expertId) => {
    try {
      // Check if conversation already exists with this expert
      const existingConversation = conversations.find(conv => {
        const otherParticipant = getOtherParticipant(conv)
        return otherParticipant?.id == expertId
      })

      if (existingConversation) {
        // Select existing conversation
        setSelectedConversation(existingConversation)
        setConsultationStatus(existingConversation.consultation_status || null)
      } else {
        // Initiate new conversation via the new endpoint
        await initiateConversation(expertId)
      }

      // Clear the query parameter if not already done
      setSearchParams({})
    } catch (error) {
      console.error('Failed to handle expert messaging:', error)
      // Error is already set in initiateConversation
    }
  }

  const fetchConversations = async () => {
    try {
      setLoading(true)
      const response = await conversationService.getAll()
      setConversations(response.data.results || response.data || [])
      setError(null)
    } catch (error) {
      console.error('Failed to fetch conversations:', error)
      setError('Failed to load conversations')
      setConversations([])
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async (conversationId) => {
    try {
      const response = await conversationService.getMessages(conversationId)
      setMessages(response.data.results || response.data || [])
      setError(null)
    } catch (error) {
      console.error('Failed to fetch messages:', error)
      setError('Failed to load messages')
      setMessages([])
    }
  }

  const handleFileSelect = (e, type) => {
    const file = e.target.files[0]
    if (!file) return

    // Check file size (limit to 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      setError('File size must be less than 10MB')
      return
    }

    setSelectedFile(file)
    setError(null)

    // Create preview for images
    if (type === 'image' && file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => setFilePreview(e.target.result)
      reader.readAsDataURL(file)
    } else {
      setFilePreview(null)
    }
  }

  const removeFile = () => {
    setSelectedFile(null)
    setFilePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
    if (imageInputRef.current) imageInputRef.current.value = ''
  }

  const handleSend = async (e) => {
    e.preventDefault()
    if ((!newMessage.trim() && !selectedFile) || !selectedConversation) return

    // Frontend validation - should match backend
    if (!canSendMessages) {
      setError('Consultation has ended. Please rebook to continue chatting.')
      return
    }

    try {
      setSending(true)
      const formData = new FormData()
      formData.append('conversation', selectedConversation.id)
      if (newMessage.trim()) {
        formData.append('content', newMessage.trim())
      }
      if (selectedFile) {
        formData.append('attachment', selectedFile)
      }

      const response = await messageService.send(formData)

      // Add the new message to the list
      const sentMessage = response.data
      setMessages(prev => [...prev, sentMessage])
      setNewMessage('')
      removeFile()
      setError(null)
    } catch (error) {
      console.error('Failed to send message:', error)
      const errorMessage = error.response?.data?.detail || error.response?.data?.error || 'Failed to send message. Please try again.'
      setError(errorMessage)
    } finally {
      setSending(false)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const getOtherParticipant = (conversation) => {
    if (!conversation.participants || conversation.participants.length === 0) return null
    return conversation.participants.find(p => p.id !== user?.id) || conversation.participants[0]
  }

  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } else if (diffDays === 1) {
      return 'Yesterday'
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' })
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
    }
  }

  const formatEndTime = (endTime) => {
    if (!endTime) return null
    const date = new Date(endTime)
    return date.toLocaleString([], { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const formatStartTime = (startTime) => {
    if (!startTime) return null
    const date = new Date(startTime)
    return date.toLocaleString([], { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  // Redirect basic users to upgrade page
  if (!canMessage) {
    navigate('/upgrade')
    return null
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="h-[calc(100vh-8rem)]"
    >
      <div className="card h-full flex overflow-hidden">
        {/* Conversations List */}
        <div className="w-80 border-r border-gray-200 dark:border-dark-700 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 dark:border-dark-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Messages</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {conversations.length} conversations
            </p>
          </div>

          {/* Search/Filter */}
          <div className="p-4 border-b border-gray-200 dark:border-dark-700">
            <input
              type="text"
              placeholder="Search conversations..."
              className="input w-full"
            />
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="space-y-4 p-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-3 animate-pulse">
                    <div className="w-12 h-12 bg-gray-200 dark:bg-dark-700 rounded-full" />
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 dark:bg-dark-700 rounded w-3/4 mb-2" />
                      <div className="h-3 bg-gray-200 dark:bg-dark-700 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : error && !selectedConversation ? (
              <div className="p-4 text-center text-red-500">
                {error}
              </div>
            ) : conversations.length > 0 ? (
              conversations.map((conversation) => {
                const otherParticipant = getOtherParticipant(conversation)
                const lastMessage = conversation.last_message
                const convStatus = conversation.consultation_status
                const isExpired = convStatus?.has_consultation && !convStatus?.can_send_messages
                
                return (
                  <div
                    key={conversation.id}
                    onClick={() => {
                      setSelectedConversation(conversation)
                      setConsultationStatus(convStatus || null)
                    }}
                    className={`flex items-center space-x-3 p-4 cursor-pointer transition-colors ${
                      selectedConversation?.id === conversation.id 
                        ? 'bg-primary-50 dark:bg-primary-900/20 border-r-2 border-primary-500' 
                        : 'hover:bg-gray-50 dark:hover:bg-dark-700'
                    }`}
                  >
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center overflow-hidden">
                        {otherParticipant?.photo ? (
                          <img 
                            src={otherParticipant.photo} 
                            alt={otherParticipant.username}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                        )}
                      </div>
                      {/* Consultation status indicator */}
                      {isExpired && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white dark:border-dark-800" title="Consultation ended" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <p className="font-medium text-gray-900 dark:text-white truncate">
                            {otherParticipant?.username || 'Unknown User'}
                          </p>
                          {otherParticipant?.checkmark_type && (
                            <VerificationBadge type={otherParticipant.checkmark_type} />
                          )}
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {lastMessage && formatMessageTime(lastMessage.created_at || lastMessage.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        {lastMessage?.content || 'No messages yet'}
                      </p>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="p-8 text-center">
                <User className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">No conversations yet</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                  Start a conversation by visiting a professional's profile
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col h-0">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-dark-700 flex-shrink-0">
                <div className="flex items-center space-x-3">
                  <button 
                    onClick={() => {
                      setSelectedConversation(null)
                      setConsultationStatus(null)
                    }}
                    className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center overflow-hidden">
                    {getOtherParticipant(selectedConversation)?.photo ? (
                      <img 
                        src={getOtherParticipant(selectedConversation).photo} 
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {getOtherParticipant(selectedConversation)?.username || 'Unknown User'}
                      </p>
                      <VerificationBadge type={getOtherParticipant(selectedConversation)?.checkmark_type} />
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {getOtherParticipant(selectedConversation)?.is_online ? 'Online' : 'Offline'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg">
                    <Phone className="w-5 h-5 text-gray-500" />
                  </button>
                  <button className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg">
                    <Video className="w-5 h-5 text-gray-500" />
                  </button>
                  <button className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg">
                    <MoreVertical className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>

              {/* Consultation Status Banner - State-aware */}
              {consultationState === 'scheduled' && consultationStatus?.start_time && (
                <div className="px-4 py-3 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-100 dark:border-blue-800">
                  <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400">
                    <Calendar className="w-5 h-5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Consultation scheduled</p>
                      <p className="text-sm mt-1">
                        Starts at: {formatStartTime(consultationStatus.start_time)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {consultationState === 'active' && (
                <div className="px-4 py-3 bg-green-50 dark:bg-green-900/20 border-b border-green-100 dark:border-green-800">
                  <div className="flex items-center space-x-2 text-green-600 dark:text-green-400">
                    <Clock className="w-5 h-5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Consultation is active</p>
                      {consultationStatus?.end_time && (
                        <p className="text-sm mt-1">
                          Ends at: {formatEndTime(consultationStatus.end_time)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {consultationState === 'expired' && (
                <div className="px-4 py-3 bg-red-50 dark:bg-red-900/20 border-b border-red-100 dark:border-red-800">
                  <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">This consultation has ended</p>
                      {consultationStatus?.end_time && (
                        <p className="text-sm mt-1">
                          Ended: {formatEndTime(consultationStatus.end_time)}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      const expertId = getOtherParticipant(selectedConversation)?.id
                      if (expertId) {
                        navigate(`/experts/${expertId}/consult`)
                      }
                    }}
                    className="mt-2 btn-primary text-sm py-2 px-4 bg-red-600 hover:bg-red-700"
                  >
                    Reschedule Consultation
                  </button>
                </div>
              )}

              {consultationState === 'none' && initiateLoading && (
                <div className="px-4 py-3 bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-100 dark:border-yellow-800">
                  <div className="flex items-center space-x-2 text-yellow-600 dark:text-yellow-400">
                    <Clock className="w-5 h-5 flex-shrink-0" />
                    <p className="font-medium">No active consultation</p>
                  </div>
                  <button
                    onClick={() => {
                      const expertId = getOtherParticipant(selectedConversation)?.id
                      if (expertId) {
                        navigate(`/experts/${expertId}/consult`)
                      }
                    }}
                    className="mt-2 btn-primary text-sm py-2 px-4"
                  >
                    Book a Consultation
                  </button>
                </div>
              )}

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length > 0 ? (
                  messages.map((msg, index) => {
                    const isOwn = msg.sender?.id === user?.id
                    const showAvatar = !isOwn && (index === 0 || messages[index - 1]?.sender?.id !== msg.sender?.id)
                    
                    return (
                      <div
                        key={msg.id || index}
                        className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`flex items-end space-x-2 max-w-[70%] ${isOwn ? 'flex-row-reverse space-x-reverse' : ''}`}>
                          {showAvatar && !isOwn && (
                            <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900 flex-shrink-0 overflow-hidden">
                              {msg.sender?.photo ? (
                                <img 
                                  src={msg.sender.photo} 
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <User className="w-4 h-4 text-primary-600 dark:text-primary-400 mx-auto mt-2" />
                              )}
                            </div>
                          )}
                          {!showAvatar && !isOwn && <div className="w-8" />}
                          
                          <div className={`px-4 py-2 rounded-2xl ${
                            isOwn 
                              ? 'bg-primary-500 text-white rounded-br-md' 
                              : 'bg-gray-100 dark:bg-dark-700 text-gray-900 dark:text-white rounded-bl-md'
                          }`}>
                            {msg.content && <p className="whitespace-pre-wrap">{msg.content}</p>}
                            
                            {/* Attachment */}
                            {msg.attachment && (
                              <div className="mt-2">
                                {msg.attachment_type === 'image' ? (
                                  <img 
                                    src={msg.attachment} 
                                    alt="Attachment"
                                    className="max-w-xs rounded-lg"
                                  />
                                ) : (
                                  <a 
                                    href={msg.attachment} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="flex items-center space-x-2 text-sm underline"
                                  >
                                    <Paperclip className="w-4 h-4" />
                                    <span>Attachment</span>
                                  </a>
                                )}
                              </div>
                            )}
                            
                            <p className={`text-xs mt-1 ${isOwn ? 'text-primary-100' : 'text-gray-400'}`}>
                              {new Date(msg.timestamp || msg.created_at).toLocaleTimeString([], { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                              {isOwn && msg.is_read && (
                                <span className="ml-1">✓✓</span>
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="flex items-center justify-center h-full">
                    {initiateLoading ? (
                      <div className="text-center">
                        <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                        <p className="text-gray-500 dark:text-gray-400">Starting conversation...</p>
                      </div>
                    ) : (
                      <p className="text-gray-500 dark:text-gray-400">No messages yet. Start the conversation!</p>
                    )}
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Error Message */}
              {error && (
                <div className="px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
                  {error}
                </div>
              )}

              {/* Message Input */}
              <form onSubmit={handleSend} className="p-4 border-t border-gray-200 dark:border-dark-700">
                {/* Read-only notice for expired consultations */}
                {!canSendMessages && (
                  <div className="mb-3 p-3 bg-gray-100 dark:bg-dark-700 rounded-lg flex items-center space-x-2 text-gray-500 dark:text-gray-400">
                    <Clock className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm">
                      {consultationState === 'expired' 
                        ? 'Consultation ended. Reschedule to continue messaging.' 
                        : 'Please book a consultation to start messaging.'}
                    </span>
                  </div>
                )}
                
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg transition-colors disabled:opacity-50"
                    title="Attach image"
                    disabled={!canSendMessages || sending}
                    onClick={() => imageInputRef.current?.click()}
                  >
                    <Image className="w-5 h-5 text-gray-500" />
                  </button>
                  <button
                    type="button"
                    className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg transition-colors disabled:opacity-50"
                    title="Attach file"
                    disabled={!canSendMessages || sending}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Paperclip className="w-5 h-5 text-gray-500" />
                  </button>
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={canSendMessages ? "Type a message..." : "Consultation not active"}
                    className="input flex-1"
                    disabled={!canSendMessages || sending}
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim() || sending || !canSendMessages}
                    className="btn-primary p-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
                
                {/* Hidden file inputs */}
                <input
                  type="file"
                  ref={imageInputRef}
                  onChange={(e) => handleFileSelect(e, 'image')}
                  accept="image/*"
                  className="hidden"
                />
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => handleFileSelect(e, 'file')}
                  className="hidden"
                />
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-20 h-20 bg-gray-100 dark:bg-dark-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                  Select a conversation
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Choose a conversation from the list to start messaging
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default MessagesPage
