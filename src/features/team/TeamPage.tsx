import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { type ColumnDef } from '@tanstack/react-table'
import { ArrowRight, Check, Plus } from 'lucide-react'
import { DataTable } from '../../components/DataTable'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { FormField } from '../../components/FormField'
import { useToast } from '../../components/Toast'
import { Badge, btnGhost, btnPrimary, btnRowAction, linkAction } from '../../components/ui'
import { cn } from '../../lib/utils'
import { t } from '../../lib/i18n'
import { translateApiError } from '../../lib/apiErrors'
import { teamCreateSchema, type TeamCreateForm } from '../../lib/validation'
import {
  useCreateTeamMember,
  useResetTeamMfa,
  useResetTeamPassword,
  useTeam,
  useUpdateTeamMember,
  type TeamMember,
} from '../../api/team'
import { useAuthStore } from '../../auth/store'

const ROLE_LABELS: Record<TeamMember['role'], string> = {
  root: t.teamRoleRoot,
  admin: t.teamRoleAdmin,
  staff: t.teamRoleStaff,
}

const btnRowDanger = cn(
  btnRowAction,
  'text-danger border-danger-line hover:border-danger hover:bg-danger-tint'
)
const btnRowSuccess = cn(
  btnRowAction,
  'text-success-deep border-success-line hover:border-success hover:bg-success-tint'
)

type PendingAction =
  | { kind: 'deactivate'; member: TeamMember }
  | { kind: 'activate'; member: TeamMember }
  | { kind: 'resetPassword'; member: TeamMember }
  | { kind: 'resetMfa'; member: TeamMember }
  | { kind: 'changeRole'; member: TeamMember; role: 'admin' | 'staff' }

