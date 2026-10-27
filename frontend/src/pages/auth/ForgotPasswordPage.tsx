import * as React from 'react'
import { Link } from 'react-router-dom'
import { Store, Mail, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { authService } from '@/services/api/authService'

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null)
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null)
  const [hasSubmitted, setHasSubmitted] = React.useState(false)

  const validateEmail = (val: string) => {
    return /\S+@\S+\.\S+/.test(val)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setSuccessMsg(null)

    if (!validateEmail(email)) {
      setErrorMsg('Please enter a valid email address.')
      return
    }

    if (hasSubmitted) {
      setErrorMsg('A reset request has already been sent recently. Please check your inbox.')
      return
    }

    setLoading(true)
    try {
      const res = await authService.forgotPassword({ email })
      setSuccessMsg(res.message)
      setHasSubmitted(true)
    } catch (err: any) {
      setErrorMsg(err.message || 'Unable to submit request. Please verify your connection.')
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
          Reset Your Password
        </h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Enter your registered staff email to receive recovery instructions
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white dark:bg-slate-900 py-8 px-6 sm:px-10 shadow-xl rounded-2xl border border-slate-200 dark:border-slate-800">
          {successMsg ? (
            <div className="text-center py-4">
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 mb-3">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Instructions Dispatched
              </h3>
              <p className="mt-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {successMsg}
              </p>
              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                <Link
                  to="/login"
                  className="inline-flex items-center text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
                  Return to Login
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {errorMsg && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <Input
                label="Registered Staff Email"
                type="email"
                required
                leftIcon={<Mail className="h-4 w-4" />}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setErrorMsg(null)
                }}
                placeholder="e.g. employee@supermarket.so"
                helperText="We will send a secure token link if the account exists."
              />

              <Button
                type="submit"
                variant="primary"
                className="w-full"
                isLoading={loading}
                disabled={hasSubmitted || !email.trim()}
              >
                Send Reset Link
              </Button>

              <div className="text-center pt-3 border-t border-slate-100 dark:border-slate-800">
                <Link
                  to="/login"
                  className="inline-flex items-center text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition"
                >
                  <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
                  Back to Login
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
