import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'
import { loginSchema, type LoginForm } from '../../lib/validation'
import { FormField } from '../../components/FormField'
import { t } from '../../lib/i18n'
import { ApiClientError } from '../../api/client'

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) })

  async function onSubmit(data: LoginForm) {
    try {
      const result = await login(data.email, data.password)
      if (result.force_password_reset) {
        navigate('/admin/reset-password', { replace: true })
      } else {
        navigate('/admin', { replace: true })
      }
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError('root', { message: err.message })
      } else if (err instanceof Error) {
        setError('root', { message: err.message })
      } else {
        setError('root', { message: t.loginError })
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-indigo-700">Arcavia</h1>
          <p className="text-sm text-gray-500 mt-1">Panel de administración</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          <FormField
            as="input"
            label={t.email}
            type="email"
            autoComplete="email"
            required
            error={errors.email?.message}
            {...register('email')}
          />

          <FormField
            as="input"
            label={t.password}
            type="password"
            autoComplete="current-password"
            required
            error={errors.password?.message}
            {...register('password')}
          />

          {errors.root?.message && (
            <p role="alert" className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
              {errors.root.message}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg py-2.5 text-sm transition-colors disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 mt-2"
          >
            {isSubmitting ? t.loading : t.loginButton}
          </button>
        </form>
      </div>
    </div>
  )
}
