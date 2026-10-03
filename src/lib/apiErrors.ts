import { ApiClientError } from '../api/client'
import { t } from './i18n'

// MISSION_NOT_COMPLETABLE is a single code with three causes, distinguishable
// only by the backend's English message text (arcavia-api app/services/admin.py,
// assert_mission_completable) — hence the regexes.
const PHASE_NO_ACTIVE_WAYPOINT = /^Phase '(.+)' has no active waypoint\.$/
const CATEGORY_NO_POINTS = /^Category '(.+)' has no points/

/**
 * Map a caught API error to a Spanish, operator-readable message. The backend
 * speaks English; every toast in the missions area should go through here so
 * no raw backend string (or swallowed error) reaches the UI.
 */
export function translateApiError(err: unknown): string {
  if (!(err instanceof ApiClientError)) return t.error
  switch (err.code) {
    case 'MISSION_NOT_COMPLETABLE': {
      const phase = err.message.match(PHASE_NO_ACTIVE_WAYPOINT)
      if (phase) return t.errPhaseNoActiveWaypoint(phase[1])
      const category = err.message.match(CATEGORY_NO_POINTS)
      if (category) return t.errCategoryNoPoints(category[1])
      return t.errMissionNeedsStructure
    }
    case 'WAYPOINT_HAS_NO_CHALLENGES':
      return t.waypointNoChallengesHint
    case 'WAYPOINT_ARCHIVED':
      return t.errWaypointArchived
    case 'WAYPOINT_NOT_ARCHIVED':
      return t.errWaypointNotArchived
    case 'MISSION_ARCHIVED':
      return t.errMissionArchived
    case 'MISSION_NOT_ARCHIVED':
      return t.errMissionNotArchived
    case 'PHASE_ARCHIVED':
      return t.errPhaseArchived
    case 'GEO_ONLY_PRIZE_CONFLICT':
      return t.geoOnlyPrizeConflict
    case 'KEYWORD_REQUIRED':
      return t.errKeywordRequired
    case 'CATEGORY_IN_USE':
      return t.errCategoryInUse
    case 'PHASE_IN_USE':
      return t.errPhaseInUse
    case 'INVALID_OPTIONS':
      return t.errInvalidOptions
    case 'CHALLENGE_OPTION_IN_USE':
      return t.errChallengeOptionInUse
    case 'CHALLENGE_IN_USE':
      return t.errChallengeInUse
    case 'CATEGORY_MISSION_MISMATCH':
      return t.errCategoryMissionMismatch
    case 'INVALID_IMAGE_TYPE':
      return t.invalidImageType
    case 'IMAGE_TOO_LARGE':
      return t.imageTooLarge
    case 'INVALID_MFA_CODE':
      return t.mfaInvalidCode
    case 'MFA_TOKEN_EXPIRED':
    case 'INVALID_MFA_TOKEN':
      return t.mfaTokenExpired
    case 'MFA_ENROLLMENT_REQUIRED':
      return t.mfaEnrollRequired
    case 'CANNOT_MODIFY_SELF':
      return t.errCannotModifySelf
    case 'CANNOT_MODIFY_ROOT':
      return t.errCannotModifyRoot
    case 'EMAIL_TAKEN':
      return t.errEmailTaken
    case 'SLUG_TAKEN':
      return t.errSlugTaken
    case 'INVALID_CREDENTIALS':
      return t.loginError
    // The client itself raises these two with Spanish messages.
    case 'UNAUTHORIZED':
    case 'PASSWORD_RESET_REQUIRED':
      return err.message
    default:
      return t.error
  }
}
