import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { Check, CircleAlert, ShieldCheck } from 'lucide-react'
import { useAuth, type MfaChallenge } from '../../auth/useAuth'
import { loginSchema, type LoginForm } from '../../lib/validation'
import { FormField } from '../../components/FormField'
import { btnPrimary, linkAction } from '../../components/ui'
import { cn } from '../../lib/utils'
import { t } from '../../lib/i18n'
import { translateApiError } from '../../lib/apiErrors'
import { ApiClientError } from '../../api/client'
import { AuthShell, AuthHeading } from './AuthShell'

type Step =
  | { name: 'password' }
  | { name: 'totp'; mfaToken: string }
  | { name: 'enroll'; mfaToken: string; secret: string; otpauthUri: string }
  | { name: 'recovery'; codes: string[]; forceReset: boolean }

const submitButton = cn(btnPrimary, 'h-11 w-full text-[15px]')

function AlertMessage({ children }: { children: React.ReactNode }) {
  return (
    <p role="alert" className="m-0 flex items-center gap-2 text-[13px] text-danger">
      <CircleAlert aria-hidden size={15} className="shrink-0" strokeWidth={1.5} />
      {children}
    </p>
  )
}

export function LoginPage() {
  const { login, mfaVerify, mfaEnrollStart, mfaEnrollConfirm, forceReset } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>({ name: 'password' })
  const [code, setCode] = useState('')
  const [useRecovery, setUseRecovery] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)

  const {
    register,
    handleSubmit,
    setError: setFormError,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) })

  function finishLogin(mustReset: boolean) {
    navigate(mustReset ? '/admin/reset-password' : '/admin', { replace: true })
  }

  async function startMfaStep(challenge: MfaChallenge) {
    if (challenge.mfa === 'totp') {
      setStep({ name: 'totp', mfaToken: challenge.mfaToken })
    } else {
      const enroll = await mfaEnrollStart(challenge.mfaToken)
      setStep({
        name: 'enroll',
        mfaToken: challenge.mfaToken,
        secret: enroll.secret,
        otpauthUri: enroll.otpauth_uri,
      })
    }
  }

  async function onSubmitPassword(data: LoginForm) {
    setError(null)
    try {
      const result = await login(data.email, data.password)
      if (result.kind === 'session') {
        finishLogin(forceReset)
      } else {
        await startMfaStep(result.challenge)
      }
    } catch (err) {
      const message =
        err instanceof ApiClientError
          ? translateApiError(err)
          : err instanceof Error
            ? err.message
            : t.loginError
      setFormError('root', { message })
    }
  }

  async function onSubmitCode() {
    setError(null)
    setBusy(true)
    try {
      if (step.name === 'totp') {
        const data = await mfaVerify(step.mfaToken, useRecovery ? { recoveryCode: code } : { code })
        finishLogin(!!data.force_password_reset)
      } else if (step.name === 'enroll') {
        const data = await mfaEnrollConfirm(step.mfaToken, code)
        setStep({
          name: 'recovery',
          codes: data.recovery_codes,
          forceReset: !!data.force_password_reset,
        })
      }
    } catch (err) {
      if (
        err instanceof ApiClientError &&
        ['MFA_TOKEN_EXPIRED', 'INVALID_MFA_TOKEN'].includes(err.code)
      ) {
        setStep({ name: 'password' })
        setCode('')
        setError(t.mfaTokenExpired)
      } else {
        setError(translateApiError(err))
      }
    } finally {
      setBusy(false)
    }
  }

  async function copyRecoveryCodes(codes: string[]) {
    try {
      await navigator.clipboard.writeText(codes.join('\n'))
      setCopied(true)
    } catch {
      // clipboard unavailable — codes remain selectable
    }
  }

  function backToLogin() {
    setStep({ name: 'password' })
    setCode('')
    setUseRecovery(false)
    setError(null)
  }

  const codeForm = (title: string, hint: string, submitLabel: string, extra?: React.ReactNode) => (
    <>
      <AuthHeading overline={t.loginOverline} title={title} />
      <form
        onSubmit={(e) => {
          e.preventDefault()
          void onSubmitCode()
        }}
        className="flex flex-col gap-[18px]"
      >
        <p className="m-0 text-[13px] leading-5 text-muted">{hint}</p>
        {extra}
        <FormField
          as="input"
          label={useRecovery ? t.mfaRecoveryCodeLabel : t.mfaCodeLabel}
          type="text"
          inputMode={useRecovery ? 'text' : 'numeric'}
          autoComplete="one-time-code"
          autoFocus
          required
          name="mfa-code"
          value={code}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCode(e.target.value)}
        />
        {error && <AlertMessage>{error}</AlertMessage>}
        <button type="submit" disabled={busy || code.trim().length === 0} className={submitButton}>
          {busy ? t.loading : submitLabel}
        </button>
        {step.name === 'totp' && (
          <button
            type="button"
            onClick={() => {
              setUseRecovery(!useRecovery)
              setCode('')
              setError(null)
            }}
            className={cn(linkAction, 'self-start')}
          >
            {useRecovery ? t.mfaUseTotpCode : t.mfaUseRecoveryCode}
          </button>
        )}
        <button
          type="button"
          onClick={backToLogin}
          className="self-start cursor-pointer border-0 bg-transparent p-0 text-[13px] text-muted hover:text-ink"
        >
          {t.backToLogin}
        </button>
      </form>
    </>
  )

  return (
    <AuthShell>
      {step.name === 'password' && (
        <>
          <AuthHeading overline={t.loginOverline} title={t.loginWelcome} />
          <form
            onSubmit={handleSubmit(onSubmitPassword)}
            className="flex flex-col gap-[18px]"
            noValidate
          >
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

            {(errors.root?.message || error) && (
              <AlertMessage>{errors.root?.message ?? error}</AlertMessage>
            )}

            <button type="submit" disabled={isSubmitting} className={submitButton}>
              {isSubmitting ? t.loading : t.loginButton}
            </button>

            <p className="m-0 flex items-center gap-2 text-[13px] text-muted">
              <ShieldCheck aria-hidden size={15} className="shrink-0 text-gold-deep" />
              {t.loginMfaNote}
            </p>
          </form>
        </>
      )}

      {step.name === 'totp' && codeForm(t.mfaTitle, t.mfaCodeHint, t.mfaVerifyButton)}

      {step.name === 'enroll' &&
        codeForm(
          t.mfaEnrollTitle,
          t.mfaEnrollIntro,
          t.mfaEnrollConfirmButton,
          <div className="flex flex-col items-center gap-3">
            <div className="rounded-control border border-line bg-surface p-3">
              <QRCodeSVG value={step.otpauthUri} size={168} />
            </div>
            <p className="m-0 text-[13px] text-muted">{t.mfaEnrollManual}</p>
            <code className="select-all break-all rounded-control border border-line bg-surface px-3 py-1.5 font-mono text-xs text-ink">
              {step.secret}
            </code>
          </div>
        )}

      {step.name === 'recovery' && (
        <>
          <AuthHeading overline={t.loginOverline} title={t.mfaRecoveryCodesTitle} />
          <div className="flex flex-col gap-[18px]">
            <p className="m-0 rounded-control bg-warn-tint px-4 py-3 text-[13px] leading-5 text-warn-text">
              {t.mfaRecoveryCodesHint}
            </p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 rounded-control border border-line bg-surface p-4 font-mono">
              {step.codes.map((c) => (
                <code key={c} className="select-all text-sm text-ink">
                  {c}
                </code>
              ))}
            </div>
            <button
              type="button"
              onClick={() => void copyRecoveryCodes(step.codes)}
              className={cn(linkAction, 'inline-flex items-center gap-1.5 self-start')}
            >
              {copied && <Check aria-hidden size={13} strokeWidth={2} />}
              {copied ? t.mfaRecoveryCodesCopied : t.copy}
            </button>
            <button
              type="button"
              onClick={() => finishLogin(step.forceReset)}
              className={submitButton}
            >
              {t.mfaRecoveryCodesContinue}
            </button>
          </div>
        </>
      )}
    </AuthShell>
  )
}
