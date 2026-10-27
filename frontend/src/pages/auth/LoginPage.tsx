import * as React from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Store, Lock, Mail, ArrowRight, ShieldCheck, UserCheck } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/components/ui/Toast'
import type { Role } from '@/types'

export const LoginPage: React.FC = () => {
  const [email, setEmail] = React.useState('admin@supermarket.so')
  const [password, setPassword] = React.useState('Supermarket@2026')
  const [loading, setLoading] = React.useState(false)
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null)

  const { login } = useAuthStore()
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
      success(`Welcome back, ${user.name}!`, `Logged in as ${user.role}`)
      navigate('/')
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
      success(`Logged in as ${roleName}`, `Welcome ${user.name}`)
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
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-950 transition-colors">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg mb-3">
          <Store className="h-6 w-6" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          SomSupermarket Central
        </h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Single Supermarket Management System — Staff Portal
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white dark:bg-slate-900 py-8 px-6 sm:px-10 shadow-xl rounded-2xl border border-slate-200 dark:border-slate-800">
          {expired && (
            <div className="mb-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300">
              Your session has expired. Please log in again to continue.
            </div>
          )}

          {resetSuccess && (
            <div className="mb-4 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300">
              Password has been successfully updated! Please log in with your new password.
            </div>
          )}

          {errorMsg && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Staff Email Address"
              type="email"
              required
              leftIcon={<Mail className="h-4 w-4" />}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. admin@supermarket.so"
            />

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Forgot Password?
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
              Sign In to Store Portal
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>

          {/* Quick Demo Role Switcher */}
          <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-center mb-3">
              One-Click Role Demonstration
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin@supermarket.so', 'Super Admin')}
                className="p-2 text-left rounded-lg border border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 transition"
              >
                <div className="font-semibold text-purple-600 dark:text-purple-400">Super Admin</div>
                <div className="text-[10px] text-slate-400">All access</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('fadumo.mgr@supermarket.so', 'Manager')}
                className="p-2 text-left rounded-lg border border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 transition"
              >
                <div className="font-semibold text-blue-600 dark:text-blue-400">Manager</div>
                <div className="text-[10px] text-slate-400">Ops & Approvals</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('hassan.cashier@supermarket.so', 'Cashier')}
                className="p-2 text-left rounded-lg border border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 transition"
              >
                <div className="font-semibold text-emerald-600 dark:text-emerald-400">Cashier</div>
                <div className="text-[10px] text-slate-400">POS checkout</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('khadija.inv@supermarket.so', 'Inventory Manager')}
                className="p-2 text-left rounded-lg border border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 transition"
              >
                <div className="font-semibold text-amber-600 dark:text-amber-400">Inventory Mgr</div>
                <div className="text-[10px] text-slate-400">Stock & Batches</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('jama.acc@supermarket.so', 'Accountant')}
                className="p-2 text-left rounded-lg border border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 transition"
              >
                <div className="font-semibold text-cyan-600 dark:text-cyan-400">Accountant</div>
                <div className="text-[10px] text-slate-400">Finance & P&L</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('sahra.audit@supermarket.so', 'Auditor')}
                className="p-2 text-left rounded-lg border border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 transition"
              >
                <div className="font-semibold text-rose-600 dark:text-rose-400">Auditor</div>
                <div className="text-[10px] text-slate-400">Audit trail & Logs</div>
              </button>
            </div>
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-slate-400">
          Single Supermarket Management System • Production Grade
        </p>
      </div>
    </div>
  )
}
