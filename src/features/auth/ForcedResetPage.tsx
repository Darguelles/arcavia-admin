import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'
import { changePasswordSchema, type ChangePasswordForm } from '../../lib/validation'
import { FormField } from '../../components/FormField'
import { t } from '../../lib/i18n'
import { useToast } from '../../components/Toast'
import { ApiClientError } from '../../api/client'

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
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm">
        <h1 className="text-xl font-bold text-gray-900 mb-2">{t.setNewPassword}</h1>
        <p className="text-sm text-gray-500 mb-6">
          Tu cuenta requiere que establezcas una nueva contraseña antes de continuar.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
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
            <p role="alert" className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
              {errors.root.message}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg py-2.5 text-sm transition-colors disabled:opacity-60 mt-2"
          >
            {isSubmitting ? t.loading : t.save}
          </button>
        </form>
      </div>
    </div>
  )
}
