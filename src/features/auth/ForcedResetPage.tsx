import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { CircleAlert } from 'lucide-react'
import { useAuth } from '../../auth/useAuth'
import { changePasswordSchema, type ChangePasswordForm } from '../../lib/validation'
import { FormField } from '../../components/FormField'
import { btnPrimary } from '../../components/ui'
import { cn } from '../../lib/utils'
import { t } from '../../lib/i18n'
import { useToast } from '../../components/Toast'
import { ApiClientError } from '../../api/client'
import { AuthShell, AuthHeading } from './AuthShell'

/**
 * Mandatory password-reset screen (spec §4.4).
 * Blocks all other navigation until the password is changed.
 */
export function ForcedResetPage() {
  const { changePassword } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordForm>({ resolver: zodResolver(changePasswordSchema) })

  async function onSubmit(data: ChangePasswordForm) {
    try {
      await changePassword(data.current_password, data.new_password)
      toast.success(t.passwordChanged)
      navigate('/admin', { replace: true })
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError('root', { message: err.message })
      } else {
        setError('root', { message: t.error })
      }
    }
  }

  return (
    <AuthShell>
      <AuthHeading overline={t.loginOverline} title={t.setNewPassword} />
      <p className="m-0 text-[13px] leading-5 text-muted">
        Tu cuenta requiere que establezcas una nueva contraseña antes de continuar.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-[18px]" noValidate>
        <FormField
          as="input"
          label={t.currentPassword}
          type="password"
          autoComplete="current-password"
          required
          error={errors.current_password?.message}
          {...register('current_password')}
        />

        <FormField
          as="input"
          label={t.newPassword}
          type="password"
          autoComplete="new-password"
          required
          hint="Mínimo 8 caracteres"
          error={errors.new_password?.message}
          {...register('new_password')}
        />

        <FormField
          as="input"
          label={t.confirmPassword}
          type="password"
          autoComplete="new-password"
          required
          error={errors.confirm_password?.message}
          {...register('confirm_password')}
        />

        {errors.root?.message && (
          <p role="alert" className="m-0 flex items-center gap-2 text-[13px] text-danger">
            <CircleAlert aria-hidden size={15} className="shrink-0" strokeWidth={1.5} />
            {errors.root.message}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className={cn(btnPrimary, 'h-11 w-full text-[15px]')}
        >
          {isSubmitting ? t.loading : t.save}
        </button>
      </form>
    </AuthShell>
  )
}
