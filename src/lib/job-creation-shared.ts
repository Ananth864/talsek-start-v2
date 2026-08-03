import type { ScreeningInterviewInformationJson } from '#/integrations/supabase/types'

/**
 * Job-creation logistics constants and builders. Ports the source's
 * `jobCreationSchemas` option lists + `buildScreeningInterviewInfo` /
 * `getLocationValue` so the create dialog, create payload, and interview-question
 * generation (via `screening_interview_information`) share one vocabulary.
 *
 * Location-mode casing keeps the port's stored enum (`Work From office`) used by
 * `ScreeningInterviewInformationJson` / createJob Zod — not the source's
 * `Work From Office` display string.
 */

export const EXPECTED_JOINING_DATE_VALUES = [
  'Immediately (0-1 Month)',
  'In 1-2 Months',
  'In 2-3 Months',
] as const

export const LOCATION_MODE_VALUES = [
  'Remote (Anywhere)',
  'Remote (In Country)',
  'Hybrid',
  'Work From office',
] as const

export const HYBRID_WORK_ARRANGEMENT_VALUES = [
  '1 day WFO / 4 days WFH',
  '2 days WFO / 3 days WFH',
  '3 days WFO / 2 days WFH',
  '4 days WFO / 1 day WFH',
] as const

/** Compact Select labels (source JobCreationDialog). */
export const HYBRID_WORK_ARRANGEMENT_LABELS: Record<
  (typeof HYBRID_WORK_ARRANGEMENT_VALUES)[number],
  string
> = {
  '1 day WFO / 4 days WFH': '1/4 Hybrid',
  '2 days WFO / 3 days WFH': '2/3 Hybrid',
  '3 days WFO / 2 days WFH': '3/2 Hybrid',
  '4 days WFO / 1 day WFH': '4/1 Hybrid',
}

export const SHIFT_TIMINGS_TYPE_VALUES = [
  'Standard (9 AM - 5 PM)',
  'Custom',
] as const

export const SHIFT_TIME_VALUES = [
  '00:00',
  '01:00',
  '02:00',
  '03:00',
  '04:00',
  '05:00',
  '06:00',
  '07:00',
  '08:00',
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
  '18:00',
  '19:00',
  '20:00',
  '21:00',
  '22:00',
  '23:00',
] as const

export const TRAVEL_REQUIRED_VALUES = ['Yes', 'No'] as const

export const TRAVEL_PERCENTAGE_VALUES = [
  'Less than 25%',
  '25% - 50%',
  '50% - 75%',
  'More than 75%',
] as const

export type ServiceType = 'resume_only' | 'resume_interview'
export type ExpectedJoiningDate = (typeof EXPECTED_JOINING_DATE_VALUES)[number]
export type LocationMode = (typeof LOCATION_MODE_VALUES)[number]
export type ShiftTimingsType = (typeof SHIFT_TIMINGS_TYPE_VALUES)[number]
export type TravelRequired = (typeof TRAVEL_REQUIRED_VALUES)[number]
export type TravelPercentage = (typeof TRAVEL_PERCENTAGE_VALUES)[number]
export type HybridWorkArrangement =
  (typeof HYBRID_WORK_ARRANGEMENT_VALUES)[number]

export type JobLogisticsFields = {
  expectedJoiningDate: ExpectedJoiningDate
  locationMode: LocationMode
  locationDetails: string
  workArrangement: string
  shiftTimingsType: ShiftTimingsType
  shiftStartTime: string
  shiftEndTime: string
  travelRequired: TravelRequired
  travelPercentage: string
}

export const DEFAULT_SCREENING: ScreeningInterviewInformationJson = {
  expected_joining_date: 'Immediately (0-1 Month)',
  job_type: { mode: 'Remote (Anywhere)', location: '', work_arrangement: '' },
  shift_timings: { start: '09:00', end: '17:00' },
  travel_requirements: 'No',
}

/** Default logistics UI state for a fresh create dialog. */
export const DEFAULT_LOGISTICS: JobLogisticsFields = {
  expectedJoiningDate: 'Immediately (0-1 Month)',
  locationMode: 'Hybrid',
  locationDetails: '',
  workArrangement: '',
  shiftTimingsType: 'Standard (9 AM - 5 PM)',
  shiftStartTime: '',
  shiftEndTime: '',
  travelRequired: 'No',
  travelPercentage: '',
}

