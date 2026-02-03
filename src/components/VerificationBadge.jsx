/**
 * VerificationBadge Component
 * Displays green or gold checkmark PNG after usernames based on verification level
 * 
 * Props:
 * - type: 'green' | 'gold' (determines which image to show)
 * - size: optional size override (default: 'w-4 h-4')
 */
export const VerificationBadge = ({ type }) => {
  if (!type || (type !== 'green' && type !== 'gold')) {
    return null
  }
  
  const src = type === 'gold' 
    ? '/src/assets/gold_checkmark.png' 
    : '/src/assets/green_checkmark.png'
  
  const alt = type === 'gold' ? 'Gold verified' : 'Green verified'
  
  return (
    <img 
      src={src} 
      alt={alt}
      className="inline-block w-4 h-4 ml-1 align-middle"
      title={alt}
    />
  )
}

/**
 * Helper component to render username with checkmark
 * Use this for any username display
 */
export const UsernameWithBadge = ({ user }) => {
  if (!user) return null
  
  const checkmarkType = user.checkmark_type || user.verification_level
  
  return (
    <span>
      {user.username}
      {checkmarkType && <VerificationBadge type={checkmarkType} />}
    </span>
  )
}

/**
 * Render checkmark for expert/professional
 */
export const ExpertBadge = ({ professional }) => {
  if (!professional) return null
  
  // Check if professional has user object nested
  const user = professional.user || professional
  const checkmarkType = user?.checkmark_type || user?.verification_level
  
  return (
    <span>
      {user?.username}
      {checkmarkType && <VerificationBadge type={checkmarkType} />}
    </span>
  )
}

/**
 * ExpertNameWithBadge - alias for ExpertBadge for backward compatibility
 */
export const ExpertNameWithBadge = ({ professional }) => {
  return ExpertBadge({ professional })
}
