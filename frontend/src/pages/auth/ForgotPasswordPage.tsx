import * as React from 'react'
import { Link } from 'react-router-dom'
import { Store, Mail, ArrowLeft, CheckCircle2, AlertCircle, Sun, Moon, Globe } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { authService } from '@/services/api/authService'
import { useThemeStore } from '@/stores/themeStore'
import { useLanguageStore } from '@/stores/languageStore'

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null)
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null)
  const [hasSubmitted, setHasSubmitted] = React.useState(false)

  const { resolvedTheme, toggleTheme } = useThemeStore()
  const { language, toggleLanguage } = useLanguageStore()

  const validateEmail = (val: string) => {
    return /\S+@\S+\.\S+/.test(val)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setSuccessMsg(null)

    if (!validateEmail(email)) {
      setErrorMsg(language === 'so' ? 'Fadlan geli email sax ah.' : 'Please enter a valid email address.')
      return
    }

    if (hasSubmitted) {
      setErrorMsg(
        language === 'so'
          ? 'Codsiga horay ayaa loo diray. Fadlan eeg email-kaaga.'
          : 'A reset request has already been sent recently. Please check your inbox.'
      )
      return
    }

    setLoading(true)
    try {
      const res = await authService.forgotPassword({ email })
      setSuccessMsg(res.message)
      setHasSubmitted(true)
    } catch (err: any) {
      setErrorMsg(
        err.message ||
          (language === 'so'
            ? 'Lama gudbin karin codsiga. Fadlan hubi internetkaaga.'
            : 'Unable to submit request. Please verify your connection.')
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-[#F8FAFC] dark:bg-[#111827] transition-colors relative">
      {/* Top right quick controls */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 flex items-center gap-2">
        <button
          onClick={toggleLanguage}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E2E8F0] dark:border-[#374151] bg-white/80 dark:bg-[#1F2937]/80 hover:bg-[#F1F5F9] dark:hover:bg-[#374151] text-xs font-bold text-[#111827] dark:text-[#F9FAFB] shadow-xs transition cursor-pointer"
          title="Toggle Language / Beddel Luuqadda"
        >
          <Globe className="h-3.5 w-3.5 text-[#16A34A] dark:text-[#84CC16]" />
          <span>{language === 'so' ? '🇸🇴 SO' : '🇬🇧 EN'}</span>
        </button>

        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl border border-[#E2E8F0] dark:border-[#374151] bg-white/80 dark:bg-[#1F2937]/80 hover:bg-[#F1F5F9] dark:hover:bg-[#374151] text-[#111827] dark:text-[#F9FAFB] shadow-xs transition cursor-pointer"
          title="Toggle Dark/Light Mode"
        >
          {resolvedTheme === 'dark' ? (
            <Sun className="h-4 w-4 text-amber-400" />
          ) : (
            <Moon className="h-4 w-4 text-[#16A34A]" />
          )}
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#16A34A] via-[#15803D] to-[#84CC16] text-white shadow-lg shadow-green-600/25 mb-3">
          <Store className="h-7 w-7" />
        </div>
        <h2 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-[#16A34A] via-[#15803D] to-[#84CC16]">
          {language === 'so' ? 'Dib u deji Furaha' : 'Reset Your Password'}
        </h2>
        <p className="mt-1 text-xs text-[#64748B] dark:text-[#9CA3AF]">
          {language === 'so'
            ? 'Geli emailkaaga shaqaalaha si laguu soo diro tilmaamaha soo celinta'
            : 'Enter your registered staff email to receive recovery instructions'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white dark:bg-[#1F2937] py-8 px-6 sm:px-10 shadow-xl shadow-black/5 dark:shadow-black/25 rounded-3xl border border-[#E2E8F0] dark:border-[#374151]">
          {successMsg ? (
            <div className="text-center py-4">
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mb-3 border border-emerald-500/30">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-[#111827] dark:text-[#F9FAFB]">
                {language === 'so' ? 'Tilmaamihii Waa La Diray' : 'Instructions Dispatched'}
              </h3>
              <p className="mt-2 text-xs text-[#64748B] dark:text-[#9CA3AF] leading-relaxed">
                {successMsg}
              </p>
              <div className="mt-6 pt-4 border-t border-[#E2E8F0] dark:border-[#374151]">
                <Link
                  to="/login"
                  className="inline-flex items-center text-xs font-semibold text-[#16A34A] dark:text-[#84CC16] hover:underline"
                >
                  <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
                  {language === 'so' ? 'Ku laabo Gelitaanka' : 'Return to Login'}
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {errorMsg && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-600 dark:text-red-400">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <Input
                label={language === 'so' ? 'Email-ka Diiwaangashan' : 'Registered Staff Email'}
                type="email"
                required
                leftIcon={<Mail className="h-4 w-4" />}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setErrorMsg(null)
                }}
                placeholder="e.g. employee@supermarket.so"
                helperText={
                  language === 'so'
                    ? 'Waxaan kuugu soo diri doonnaa xiriiriye sir ah haddii akoonku jiro.'
                    : 'We will send a secure token link if the account exists.'
                }
              />

              <Button
                type="submit"
                variant="primary"
                className="w-full"
                isLoading={loading}
                disabled={hasSubmitted || !email.trim()}
              >
                {language === 'so' ? 'Dir Xiriiriyaha Furaha' : 'Send Reset Link'}
              </Button>

              <div className="text-center pt-3 border-t border-[#E2E8F0] dark:border-[#374151]">
                <Link
                  to="/login"
                  className="inline-flex items-center text-xs font-medium text-[#64748B] dark:text-[#9CA3AF] hover:text-[#16A34A] dark:hover:text-[#06B6D4] transition"
                >
                  <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
                  {language === 'so' ? 'Ku noqo Gelitaanka' : 'Back to Login'}
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