/**
 * Builds `screening_interview_information` for createJob. `resume_only` always
 * stores the default shape (edge-schema parity); `resume_interview` maps the
 * logistics form into joining date, job type, shift, and travel so Shortlist /
 * interview-question generation can read them later.
 */
export function buildScreeningInfo(
  serviceType: ServiceType,
  logistics: JobLogisticsFields,
): ScreeningInterviewInformationJson {
  if (serviceType === 'resume_only') return DEFAULT_SCREENING

  const shiftTimings =
    logistics.shiftTimingsType === 'Standard (9 AM - 5 PM)'
      ? DEFAULT_SCREENING.shift_timings
      : {
          start: logistics.shiftStartTime || '',
          end: logistics.shiftEndTime || '',
        }

  const travelRequirements =
    logistics.travelRequired === 'No'
      ? 'No'
      : logistics.travelPercentage || 'No'

  const jobTypeLocation =
    logistics.locationMode === 'Remote (Anywhere)'
      ? ''
      : logistics.locationDetails.trim()

  const workArrangement =
    logistics.locationMode === 'Hybrid'
      ? logistics.workArrangement || ''
      : ''

  return {
    expected_joining_date: logistics.expectedJoiningDate,
    job_type: {
      mode: logistics.locationMode,
      location: jobTypeLocation,
      work_arrangement: workArrangement,
    },
    shift_timings: shiftTimings,
    travel_requirements: travelRequirements,
  }
}

/** Value written to the jobs.location column (source `getLocationValue`). */
export function getJobLocationValue(
  serviceType: ServiceType,
  logistics: JobLogisticsFields,
  resumeOnlyLocation: string,
): string {
  if (serviceType === 'resume_only') return resumeOnlyLocation.trim()
  return logistics.locationMode === 'Remote (Anywhere)'
    ? 'Remote (Anywhere)'
    : logistics.locationDetails.trim()
}

/**
 * Short logistics block appended to the JD text sent to parseJobDescription so
 * the parse input reflects travel / shift / joining (acceptance #28). The AI
 * prompt still excludes soft location/travel prefs from extracted requirements;
 * interview questions continue to read the structured screening JSON.
 */
export function logisticsParseContext(logistics: JobLogisticsFields): string {
  const locationParts: string[] = [logistics.locationMode]
  if (
    logistics.locationMode !== 'Remote (Anywhere)' &&
    logistics.locationDetails.trim()
  ) {
    locationParts.push(logistics.locationDetails.trim())
  }
  if (logistics.locationMode === 'Hybrid' && logistics.workArrangement) {
    locationParts.push(logistics.workArrangement)
  }

  const shift =
    logistics.shiftTimingsType === 'Custom' &&
    logistics.shiftStartTime &&
    logistics.shiftEndTime
      ? `${logistics.shiftStartTime}–${logistics.shiftEndTime}`
      : logistics.shiftTimingsType

  const travel =
    logistics.travelRequired === 'Yes'
      ? logistics.travelPercentage || 'Yes'
      : 'No'

  return [
    '--- Role logistics ---',
    `Expected joining: ${logistics.expectedJoiningDate}`,
    `Location: ${locationParts.join(' · ')}`,
    `Shift: ${shift}`,
    `Travel: ${travel}`,
  ].join('\n')
}

/** Lightweight client-side validation before parse advances (source step-2 gates). */
export function validateLogisticsForParse(
  serviceType: ServiceType,
  logistics: JobLogisticsFields,
): string | null {
  if (serviceType !== 'resume_interview') return null

  if (
    logistics.locationMode !== 'Remote (Anywhere)' &&
    !logistics.locationDetails.trim()
  ) {
    return logistics.locationMode === 'Remote (In Country)'
      ? 'Enter the country for this role.'
      : 'Enter the office location for this role.'
  }

  if (logistics.locationMode === 'Hybrid' && !logistics.workArrangement) {
    return 'Select a hybrid work arrangement.'
  }

  if (logistics.shiftTimingsType === 'Custom') {
    if (!logistics.shiftStartTime || !logistics.shiftEndTime) {
      return 'Select custom shift start and end times.'
    }
  }

  if (logistics.travelRequired === 'Yes' && !logistics.travelPercentage) {
    return 'Select the travel percentage.'
  }

  return null
}
