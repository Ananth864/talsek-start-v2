import {
  AlertTriangle,
  Briefcase,
  Calendar,
  CheckCircle,
  FileText,
  GraduationCap,
  Mail,
  MessageSquare,
  Star,
  XCircle,
} from 'lucide-react'
import type { RequirementWithAnalysis } from '#/lib/requirements'
import {
  candidateProfileModel,
  formatProfileDate,
} from '#/lib/candidate-profile-model'
import type { JobApplicationRow } from '#/server/fn/job-applications'
import type { JobWithCompanyRow } from '#/server/fn/jobs'

// The prop is named `candidates` for source parity (the bulk ZIP export
// selects on it), although the items are Job Applications (CONTEXT.md).
type CandidateProfilePDFRendererProps = {
  candidates: JobApplicationRow[]
  job?: JobWithCompanyRow | null
}

function RequirementList({
  included,
  emptyLabel,
}: {
  included: RequirementWithAnalysis[]
  emptyLabel: string
}) {
  if (included.length === 0) {
    return <p className="italic text-gray-500">{emptyLabel}</p>
  }
  return (
    <div className="space-y-3">
      {included.map((req, i) => (
        <div
          key={i}
          className={`rounded-lg border-l-4 p-4 ${
            req.meets
              ? 'border-emerald-500 bg-emerald-50'
              : 'border-rose-500 bg-rose-50'
          }`}
        >
          <div className="flex items-start gap-3">
            {req.meets ? (
              <CheckCircle size={18} className="mt-0.5 shrink-0 text-emerald-600" />
            ) : (
              <XCircle size={18} className="mt-0.5 shrink-0 text-rose-600" />
            )}
            <div className="flex-1">
              <p
                className={`font-medium ${
                  req.meets ? 'text-emerald-900' : 'text-rose-900'
                }`}
              >
                {req.text}
              </p>
              {req.evidence ? (
                <p className="mt-2 text-sm leading-relaxed text-gray-600">
                  {req.evidence}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * Hidden component that renders candidate profiles optimized for PDF export
 * (ticket #7; source: `CandidateProfilePDFRenderer.tsx`). Each candidate is a
 * single continuous `[data-pdf-candidate]` section with all tab content, so
 * the export util can rasterise it page-by-page. Colors are fixed grayscale/
 * palette classes on a white background — the PDF ignores the app theme. The
 * Interview section renders its empty state until the interview domain ports
 * (#12); the source's key-regex over loose parsed JSON is replaced by the
 * typed `parsedProfile` accessor (the column is concrete since #6).
 */
export function CandidateProfilePDFRenderer({
  candidates,
  job,
}: CandidateProfilePDFRendererProps) {
  return (
    <div className="bg-white font-sans text-black">
      {candidates.map((app, candidateIndex) => {
        const model = candidateProfileModel(app, job)
        const {
          analysis,
          preferredSummary,
          nonNegotiableSummary,
          profile,
          email,
          emailBody,
          emailAnalysis,
          hasEmailInsights,
          showEmailContent,
        } = model
        const { overallComponent, bonusComponent, overallWeight, preferredWeight, allNonNegMet } =
          model.scoreBreakdown
        // Headline score is the persisted final_score — board parity (ADR-0011 §5).
        const finalScore = model.matchScore

        const candidateName =
          model.candidateName ?? `Candidate_${candidateIndex + 1}`

        const skills = [...profile.technicalSkills, ...profile.softSkills]

        return (
          <div
            key={app.id}
            data-pdf-candidate={candidateIndex}
            data-candidate-name={candidateName}
            className="candidate-profile bg-white p-8"
          >
            {/* HEADER — only shown once per candidate */}
            <div className="mb-6 border-b-2 border-gray-300 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {candidateName}
                  </h1>
                  <div className="mt-1 flex items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <Mail size={14} />
                      {email ?? 'No email'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar size={14} />
                      Applied {formatProfileDate(app.created_at, 'short', 'N/A')}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-blue-600">
                    {finalScore}/100
                  </div>
                  <div className="text-xs uppercase tracking-wider text-gray-500">
                    Final Score
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 1: OVERVIEW */}
            <div className="mb-8">
              <h2 className="mb-4 border-b border-gray-200 pb-2 text-xl font-bold text-gray-800">
                Overview
              </h2>

              <div className="mb-6 grid grid-cols-3 gap-6">
                <div className="rounded-xl border border-blue-100 bg-blue-50 p-5 text-center">
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-blue-600">
                    Overall Fit
                  </div>
                  <div className="text-3xl font-bold text-blue-700">
                    {overallComponent}/{overallWeight}
                  </div>
                </div>
                <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-5 text-center">
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-emerald-600">
                    Bonus Points
                  </div>
                  <div className="text-3xl font-bold text-emerald-700">
                    {preferredWeight > 0
                      ? `${bonusComponent}/${preferredWeight}`
                      : '0/0'}
                  </div>
                </div>
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 text-center">
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-600">
                    Final Score
                  </div>
                  <div className="text-3xl font-bold text-gray-900">
                    {finalScore}/100
                  </div>
                  {!allNonNegMet && (
                    <div className="mt-1 text-xs text-rose-500">
                      Reduced by 50%
                    </div>
                  )}
                </div>
              </div>

              {analysis?.recommendation ? (
                <div className="mb-6 rounded-r-xl border-l-4 border-blue-500 bg-blue-50 p-6">
                  <div className="mb-3 flex items-center gap-2">
                    <Star className="text-blue-600" size={20} />
                    <span className="text-lg font-bold text-gray-900">
                      AI Recommendation
                    </span>
                  </div>
                  <p className="leading-relaxed text-gray-800">
                    {analysis.recommendation.replace(/_/g, ' ')}
                  </p>
                  {analysis.rationale ? (
                    <p className="mt-3 italic leading-relaxed text-gray-600">
                      {analysis.rationale}
                    </p>
                  ) : null}
                </div>
              ) : null}

              <div className="grid grid-cols-2 gap-6">
                {analysis && analysis.strengths_for_role.length > 0 ? (
                  <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-5">
                    <div className="mb-4 flex items-center gap-2">
                      <CheckCircle className="text-emerald-600" size={20} />
                      <span className="font-bold text-gray-900">
                        Key Strengths
                      </span>
                    </div>
                    <ul className="space-y-2">
                      {analysis.strengths_for_role.map((s, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-3 text-sm text-gray-700"
                        >
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                          <span className="leading-relaxed">{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {analysis && analysis.potential_concerns.length > 0 ? (
                  <div className="rounded-xl border border-amber-100 bg-amber-50 p-5">
                    <div className="mb-4 flex items-center gap-2">
                      <AlertTriangle className="text-amber-600" size={20} />
                      <span className="font-bold text-gray-900">
                        Potential Concerns
                      </span>
                    </div>
                    <ul className="space-y-2">
                      {analysis.potential_concerns.map((c, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-3 text-sm text-gray-700"
                        >
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                          <span className="leading-relaxed">{c}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            </div>

            {/* SECTION 2: REQUIREMENT ANALYSIS */}
            <div className="mb-8">
              <h2 className="mb-4 border-b border-gray-200 pb-2 text-xl font-bold text-gray-800">
                Requirement Analysis
              </h2>

              <div className="grid grid-cols-2 gap-8">
                <div>
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-gray-900">
                      Non-Negotiables
                    </h3>
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-semibold">
                      {nonNegotiableSummary.metCount}/
                      {nonNegotiableSummary.totalCount} met
                    </span>
                  </div>
                  <RequirementList
                    included={nonNegotiableSummary.included}
                    emptyLabel="No non-negotiables defined"
                  />
                </div>

                <div>
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-gray-900">
                      Preferred Requirements
                    </h3>
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-semibold">
                      {preferredSummary.metCount}/{preferredSummary.totalCount}{' '}
                      met
                    </span>
                  </div>
                  <RequirementList
                    included={preferredSummary.included}
                    emptyLabel="No preferred requirements defined"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 3: INTERVIEW — empty state until the interview domain ports (#12) */}
            <div className="mb-8">
              <h2 className="mb-4 border-b border-gray-200 pb-2 text-xl font-bold text-gray-800">
                Interview
              </h2>
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-8 text-center">
                <MessageSquare className="mx-auto mb-3 text-gray-400" size={32} />
                <p className="text-gray-500">
                  No interview session available for this candidate.
                </p>
              </div>
            </div>

            {/* SECTION 4: RESUME DATA */}
            <div className="mb-8">
              <h2 className="mb-4 border-b border-gray-200 pb-2 text-xl font-bold text-gray-800">
                Resume Data
              </h2>

              {profile.isEmpty ? (
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-8 text-center">
                  <FileText className="mx-auto mb-3 text-gray-400" size={32} />
                  <p className="text-gray-500">
                    No parsed resume data available.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {(profile.summary || profile.info.length > 0) && (
                    <div>
                      <div className="mb-4 flex items-center gap-2">
                        <FileText className="text-blue-600" size={20} />
                        <h3 className="text-lg font-bold text-gray-900">
                          Candidate Information
                        </h3>
                      </div>
                      <div className="space-y-4">
                        {profile.summary ? (
                          <div className="rounded-xl border border-blue-100 bg-blue-50 p-5">
                            <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-600">
                              Summary
                            </h4>
                            <p className="text-sm text-gray-800">
                              {profile.summary}
                            </p>
                          </div>
                        ) : null}
                        {profile.info.length > 0 ? (
                          <div className="grid grid-cols-2 gap-4">
                            {profile.info.map((entry) => (
                              <div
                                key={entry.label}
                                className="rounded-xl border border-gray-100 bg-gray-50 p-4"
                              >
                                <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-600">
                                  {entry.label}
                                </h4>
                                <p className="text-sm text-gray-800">
                                  {entry.value}
                                </p>
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  )}

                  {profile.workExperience.length > 0 && (
                    <div>
                      <div className="mb-4 flex items-center gap-2">
                        <Briefcase className="text-blue-600" size={20} />
                        <h3 className="text-lg font-bold text-gray-900">
                          Work Experience
                        </h3>
                      </div>
                      <div className="space-y-4">
                        {profile.workExperience.map((role, i) => (
                          <div
                            key={i}
                            className="rounded-xl border border-gray-100 bg-gray-50 p-5"
                          >
                            <div className="text-lg font-bold text-gray-900">
                              {role.role || 'Position'}
                            </div>
                            {role.company ? (
                              <div className="mt-1 font-medium text-blue-600">
                                {role.company}
                              </div>
                            ) : null}
                            {role.duration ? (
                              <div className="mt-2 flex items-center gap-1 text-sm text-gray-500">
                                <Calendar size={12} />
                                {role.duration}
                              </div>
                            ) : null}
                            {role.experience_details &&
                            role.experience_details.length > 0 ? (
                              <ul className="mt-3 space-y-1">
                                {role.experience_details.map((point, ptIdx) => (
                                  <li
                                    key={ptIdx}
                                    className="flex items-start gap-2 text-sm text-gray-700"
                                  >
                                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
                                    <span>{point}</span>
                                  </li>
                                ))}
                              </ul>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {profile.education.length > 0 && (
                    <div>
                      <div className="mb-4 flex items-center gap-2">
                        <GraduationCap className="text-blue-600" size={20} />
                        <h3 className="text-lg font-bold text-gray-900">
                          Education
                        </h3>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        {profile.education.map((edu, i) => (
                          <div
                            key={i}
                            className="rounded-xl border border-gray-100 bg-gray-50 p-4"
                          >
                            <div className="font-bold text-gray-900">
                              {edu.degree || 'Degree'}
                              {edu.field ? ` — ${edu.field}` : ''}
                            </div>
                            <div className="mt-1 text-blue-600">
                              {edu.institution}
                            </div>
                            {edu.year ? (
                              <div className="mt-2 text-xs text-gray-500">
                                <span className="rounded bg-gray-100 px-2 py-1">
                                  {edu.year}
                                </span>
                              </div>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {(skills.length > 0 || profile.certifications.length > 0) && (
                    <div>
                      <h3 className="mb-4 text-lg font-bold text-gray-900">
                        Skills & Technologies
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {skills.map((skill, i) => (
                          <span
                            key={`skill-${i}`}
                            className="rounded-lg bg-blue-100 px-3 py-1.5 text-sm font-medium text-blue-800"
                          >
                            {skill.skill}
                          </span>
                        ))}
                        {profile.certifications.map((cert, i) => (
                          <span
                            key={`cert-${i}`}
                            className="rounded-lg bg-violet-100 px-3 py-1.5 text-sm font-medium text-violet-800"
                          >
                            {cert}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* SECTION 5: EMAIL */}
            <div className="mb-8">
              <h2 className="mb-4 border-b border-gray-200 pb-2 text-xl font-bold text-gray-800">
                Email & Application Source
              </h2>

              {showEmailContent ? (
                <div className="space-y-6">
                  {hasEmailInsights && emailAnalysis ? (
                    <div className="rounded-xl border border-blue-100 bg-blue-50 p-5">
                      <div className="mb-4 flex items-center gap-2">
                        <Mail className="text-blue-600" size={20} />
                        <span className="font-bold text-gray-900">
                          Email Insights
                        </span>
                      </div>

                      {emailAnalysis.candidate_highlights.length > 0 && (
                        <div className="mb-4">
                          <div className="mb-2 font-medium text-gray-800">
                            Key Points About Candidate
                          </div>
                          <ul className="space-y-1">
                            {emailAnalysis.candidate_highlights.map(
                              (highlight, idx) => (
                                <li
                                  key={idx}
                                  className="flex items-start gap-2 text-sm text-gray-700"
                                >
                                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                                  <span>{highlight}</span>
                                </li>
                              ),
                            )}
                          </ul>
                        </div>
                      )}

                      {emailAnalysis.company_join_highlights.length > 0 && (
                        <div>
                          <div className="mb-2 font-medium text-gray-800">
                            Why They Want to Join
                          </div>
                          <ul className="space-y-1">
                            {emailAnalysis.company_join_highlights.map(
                              (highlight, idx) => (
                                <li
                                  key={idx}
                                  className="flex items-start gap-2 text-sm text-gray-700"
                                >
                                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                                  <span>{highlight}</span>
                                </li>
                              ),
                            )}
                          </ul>
                        </div>
                      )}
                    </div>
                  ) : null}

                  {emailBody ? (
                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
                      <div className="mb-4 flex items-center gap-2">
                        <FileText className="text-gray-600" size={20} />
                        <span className="font-bold text-gray-900">
                          Email Content
                        </span>
                      </div>
                      <div className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
                        {emailBody}
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-8 text-center">
                  <Mail className="mx-auto mb-3 text-gray-400" size={32} />
                  <p className="text-gray-500">
                    {app.processing_source === 'form'
                      ? 'This candidate applied through the application form.'
                      : 'No email content available for this application.'}
                  </p>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
