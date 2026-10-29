import * as React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ShieldAlert, ArrowLeft, ArrowRight, UserCheck } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useLanguageStore } from '@/stores/languageStore'
import {
  isPathAllowedForRole,
  ROLE_DEFAULT_REDIRECT,
  ROLE_DESCRIPTIONS_SO,
} from '@/utils/permissions'
import { Button } from '@/components/ui/Button'

export const RoleGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, switchRoleUser } = useAuthStore()
  const { t, language } = useLanguageStore()
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
        <div className="max-w-md w-full bg-white dark:bg-[#111C31] border border-[#E2E8F0] dark:border-[#263449] rounded-3xl p-6 sm:p-8 text-center shadow-xl animate-in zoom-in-95">
          <div className="h-16 w-16 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-4 shadow-sm">
            <ShieldAlert className="h-8 w-8" />
          </div>

          <h3 className="text-lg font-bold text-[#0F172A] dark:text-[#F8FAFC]">
            {t('guard.restrictedTitle')}
          </h3>

          <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-2">
            {language === 'so' ? 'Adigu waxaad ku jirtaa doorka:' : 'Your assigned staff role:'}
          </p>

          <div className="my-3 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
            <UserCheck className="h-3.5 w-3.5 text-indigo-500" />
            {user.name} ({user.role})
          </div>

          <div className="text-xs text-[#64748B] dark:text-[#94A3B8] leading-relaxed bg-[#F5F7FC] dark:bg-[#172338]/50 p-4 rounded-2xl border border-[#E2E8F0] dark:border-[#263449] text-left">
            <span className="font-bold block text-[#0F172A] dark:text-[#F8FAFC] mb-1">
              {t('guard.yourScope')}
            </span>
            {roleInfo?.job || 'Shaqooyinka u gaarka ah doorkaaga.'}
          </div>

          <div className="mt-6 flex flex-col sm:flex-row gap-2.5 justify-center">
            <Button
              variant="primary"
              onClick={() => navigate(homePath)}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              {t('guard.goBack')} ({homePath === '/pos' ? 'POS' : 'Dashboard'})
            </Button>

            {user.role !== 'Super Admin' && (
              <Button
                variant="outline"
                onClick={() => {
                  switchRoleUser('Super Admin')
                }}
                className="gap-2 text-xs"
              >
                {t('guard.switchToAdmin')}
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
