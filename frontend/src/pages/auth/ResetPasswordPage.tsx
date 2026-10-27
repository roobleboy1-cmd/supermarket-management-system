import * as React from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Store, Eye, EyeOff, Lock, Check, X, AlertTriangle, ArrowRight } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { authService } from '@/services/api/authService'
import { useToast } from '@/components/ui/Toast'

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { success } = useToast()

  const [token, setToken] = React.useState<string>('')
  const [newPassword, setNewPassword] = React.useState('')
  const [confirmPassword, setConfirmPassword] = React.useState('')
  const [showPassword, setShowPassword] = React.useState(false)
  const [showConfirm, setShowConfirm] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null)
  const [isSuccess, setIsSuccess] = React.useState(false)

  // Safely capture token from query param on mount, then clean visible URL without losing state
  React.useEffect(() => {
    const rawToken = searchParams.get('token')
    if (rawToken) {
      setToken(rawToken)
      // Clear token from visible URL history for security
      window.history.replaceState({}, document.title, window.location.pathname)
    } else {
      setErrorMsg('No reset token provided. Please request a new password reset link.')
    }
  }, [searchParams])

  // Password complexity checks
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
      setErrorMsg('Missing or invalid reset token. Please request a new reset link.')
      return
    }

    if (!isFormValid) {
      setErrorMsg('Please ensure all password requirements are satisfied.')
      return
    }

    setLoading(true)
    try {
      await authService.resetPassword({ token, newPassword })
      setIsSuccess(true)
      success('Password Successfully Changed', 'Redirecting to login portal...')
      setTimeout(() => {
        navigate('/login?resetSuccess=true')
      }, 2000)
    } catch (err: any) {
      setErrorMsg(err.message || 'The reset token is expired or has already been used.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-950 transition-colors">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg mb-3">
          <Store className="h-6 w-6" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Create New Password
        </h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Set a secure new password for your store employee account
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white dark:bg-slate-900 py-8 px-6 sm:px-10 shadow-xl rounded-2xl border border-slate-200 dark:border-slate-800">
          {isSuccess ? (
            <div className="text-center py-4 space-y-3">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                <Check className="h-6 w-6" />
              </div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Password Successfully Reset!
              </h3>
              <p className="text-xs text-slate-500">
                Redirecting to the login page now...
              </p>
              <Link
                to="/login"
                className="inline-flex items-center text-xs font-semibold text-blue-600 hover:underline pt-2"
              >
                Go to Login Now <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMsg && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* New Password */}
              <div>
                <Input
                  label="New Password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  leftIcon={<Lock className="h-4 w-4" />}
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="p-1 hover:text-slate-700 dark:hover:text-slate-200"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  }
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value)
                    setErrorMsg(null)
                  }}
                  placeholder="At least 8 characters"
                />
              </div>

              {/* Confirm Password */}
              <div>
                <Input
                  label="Confirm New Password"
                  type={showConfirm ? 'text' : 'password'}
                  required
                  leftIcon={<Lock className="h-4 w-4" />}
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="p-1 hover:text-slate-700 dark:hover:text-slate-200"
                    >
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  }
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value)
                    setErrorMsg(null)
                  }}
                  placeholder="Repeat your new password"
                />
              </div>

              {/* Password Requirements Checklist */}
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs space-y-1.5">
                <p className="font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Password Requirements:
                </p>
                <div className="flex items-center gap-2">
                  {hasMinLength ? (
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                  ) : (
                    <X className="h-3.5 w-3.5 text-slate-400" />
                  )}
                  <span className={hasMinLength ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-500'}>
                    At least 8 characters
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {hasUpper ? (
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                  ) : (
                    <X className="h-3.5 w-3.5 text-slate-400" />
                  )}
                  <span className={hasUpper ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-500'}>
                    At least one uppercase letter (A-Z)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {hasNumber ? (
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                  ) : (
                    <X className="h-3.5 w-3.5 text-slate-400" />
                  )}
                  <span className={hasNumber ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-500'}>
                    At least one numeric digit (0-9)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {passwordsMatch ? (
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                  ) : (
                    <X className="h-3.5 w-3.5 text-slate-400" />
                  )}
                  <span className={passwordsMatch ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-500'}>
                    Passwords match
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
                Reset Password & Continue
              </Button>

              <div className="text-center pt-2">
                <Link
                  to="/login"
                  className="text-xs font-medium text-slate-500 hover:text-blue-600 transition"
                >
                  Cancel and Back to Login
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