export function TeamPage() {
  const { data: members = [], isLoading } = useTeam()
  const createMember = useCreateTeamMember()
  const updateMember = useUpdateTeamMember()
  const resetPassword = useResetTeamPassword()
  const resetMfa = useResetTeamMfa()
  const toast = useToast()
  const myUserId = useAuthStore((s) => s.userId)

  const [showCreate, setShowCreate] = useState(false)
  const [pending, setPending] = useState<PendingAction | null>(null)
  const [tempPassword, setTempPassword] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const {
    register,
    handleSubmit,
    reset: resetForm,
    formState: { errors, isSubmitting },
  } = useForm<TeamCreateForm>({
    resolver: zodResolver(teamCreateSchema),
    defaultValues: { role: 'staff' },
  })

  async function onCreate(data: TeamCreateForm) {
    try {
      const result = await createMember.mutateAsync(data)
      setShowCreate(false)
      resetForm()
      setTempPassword(result.temp_password)
      toast.success(t.teamCreated)
    } catch (err) {
      toast.error(translateApiError(err))
    }
  }

  async function onConfirmPending() {
    if (!pending) return
    const { member } = pending
    try {
      if (pending.kind === 'deactivate' || pending.kind === 'activate') {
        await updateMember.mutateAsync({ id: member.id, is_active: pending.kind === 'activate' })
        toast.success(t.teamUpdated)
      } else if (pending.kind === 'changeRole') {
        await updateMember.mutateAsync({ id: member.id, role: pending.role })
        toast.success(t.teamUpdated)
      } else if (pending.kind === 'resetPassword') {
        const result = await resetPassword.mutateAsync(member.id)
        setTempPassword(result.temp_password)
      } else {
        await resetMfa.mutateAsync(member.id)
        toast.success(t.teamMfaResetDone)
      }
      setPending(null)
    } catch (err) {
      setPending(null)
      toast.error(translateApiError(err))
    }
  }

  async function copyPassword() {
    if (!tempPassword) return
    try {
      await navigator.clipboard.writeText(tempPassword)
      setCopied(true)
    } catch {
      // clipboard unavailable — value stays selectable
    }
  }

  const columns = useMemo<ColumnDef<TeamMember, unknown>[]>(
    () => [
      {
        id: 'email',
        header: t.email,
        cell: ({ row }) => (
          <div>
            <p className="m-0 font-medium text-ink">{row.original.display_name}</p>
            <p className="m-0 mt-0.5 text-xs text-faint">{row.original.email}</p>
          </div>
        ),
      },
      {
        id: 'role',
        header: t.colRole,
        cell: ({ row }) => (
          <Badge variant={row.original.role === 'staff' ? 'neutral' : 'admin'}>
            {ROLE_LABELS[row.original.role]}
          </Badge>
        ),
      },
      {
        id: 'status',
        header: t.filterStatus,
        cell: ({ row }) => (
          <Badge variant={row.original.is_active ? 'success' : 'neutral'}>
            {row.original.is_active ? t.active : t.inactive}
          </Badge>
        ),
      },
      {
        id: 'mfa',
        header: t.teamColMfa,
        cell: ({ row }) => (
          <Badge variant={row.original.mfa_enrolled ? 'success' : 'warn'}>
            {row.original.mfa_enrolled ? t.teamMfaEnrolled : t.teamMfaPending}
          </Badge>
        ),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => {
          const member = row.original
          // root and yourself are managed outside this screen (seed script)
          if (member.role === 'root' || member.id === myUserId) return null
          return (
            <div className="flex flex-wrap gap-2 justify-end">
              <button
                type="button"
                onClick={() =>
                  setPending({
                    kind: 'changeRole',
                    member,
                    role: member.role === 'admin' ? 'staff' : 'admin',
                  })
                }
                className={btnRowAction}
              >
                <ArrowRight size={13} strokeWidth={1.5} aria-hidden />
                {member.role === 'admin' ? t.teamRoleStaff : t.teamRoleAdmin}
              </button>
              <button
                type="button"
                onClick={() => setPending({ kind: 'resetPassword', member })}
                className={btnRowAction}
              >
                {t.resetPassword}
              </button>
              <button
                type="button"
                onClick={() => setPending({ kind: 'resetMfa', member })}
                className={btnRowAction}
              >
                {t.teamResetMfa}
              </button>
              <button
                type="button"
                onClick={() =>
                  setPending({ kind: member.is_active ? 'deactivate' : 'activate', member })
                }
                className={member.is_active ? btnRowDanger : btnRowSuccess}
              >
                {member.is_active ? t.deactivate : t.activate}
              </button>
            </div>
          )
        },
      },
    ],
    [myUserId]
  )

  const confirmCopy: Record<
    string,
    { title: string; message: string; variant?: 'danger' | 'warning' }
  > = pending
    ? {
        deactivate: {
          title: t.deactivate,
          message: t.deactivateUserConfirm(pending.member.email),
          variant: 'danger' as const,
        },
        activate: {
          title: t.activate,
          message: t.activateUserConfirm(pending.member.email),
        },
        resetPassword: {
          title: t.resetPassword,
          message: t.resetPasswordConfirm(pending.member.email),
          variant: 'warning' as const,
        },
        resetMfa: {
          title: t.teamResetMfa,
          message: t.teamResetMfaConfirm(pending.member.email),
          variant: 'warning' as const,
        },
        changeRole: {
          title: t.teamChangeRole,
          message: t.teamChangeRoleConfirm(
            pending.member.email,
            pending.kind === 'changeRole' ? ROLE_LABELS[pending.role] : ''
          ),
        },
      }
    : {}

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className={cn(btnPrimary, 'ml-auto')}
        >
          <Plus size={18} strokeWidth={1.5} aria-hidden />
          {t.teamNew}
        </button>
      </div>

      <DataTable data={members} columns={columns} loading={isLoading} />

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-ink/50" onClick={() => setShowCreate(false)} />
          <div
            className="relative bg-surface rounded-card shadow-float p-6 max-w-md w-full mx-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="team-create-title"
          >
            <h2 id="team-create-title" className="text-[17px] font-semibold text-ink mb-4">
              {t.teamCreateTitle}
            </h2>
            <form onSubmit={handleSubmit(onCreate)} className="flex flex-col gap-4" noValidate>
              <FormField
                as="input"
                label={t.email}
                type="email"
                required
                error={errors.email?.message}
                {...register('email')}
              />
              <FormField
                as="input"
                label={t.name}
                type="text"
                required
                error={errors.display_name?.message}
                {...register('display_name')}
              />
              <FormField as="select" label={t.teamRoleLabel} required {...register('role')}>
                <option value="staff">{t.teamRoleStaff}</option>
                <option value="admin">{t.teamRoleAdmin}</option>
              </FormField>
              <div className="flex justify-end gap-2.5 mt-2">
                <button type="button" onClick={() => setShowCreate(false)} className={btnGhost}>
                  {t.cancel}
                </button>
                <button type="submit" disabled={isSubmitting} className={btnPrimary}>
                  {t.create}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Row-action confirms */}
      {pending && (
        <ConfirmDialog
          open
          title={confirmCopy[pending.kind].title}
          message={confirmCopy[pending.kind].message}
          confirmLabel={confirmCopy[pending.kind].title}
          variant={confirmCopy[pending.kind].variant}
          onConfirm={onConfirmPending}
          onCancel={() => setPending(null)}
          loading={updateMember.isPending || resetPassword.isPending || resetMfa.isPending}
        />
      )}

      {/* One-time temp password reveal (same pattern as UserDetail §6.7) */}
      {tempPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-ink/50" />
          <div
            className="relative bg-surface rounded-card shadow-float p-6 max-w-md w-full mx-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="team-temp-pw-title"
          >
            <h2 id="team-temp-pw-title" className="text-[17px] font-semibold text-ink mb-2">
              {t.tempPasswordTitle}
            </h2>
            <p className="text-[13px] leading-5 text-warn-text bg-warn-tint rounded-control px-4 py-3 mb-4">
              {t.tempPasswordHint}
            </p>
            <div className="flex items-center gap-2 bg-line-soft rounded-control px-4 py-3 mb-4">
              <code className="flex-1 text-lg font-mono text-ink select-all">{tempPassword}</code>
              <button
                type="button"
                onClick={copyPassword}
                className={cn(linkAction, 'inline-flex items-center gap-1 whitespace-nowrap')}
              >
                {copied && <Check size={13} strokeWidth={2} aria-hidden />}
                {copied ? 'Copiado' : t.copy}
              </button>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setTempPassword(null)
                  setCopied(false)
                }}
                className="h-10 px-4 inline-flex items-center rounded-control bg-ink text-cream text-sm font-medium cursor-pointer hover:opacity-90"
              >
                {t.close} — ya copié la contraseña
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
