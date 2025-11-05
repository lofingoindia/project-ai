import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminAuth, supabase } from '../lib/supabase'
import { useLanguage } from '../contexts/LanguageContext'
import LanguageSelector from './LanguageSelector'
import './Login.css'

const Login = () => {
  const { t } = useLanguage()
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()

  // Demo credentials (for testing, you can remove this later)
  const DEMO_CREDENTIALS = {
    email: 'admin@aiproject.com',
    password: 'admin123'
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      // Check if environment variables are properly loaded
      if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
        throw new Error('Supabase configuration is missing. Please check your environment variables.')
      }

      // Use actual Supabase authentication
      const { user } = await adminAuth.signIn(formData.email, formData.password)
      
      // Store auth state in localStorage for UI persistence
      localStorage.setItem('isAuthenticated', 'true')
      localStorage.setItem('userEmail', user.email)
      
      navigate('/dashboard')
    } catch (error) {
      console.error('Login error:', error)
      
      // Handle different types of errors
      if (error.message.includes('Failed to fetch') || error.message.includes('ERR_NAME_NOT_RESOLVED')) {
        setError('Network error: Unable to connect to authentication server. Please check your internet connection or try again later.')
      } else if (error.message.includes('Invalid login credentials') && 
          formData.email === DEMO_CREDENTIALS.email && 
          formData.password === DEMO_CREDENTIALS.password) {
        try {
          // Create demo user
          const { data, error: signUpError } = await supabase.auth.signUp({
            email: formData.email,
            password: formData.password,
            options: {
              data: {
                role: 'admin'
              }
            }
          })
          
          if (signUpError) throw signUpError
          
          setError('Demo user created. Please check your email to confirm your account, then try logging in again.')
        } catch (signUpError) {
          console.error('Signup error:', signUpError)
          setError('Failed to create demo user: ' + signUpError.message)
        }
      } else {
        setError(error.message || 'Login failed. Please check your credentials.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const fillDemoCredentials = () => {
    setFormData(DEMO_CREDENTIALS)
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="login-header-content">
            <h1>{t('login.title')}</h1>
            <p>{t('login.subtitle')}</p>
          </div>
          <LanguageSelector />
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">{t('login.emailLabel')}</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              placeholder={t('login.emailPlaceholder')}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">{t('login.passwordLabel')}</label>
            <div className="password-input-container">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                placeholder={t('login.passwordPlaceholder')}
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                <svg 
                  width="20" 
                  height="20" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  {showPassword ? (
                    // Eye off icon
                    <>
                      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"></path>
                      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"></path>
                      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"></path>
                      <line x1="2" y1="2" x2="22" y2="22"></line>
                    </>
                  ) : (
                    // Eye icon
                    <>
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </>
                  )}
                </svg>
              </button>
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}

          <button 
            type="submit" 
            className="login-button"
            disabled={isLoading}
          >
            {isLoading ? t('login.signingIn') : t('login.signInButton')}
          </button>

          <div className="demo-credentials">
            <p>{t('login.demoCredentials')}</p>
            <p><strong>{t('login.email')}:</strong> admin@aiproject.com</p>
            <p><strong>{t('login.password')}:</strong> admin123</p>
            <button 
              type="button" 
              onClick={fillDemoCredentials}
              className="demo-button"
            >
              {t('login.fillDemo')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Login
