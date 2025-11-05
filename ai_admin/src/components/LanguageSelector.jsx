import { Globe } from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'
import { useState, useRef, useEffect } from 'react'
import './LanguageSelector.css'

const LanguageSelector = ({ iconOnly = false }) => {
  const { language, toggleLanguage } = useLanguage()
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleLanguageChange = (newLanguage) => {
    if (language !== newLanguage) {
      toggleLanguage()
    }
    setShowDropdown(false)
  }

  if (iconOnly) {
    return (
      <div
      style={{display:'none'}}
      className="language-selector" ref={dropdownRef}>
        <button 
          className="language-toggle icon-only"
          onClick={() => setShowDropdown(!showDropdown)}
          title="Select Language"
        >
          <Globe size={18} />
        </button>
        {showDropdown && (
          <div className="language-dropdown">
            <button 
              className={`dropdown-item ${language === 'en' ? 'active' : ''}`}
              onClick={() => handleLanguageChange('en')}
            >
              <span className="flag">🇺🇸</span>
              <span>English</span>
            </button>
            <button 
              className={`dropdown-item ${language === 'ar' ? 'active' : ''}`}
              onClick={() => handleLanguageChange('ar')}
            >
              <span className="flag">🇸🇦</span>
              <span>العربية</span>
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="language-selector">
      <button 
        className="language-toggle"
        onClick={toggleLanguage}
        title={language === 'en' ? 'Switch to Arabic' : 'التبديل إلى الإنجليزية'}
      >
        <Globe size={18} />
        <span className="language-text">
          {language === 'en' ? 'العربية' : 'English'}
        </span>
      </button>
    </div>
  )
}

export default LanguageSelector
