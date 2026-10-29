import * as React from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Store, Eye, EyeOff, Lock, Check, X, AlertTriangle, ArrowRight, Sun, Moon, Globe } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { authService } from '@/services/api/authService'
import { useToast } from '@/components/ui/Toast'
import { useThemeStore } from '@/stores/themeStore'
import { useLanguageStore } from '@/stores/languageStore'

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { success } = useToast()
  const { resolvedTheme, toggleTheme } = useThemeStore()
  const { language, toggleLanguage } = useLanguageStore()

  const [token, setToken] = React.useState<string>('')
  const [newPassword, setNewPassword] = React.useState('')
  const [confirmPassword, setConfirmPassword] = React.useState('')
  const [showPassword, setShowPassword] = React.useState(false)
  const [showConfirm, setShowConfirm] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null)
  const [isSuccess, setIsSuccess] = React.useState(false)

  React.useEffect(() => {
    const rawToken = searchParams.get('token')
    if (rawToken) {
      setToken(rawToken)
      window.history.replaceState({}, document.title, window.location.pathname)
    } else {
      setErrorMsg(
        language === 'so'
          ? 'Xiriiriye furaha sax maaha. Fadlan dib u codso.'
          : 'No reset token provided. Please request a new password reset link.'
      )
    }
  }, [searchParams, language])

  const hasMinLength = newPassword.length >= 8
  const hasUpper = /[A-Z]/.test(newPassword)
  const hasNumber = /[0-9]/.test(newPassword)
  const hasSpecial = /[^A-Za-z0-9]/.test(newPassword)
  const passwordsMatch = newPassword === confirmPassword && newPassword.length > 0
  const isFormValid = hasMinLength && hasUpper && hasNumber && passwordsMatch

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    if (!token) {
      setErrorMsg(
        language === 'so'
          ? 'Xiriiriyaha furaha ma jiro ama waa khaldan yahay.'
          : 'Missing or invalid reset token. Please request a new reset link.'
      )
      return
    }

    if (!isFormValid) {
      setErrorMsg(
        language === 'so'
          ? 'Fadlan hubi in dhammaan shuruudaha furaha sirta ah ay buuxsameen.'
          : 'Please ensure all password requirements are satisfied.'
      )
      return
    }

    setLoading(true)
    try {
      await authService.resetPassword({ token, newPassword })
      setIsSuccess(true)
      success(
        language === 'so' ? 'Furaha Si Guul Leh Ayaa Loo Beddelay' : 'Password Successfully Changed',
        language === 'so' ? 'Waxaa laguu wareejinayaa bogga gelitaanka...' : 'Redirecting to login portal...'
      )
      setTimeout(() => {
        navigate('/login?resetSuccess=true')
      }, 2000)
    } catch (err: any) {
      setErrorMsg(
        err.message ||
          (language === 'so'
            ? 'Xiriiriyaha wuu dhacay ama horay ayaa loo isticmaalay.'
            : 'The reset token is expired or has already been used.')
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-[#F5F7FC] dark:bg-[#0B1220] transition-colors relative">
      {/* Top right quick controls */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 flex items-center gap-2">
        <button
          onClick={toggleLanguage}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E2E8F0] dark:border-[#263449] bg-white/80 dark:bg-[#111C31]/80 hover:bg-[#F1F5F9] dark:hover:bg-[#172338] text-xs font-bold text-[#0F172A] dark:text-[#F8FAFC] shadow-xs transition cursor-pointer"
          title="Toggle Language / Beddel Luuqadda"
        >
          <Globe className="h-3.5 w-3.5 text-[#3B82F6] dark:text-[#06B6D4]" />
          <span>{language === 'so' ? '🇸🇴 SO' : '🇬🇧 EN'}</span>
        </button>

        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl border border-[#E2E8F0] dark:border-[#263449] bg-white/80 dark:bg-[#111C31]/80 hover:bg-[#F1F5F9] dark:hover:bg-[#172338] text-[#0F172A] dark:text-[#F8FAFC] shadow-xs transition cursor-pointer"
          title="Toggle Dark/Light Mode"
        >
          {resolvedTheme === 'dark' ? (
            <Sun className="h-4 w-4 text-amber-400" />
          ) : (
            <Moon className="h-4 w-4 text-[#3B82F6]" />
          )}
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#3B82F6] via-[#8B5CF6] to-[#06B6D4] text-white shadow-lg shadow-blue-500/25 mb-3">
          <Store className="h-7 w-7" />
        </div>
        <h2 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-[#3B82F6] via-[#8B5CF6] to-[#06B6D4]">
          {language === 'so' ? 'Sameyso Fure Cusub' : 'Create New Password'}
        </h2>
        <p className="mt-1 text-xs text-[#64748B] dark:text-[#94A3B8]">
          {language === 'so'
            ? 'U deji fure adag oo cusub akoonkaaga dukaanka'
            : 'Set a secure new password for your store employee account'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white dark:bg-[#111C31] py-8 px-6 sm:px-10 shadow-xl shadow-black/5 dark:shadow-black/25 rounded-3xl border border-[#E2E8F0] dark:border-[#263449]">
          {isSuccess ? (
            <div className="text-center py-4 space-y-3">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                <Check className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                {language === 'so' ? 'Furaha Si Guul Leh Ayaa Loo Beddelay!' : 'Password Successfully Reset!'}
              </h3>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                {language === 'so'
                  ? 'Waxaa laguu wareejinayaa bogga gelitaanka hadda...'
                  : 'Redirecting to the login page now...'}
              </p>
              <Link
                to="/login"
                className="inline-flex items-center text-xs font-semibold text-[#3B82F6] dark:text-[#06B6D4] hover:underline pt-2"
              >
                {language === 'so' ? 'Aad Gelitaanka Hadda' : 'Go to Login Now'}{' '}
                <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMsg && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-600 dark:text-red-400">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* New Password */}
              <div>
                <Input
                  label={language === 'so' ? 'Furaha Cusub' : 'New Password'}
                  type={showPassword ? 'text' : 'password'}
                  required
                  leftIcon={<Lock className="h-4 w-4" />}
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="p-1 hover:text-[#0F172A] dark:hover:text-[#F8FAFC] text-[#64748B] dark:text-[#94A3B8]"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  }
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value)
                    setErrorMsg(null)
                  }}
                  placeholder={language === 'so' ? 'Ugu yaraan 8 xaraf' : 'At least 8 characters'}
                />
              </div>

              {/* Confirm Password */}
              <div>
                <Input
                  label={language === 'so' ? 'Hubi Furaha Cusub' : 'Confirm New Password'}
                  type={showConfirm ? 'text' : 'password'}
                  required
                  leftIcon={<Lock className="h-4 w-4" />}
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="p-1 hover:text-[#0F172A] dark:hover:text-[#F8FAFC] text-[#64748B] dark:text-[#94A3B8]"
                    >
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  }
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value)
                    setErrorMsg(null)
                  }}
                  placeholder={language === 'so' ? 'Ku celi furahaaga cusub' : 'Repeat your new password'}
                />
              </div>

              {/* Password Requirements Checklist */}
              <div className="p-3.5 rounded-xl bg-[#F8FAFC] dark:bg-[#172338] border border-[#E2E8F0] dark:border-[#263449] text-xs space-y-1.5">
                <p className="font-bold text-[#0F172A] dark:text-[#F8FAFC] mb-1">
                  {language === 'so' ? 'Shuruudaha Furaha Sirta ah:' : 'Password Requirements:'}
                </p>
                <div className="flex items-center gap-2">
                  {hasMinLength ? (
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                  ) : (
                    <X className="h-3.5 w-3.5 text-[#94A3B8]" />
                  )}
                  <span className={hasMinLength ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-[#64748B] dark:text-[#94A3B8]'}>
                    {language === 'so' ? 'Ugu yaraan 8 xaraf' : 'At least 8 characters'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {hasUpper ? (
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                  ) : (
                    <X className="h-3.5 w-3.5 text-[#94A3B8]" />
                  )}
                  <span className={hasUpper ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-[#64748B] dark:text-[#94A3B8]'}>
                    {language === 'so' ? 'Ugu yaraan hal xaraf weyn (A-Z)' : 'At least one uppercase letter (A-Z)'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {hasNumber ? (
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                  ) : (
                    <X className="h-3.5 w-3.5 text-[#94A3B8]" />
                  )}
                  <span className={hasNumber ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-[#64748B] dark:text-[#94A3B8]'}>
                    {language === 'so' ? 'Ugu yaraan hal tiro (0-9)' : 'At least one numeric digit (0-9)'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {passwordsMatch ? (
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                  ) : (
                    <X className="h-3.5 w-3.5 text-[#94A3B8]" />
                  )}
                  <span className={passwordsMatch ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-[#64748B] dark:text-[#94A3B8]'}>
                    {language === 'so' ? 'Furayaashu waa is leeyihiin' : 'Passwords match'}
                  </span>
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full mt-2"
                isLoading={loading}
                disabled={!isFormValid || !token}
              >
                {language === 'so' ? 'Xaqiiji Furaha & Gal' : 'Reset Password & Continue'}
              </Button>

              <div className="text-center pt-2">
                <Link
                  to="/login"
                  className="text-xs font-medium text-[#64748B] dark:text-[#94A3B8] hover:text-[#3B82F6] dark:hover:text-[#06B6D4] transition"
                >
                  {language === 'so' ? 'Kansal & Ku noqo Gelitaanka' : 'Cancel and Back to Login'}
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
