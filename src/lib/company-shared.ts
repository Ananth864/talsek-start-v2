import { z } from 'zod'

/** Company size options collected at Google OAuth / company-less Profile setup. */
export const COMPANY_SIZE_OPTIONS = [
  { value: '1-10', label: '1-10 employees' },
  { value: '11-50', label: '11-50 employees' },
  { value: '51-200', label: '51-200 employees' },
  { value: '201-500', label: '201-500 employees' },
  { value: '501-1000', label: '501-1000 employees' },
  { value: '1000+', label: '1000+ employees' },
] as const

export type CompanySizeValue = (typeof COMPANY_SIZE_OPTIONS)[number]['value']

export const companySetupSchema = z.object({
  companyName: z
    .string()
    .trim()
    .min(2, 'Company name must be at least 2 characters'),
  companySize: z
    .string()
    .min(1, 'Please select your company size')
    .refine(
      (value): value is CompanySizeValue =>
        COMPANY_SIZE_OPTIONS.some((option) => option.value === value),
      'Please select your company size',
    ),
})

export type CompanySetupInput = z.infer<typeof companySetupSchema>
