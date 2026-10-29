import * as React from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Store, Lock, Mail, ArrowRight, ShieldCheck, UserCheck, Sun, Moon, Globe } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/stores/authStore'
import { useThemeStore } from '@/stores/themeStore'
import { useLanguageStore } from '@/stores/languageStore'
import { useToast } from '@/components/ui/Toast'
import type { Role } from '@/types'

export const LoginPage: React.FC = () => {
  const [email, setEmail] = React.useState('admin@supermarket.so')
  const [password, setPassword] = React.useState('Supermarket@2026')
  const [loading, setLoading] = React.useState(false)
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null)

  const { login } = useAuthStore()
  const { resolvedTheme, toggleTheme } = useThemeStore()
  const { language, toggleLanguage, t } = useLanguageStore()
  const { success, error } = useToast()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const expired = searchParams.get('expired')
  const resetSuccess = searchParams.get('resetSuccess')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setLoading(true)

    try {
      const user = await login({ email, password })
      success(
        language === 'so' ? `Kusoo dhowaaw, ${user.name}!` : `Welcome back, ${user.name}!`,
        language === 'so' ? `Waxaad ku gashay: ${user.role}` : `Logged in as ${user.role}`
      )
      if (user.role === 'Cashier') {
        navigate('/pos')
      } else {
        navigate('/')
      }
    } catch (err: any) {
      const msg = err.message || 'Invalid email or password'
      setErrorMsg(msg)
      error('Login Failed', msg)
    } finally {
      setLoading(false)
    }
  }

  const handleQuickLogin = async (demoEmail: string, roleName: Role) => {
    setEmail(demoEmail)
    setPassword('Supermarket@2026')
    setLoading(true)
    setErrorMsg(null)
    try {
      const user = await login({ email: demoEmail, password: 'Supermarket@2026' })
      success(
        language === 'so' ? `Waxaad ku gashay ${roleName}` : `Logged in as ${roleName}`,
        language === 'so' ? `Kusoo dhowaaw ${user.name}` : `Welcome ${user.name}`
      )
      if (roleName === 'Cashier') {
        navigate('/pos')
      } else {
        navigate('/')
      }
    } catch (err: any) {
      setErrorMsg(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-[#F5F7FC] dark:bg-[#0B1220] transition-colors relative">
      {/* Top right quick controls for language and theme */}
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
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-cyan-500 text-white shadow-lg shadow-indigo-500/30 mb-3">
          <Store className="h-7 w-7" />
        </div>
        <h2 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 dark:from-indigo-400 dark:via-blue-400 dark:to-cyan-400">
          SomSupermarket
        </h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 font-medium">
          {language === 'so'
            ? 'Nidaamka Maamulka Dukaanka Dhexe — Albaabka Shaqaalaha'
            : 'Single Supermarket Management System — Staff Portal'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white dark:bg-[#111C31] py-8 px-6 sm:px-10 shadow-xl shadow-black/5 dark:shadow-black/25 rounded-3xl border border-[#E2E8F0] dark:border-[#263449]">
          {expired && (
            <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-600 dark:text-amber-400 font-medium">
              {language === 'so'
                ? 'Wakhtigii gelitaanka wuu dhacay. Fadlan dib u gal.'
                : 'Your session has expired. Please log in again to continue.'}
            </div>
          )}

          {resetSuccess && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              {language === 'so'
                ? 'Furaha sirta ah si guul leh ayaa loo beddelay!'
                : 'Password has been successfully updated! Please log in.'}
            </div>
          )}

          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-600 dark:text-rose-400 font-medium">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label={language === 'so' ? 'Email-ka Shaqaalaha' : 'Staff Email Address'}
              type="email"
              required
              leftIcon={<Mail className="h-4 w-4" />}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. admin@supermarket.so"
            />

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                  {language === 'so' ? 'Furaha Sirta ah' : 'Password'}
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-semibold text-[#3B82F6] dark:text-[#06B6D4] hover:underline"
                >
                  {language === 'so' ? 'Ma ilowday furaha?' : 'Forgot Password?'}
                </Link>
              </div>
              <Input
                type="password"
                required
                leftIcon={<Lock className="h-4 w-4" />}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
              />
            </div>

            <Button type="submit" variant="primary" className="w-full mt-2" isLoading={loading}>
              {language === 'so' ? 'Gal Nidaamka' : 'Sign In to Store Portal'}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>

          {/* Quick Demo Role Switcher */}
          <div className="mt-6 pt-6 border-t border-[#E2E8F0] dark:border-[#263449]">
            <p className="text-[10px] font-extrabold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-widest text-center mb-3">
              {language === 'so' ? '1-Guji ku tijaabi Doorarka (Roles)' : 'One-Click Role Demonstration'}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin@supermarket.so', 'Super Admin')}
                className="p-2 text-left rounded-xl border border-[#E2E8F0] dark:border-[#263449] hover:border-purple-500 dark:hover:border-purple-500 bg-[#F8FAFC] dark:bg-[#172338] text-[#0F172A] dark:text-[#F8FAFC] transition-all hover:scale-[1.02] cursor-pointer"
              >
                <div className="font-extrabold text-purple-600 dark:text-purple-400">Super Admin</div>
                <div className="text-[10px] text-[#64748B] dark:text-[#94A3B8]">Ahmed Noor</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('fadumo.mgr@supermarket.so', 'Manager')}
                className="p-2 text-left rounded-xl border border-[#E2E8F0] dark:border-[#263449] hover:border-blue-500 dark:hover:border-blue-500 bg-[#F8FAFC] dark:bg-[#172338] text-[#0F172A] dark:text-[#F8FAFC] transition-all hover:scale-[1.02] cursor-pointer"
              >
                <div className="font-extrabold text-blue-600 dark:text-blue-400">Manager</div>
                <div className="text-[10px] text-[#64748B] dark:text-[#94A3B8]">Fadumo Warsame</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('hassan.cashier@supermarket.so', 'Cashier')}
                className="p-2 text-left rounded-xl border border-[#E2E8F0] dark:border-[#263449] hover:border-emerald-500 dark:hover:border-emerald-500 bg-[#F8FAFC] dark:bg-[#172338] text-[#0F172A] dark:text-[#F8FAFC] transition-all hover:scale-[1.02] cursor-pointer"
              >
                <div className="font-extrabold text-emerald-600 dark:text-emerald-400">Cashier</div>
                <div className="text-[10px] text-[#64748B] dark:text-[#94A3B8]">Hassan Ali</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('khadija.inv@supermarket.so', 'Inventory Manager')}
                className="p-2 text-left rounded-xl border border-[#E2E8F0] dark:border-[#263449] hover:border-amber-500 dark:hover:border-amber-500 bg-[#F8FAFC] dark:bg-[#172338] text-[#0F172A] dark:text-[#F8FAFC] transition-all hover:scale-[1.02] cursor-pointer"
              >
                <div className="font-extrabold text-amber-600 dark:text-amber-400">Inventory Mgr</div>
                <div className="text-[10px] text-[#64748B] dark:text-[#94A3B8]">Khadija Osman</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('jama.acc@supermarket.so', 'Accountant')}
                className="p-2 text-left rounded-xl border border-[#E2E8F0] dark:border-[#263449] hover:border-cyan-500 dark:hover:border-cyan-500 bg-[#F8FAFC] dark:bg-[#172338] text-[#0F172A] dark:text-[#F8FAFC] transition-all hover:scale-[1.02] cursor-pointer"
              >
                <div className="font-extrabold text-cyan-600 dark:text-cyan-400">Accountant</div>
                <div className="text-[10px] text-[#64748B] dark:text-[#94A3B8]">Mohamed Jama</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('sahra.audit@supermarket.so', 'Auditor')}
                className="p-2 text-left rounded-xl border border-[#E2E8F0] dark:border-[#263449] hover:border-rose-500 dark:hover:border-rose-500 bg-[#F8FAFC] dark:bg-[#172338] text-[#0F172A] dark:text-[#F8FAFC] transition-all hover:scale-[1.02] cursor-pointer"
              >
                <div className="font-extrabold text-rose-600 dark:text-rose-400">Auditor</div>
                <div className="text-[10px] text-[#64748B] dark:text-[#94A3B8]">Sahra Abdi</div>
              </button>
            </div>
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-[#64748B] dark:text-[#94A3B8] font-medium">
          SomSupermarket Management System • Production Grade
        </p>
      </div>
    </div>
  )
}
