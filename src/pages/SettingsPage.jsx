import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  User, Bell, Shield, Lock, Globe, Moon, Sun, 
  Save, Trash2, Download, Mail, Smartphone, 
  MessageSquare, FileText, Eye, EyeOff
} from 'lucide-react'
import { useAuthStore, useThemeStore, tierHelpers } from '../store'
import { userService } from '../services/api'
import toast from 'react-hot-toast'

function SettingsPage() {
  const navigate = useNavigate()
  const { user, tierInfo } = useAuthStore()
  const { theme, setTheme, toggleTheme } = useThemeStore()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')
  const [showPassword, setShowPassword] = useState(false)
  
  const [profileData, setProfileData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    bio: '',
    interests: '',
    location: '',
    phone: '',
  })
  
  const [privacySettings, setPrivacySettings] = useState({
    profile_visible: true,
    show_email: false,
    show_phone: false,
    allow_messages: true,
    allow_consultations: true,
    indexing_enabled: true,
  })
  
  const [notificationSettings, setNotificationSettings] = useState({
    email_notifications: true,
    push_notifications: true,
    message_notifications: true,
    consultation_notifications: true,
    research_notifications: true,
    marketing_emails: false,
    weekly_digest: true,
  })
  
  const [securitySettings, setSecuritySettings] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
    two_factor_enabled: false,
  })

  const isPlus = tierHelpers.isPlus(tierInfo)
  const isPremium = tierHelpers.isPremium(tierInfo)
  const displayTier = tierHelpers.getDisplayTier(tierInfo)

  useEffect(() => {
    if (user) {
      setProfileData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        bio: user.profile?.bio || '',
        interests: user.profile?.interests || '',
        location: user.profile?.location || '',
        phone: user.profile?.phone || '',
      })
    }
  }, [user])

  const handleProfileChange = (e) => {
    const { name, value } = e.target
    setProfileData(prev => ({ ...prev, [name]: value }))
  }

  const handleProfileSave = async () => {
    setSaving(true)
    try {
      await userService.updateProfile(profileData)
      toast.success('Profile updated successfully')
    } catch (error) {
      console.error('Failed to update profile:', error)
      toast.error(error.response?.data?.detail || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handlePrivacyChange = (e) => {
    const { name, checked } = e.target
    setPrivacySettings(prev => ({ ...prev, [name]: checked }))
  }

  const handleNotificationChange = (e) => {
    const { name, checked } = e.target
    setNotificationSettings(prev => ({ ...prev, [name]: checked }))
  }

  const handleSecurityChange = (e) => {
    const { name, value } = e.target
    setSecuritySettings(prev => ({ ...prev, [name]: value }))
  }

  const handlePasswordChange = async () => {
    if (securitySettings.new_password !== securitySettings.confirm_password) {
      toast.error('Passwords do not match')
      return
    }
    if (securitySettings.new_password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    setSaving(true)
    try {
      // Call API to change password
      await userService.updateProfile({
        current_password: securitySettings.current_password,
        new_password: securitySettings.new_password,
      })
      toast.success('Password changed successfully')
      setSecuritySettings({
        current_password: '',
        new_password: '',
        confirm_password: '',
        two_factor_enabled: false,
      })
    } catch (error) {
      console.error('Failed to change password:', error)
      toast.error(error.response?.data?.detail || 'Failed to change password')
    } finally {
      setSaving(false)
    }
  }

  const handleExportData = async () => {
    try {
      // API call to export user data
      toast.success('Data export initiated. You will receive an email shortly.')
    } catch (error) {
      toast.error('Failed to initiate data export')
    }
  }

  const handleDeleteAccount = async () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      try {
        // API call to delete account
        toast.success('Account deletion requested. Please check your email for confirmation.')
      } catch (error) {
        toast.error('Failed to process account deletion')
      }
    }
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'privacy', label: 'Privacy', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'account', label: 'Account', icon: Globe },
  ]

  if (!user) {
    return (
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        className="flex flex-col items-center justify-center h-[calc(100vh-12rem)]"
      >
        <div className="w-20 h-20 bg-gray-100 dark:bg-dark-800 rounded-full flex items-center justify-center mb-6">
          <User className="w-10 h-10 text-gray-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Please Sign In
        </h2>
        <p className="text-gray-500 dark:text-gray-400 text-center max-w-md mb-6">
          Sign in to access your settings
        </p>
        <button onClick={() => navigate('/login')} className="btn-primary">
          Sign In
        </button>
      </motion.div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your account preferences</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar */}
        <div className="md:w-64 flex-shrink-0">
          <div className="card p-4">
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-700'
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="card p-6 space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Profile Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    value={profileData.first_name}
                    onChange={handleProfileChange}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    value={profileData.last_name}
                    onChange={handleProfileChange}
                    className="input"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={profileData.email}
                  onChange={handleProfileChange}
                  className="input"
                  disabled
                />
                <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Bio
                </label>
                <textarea
                  name="bio"
                  value={profileData.bio}
                  onChange={handleProfileChange}
                  className="input h-24 resize-none"
                  placeholder="Tell us about yourself..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={profileData.location}
                    onChange={handleProfileChange}
                    className="input"
                    placeholder="City, Country"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={profileData.phone}
                    onChange={handleProfileChange}
                    className="input"
                    placeholder="+254 700 000 000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Interests
                </label>
                <input
                  type="text"
                  name="interests"
                  value={profileData.interests}
                  onChange={handleProfileChange}
                  className="input"
                  placeholder="e.g., Programming, Design (comma separated)"
                />
              </div>

              <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-dark-700">
                <button
                  onClick={handleProfileSave}
                  disabled={saving}
                  className="btn-primary flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          )}

          {/* Privacy Tab */}
          {activeTab === 'privacy' && (
            <div className="card p-6 space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Privacy Settings
              </h2>

              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-dark-700">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Profile Visibility</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Allow others to find your profile</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="profile_visible"
                      checked={privacySettings.profile_visible}
                      onChange={handlePrivacyChange}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-dark-700">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Show Email</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Display your email on your profile</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="show_email"
                      checked={privacySettings.show_email}
                      onChange={handlePrivacyChange}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-dark-700">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Allow Messages</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Let others send you messages</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="allow_messages"
                      checked={privacySettings.allow_messages}
                      onChange={handlePrivacyChange}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-dark-700">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Search Engine Indexing</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Allow search engines to index your profile</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="indexing_enabled"
                      checked={privacySettings.indexing_enabled}
                      onChange={handlePrivacyChange}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                  </label>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-dark-700">
                <button className="btn-primary flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  Save Privacy Settings
                </button>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="card p-6 space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Notification Preferences
              </h2>

              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-dark-700">
                  <div className="flex items-center space-x-3">
                    <Mail className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Email Notifications</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Receive notifications via email</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="email_notifications"
                      checked={notificationSettings.email_notifications}
                      onChange={handleNotificationChange}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-dark-700">
                  <div className="flex items-center space-x-3">
                    <MessageSquare className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Message Notifications</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Get notified when you receive messages</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="message_notifications"
                      checked={notificationSettings.message_notifications}
                      onChange={handleNotificationChange}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-dark-700">
                  <div className="flex items-center space-x-3">
                    <FileText className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Research Updates</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Get notified about new research papers</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="research_notifications"
                      checked={notificationSettings.research_notifications}
                      onChange={handleNotificationChange}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-dark-700">
                  <div className="flex items-center space-x-3">
                    <Smartphone className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Weekly Digest</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Receive a weekly summary of activity</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="weekly_digest"
                      checked={notificationSettings.weekly_digest}
                      onChange={handleNotificationChange}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                  </label>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-dark-700">
                <button className="btn-primary flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  Save Notification Settings
                </button>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="card p-6 space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Security Settings
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="current_password"
                      value={securitySettings.current_password}
                      onChange={handleSecurityChange}
                      className="input pr-10"
                      placeholder="Enter current password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      New Password
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="new_password"
                      value={securitySettings.new_password}
                      onChange={handleSecurityChange}
                      className="input"
                      placeholder="Enter new password"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Confirm Password
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="confirm_password"
                      value={securitySettings.confirm_password}
                      onChange={handleSecurityChange}
                      className="input"
                      placeholder="Confirm new password"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-dark-700">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Two-Factor Authentication</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Add an extra layer of security</p>
                  </div>
                  <button className="btn-outline text-sm">Enable</button>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-dark-700">
                <button
                  onClick={handlePasswordChange}
                  disabled={saving || !securitySettings.current_password || !securitySettings.new_password}
                  className="btn-primary flex items-center gap-2"
                >
                  <Lock className="w-4 h-4" />
                  {saving ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            </div>
          )}

          {/* Account Tab */}
          {activeTab === 'account' && (
            <div className="card p-6 space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Account Management
              </h2>

              {/* Tier Information */}
              <div className="bg-gray-50 dark:bg-dark-700 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Current Plan</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {displayTier} Tier {isPremium && '(Premium Expert)'}
                    </p>
                  </div>
                  {isPlus && !isPremium && (
                    <button onClick={() => navigate('/upgrade')} className="btn-secondary text-sm">
                      View Premium Features
                    </button>
                  )}
                </div>
              </div>

              {/* Data Export */}
              <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-dark-700">
                <div className="flex items-center space-x-3">
                  <Download className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Export Your Data</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Download a copy of your data</p>
                  </div>
                </div>
                <button onClick={handleExportData} className="btn-outline text-sm">
                  Export Data
                </button>
              </div>

              {/* Delete Account */}
              <div className="flex items-center justify-between py-3">
                <div className="flex items-center space-x-3">
                  <Trash2 className="w-5 h-5 text-red-500" />
                  <div>
                    <p className="font-medium text-red-600 dark:text-red-400">Delete Account</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Permanently delete your account</p>
                  </div>
                </div>
                <button onClick={handleDeleteAccount} className="btn-outline text-sm text-red-600 border-red-300 hover:bg-red-50">
                  Delete Account
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default SettingsPage
