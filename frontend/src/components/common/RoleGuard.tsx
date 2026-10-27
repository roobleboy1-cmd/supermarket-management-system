import * as React from 'react'
import { useLocation, Link, useNavigate } from 'react-router-dom'
import { ShieldAlert, ArrowLeft, ArrowRight, UserCheck } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import {
  isPathAllowedForRole,
  ROLE_DEFAULT_REDIRECT,
  ROLE_DESCRIPTIONS_SO,
} from '@/utils/permissions'
import { Button } from '@/components/ui/Button'

export const RoleGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, switchRoleUser } = useAuthStore()
  const location = useLocation()
  const navigate = useNavigate()

  if (!user) {
    return <>{children}</>
  }

  const isAllowed = isPathAllowedForRole(user.role, location.pathname)

  if (!isAllowed) {
    const roleInfo = ROLE_DESCRIPTIONS_SO[user.role]
    const homePath = ROLE_DEFAULT_REDIRECT[user.role] || '/'

    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 text-center shadow-lg animate-in zoom-in-95">
          <div className="h-16 w-16 mx-auto rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-4">
            <ShieldAlert className="h-8 w-8" />
          </div>

          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            Qaybtan Shaqadaada Kuma Jirto
          </h3>

          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            Adigu waxaad ku jirtaa doorka:
          </p>

          <div className="my-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            <UserCheck className="h-3.5 w-3.5" />
            {user.name} ({user.role})
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800 text-left">
            <span className="font-semibold block text-slate-900 dark:text-slate-100 mb-0.5">
              Shaqada laguu qoondeeyay:
            </span>
            {roleInfo?.job || 'Shaqooyinka u gaarka ah doorkaaga.'}
          </p>

          <div className="mt-6 flex flex-col sm:flex-row gap-2 justify-center">
            <Button
              variant="primary"
              onClick={() => navigate(homePath)}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Ku Noqo Shaqadaada ({homePath === '/pos' ? 'POS' : 'Dashboard'})
            </Button>

            {user.role !== 'Super Admin' && (
              <Button
                variant="outline"
                onClick={() => {
                  switchRoleUser('Super Admin')
                }}
                className="gap-2 text-xs"
              >
                U Beddel Super Admin
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
