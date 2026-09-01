import { describe, it, expect } from 'vitest'
import { translateApiError } from '../../src/lib/apiErrors'
import { ApiClientError } from '../../src/api/client'
import { t } from '../../src/lib/i18n'

const err = (code: string, message = 'x', status = 400) => new ApiClientError(status, code, message)

describe('translateApiError', () => {
  it('maps the three MISSION_NOT_COMPLETABLE variants, extracting names', () => {
    expect(
      translateApiError(
        err('MISSION_NOT_COMPLETABLE', 'Mission needs at least one phase and one category.', 409)
      )
    ).toBe(t.errMissionNeedsStructure)

    expect(
      translateApiError(
        err('MISSION_NOT_COMPLETABLE', "Phase 'Fase 1' has no active waypoint.", 409)
      )
    ).toBe(t.errPhaseNoActiveWaypoint('Fase 1'))

    expect(
      translateApiError(
        err('MISSION_NOT_COMPLETABLE', "Category 'Cultural' has no points to earn.", 409)
      )
    ).toBe(t.errCategoryNoPoints('Cultural'))
  })

  it('falls back to the generic structure message on an unrecognized completability text', () => {
    expect(translateApiError(err('MISSION_NOT_COMPLETABLE', 'Something new.', 409))).toBe(
      t.errMissionNeedsStructure
    )
  })

  it('maps the other known backend codes to Spanish', () => {
    expect(translateApiError(err('WAYPOINT_HAS_NO_CHALLENGES', '', 409))).toBe(
      t.waypointNoChallengesHint
    )
    expect(translateApiError(err('GEO_ONLY_PRIZE_CONFLICT'))).toBe(t.geoOnlyPrizeConflict)
    expect(translateApiError(err('KEYWORD_REQUIRED'))).toBe(t.errKeywordRequired)
    expect(translateApiError(err('CATEGORY_IN_USE', '', 409))).toBe(t.errCategoryInUse)
    expect(translateApiError(err('PHASE_IN_USE', '', 409))).toBe(t.errPhaseInUse)
    expect(translateApiError(err('INVALID_OPTIONS'))).toBe(t.errInvalidOptions)
    expect(translateApiError(err('CATEGORY_MISSION_MISMATCH'))).toBe(t.errCategoryMissionMismatch)
    expect(translateApiError(err('INVALID_IMAGE_TYPE'))).toBe(t.invalidImageType)
    expect(translateApiError(err('IMAGE_TOO_LARGE', '', 413))).toBe(t.imageTooLarge)
  })

  it('passes through the client-raised Spanish messages', () => {
    expect(translateApiError(err('UNAUTHORIZED', 'Sesión expirada', 401))).toBe('Sesión expirada')
  })

  it('returns the generic error for unknown codes and non-API errors', () => {
    expect(translateApiError(err('SOMETHING_ELSE', 'English internals'))).toBe(t.error)
    expect(translateApiError(new Error('boom'))).toBe(t.error)
    expect(translateApiError(undefined)).toBe(t.error)
  })
})
