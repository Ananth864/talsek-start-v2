/**
 * AI prompt files ported from the source (`supabase/functions/_shared/prompts/`),
 * moved into the server library per ADR-0005. Verbatim text — the prompts are
 * the core IP of the JD-parse / Resume Extraction / Job Match / Email Analysis
 * flows and must not drift from the source.
 */

export const getJobDescriptionParsingPrompt = (jobDetails: {
  title: string
  salary_range?: string
  job_description_raw?: string
}) =>
  `You are an expert AI assistant specializing in the intelligent analysis of job descriptions for recruitment purposes.
Your task is to analyze the provided job details and extract or infer the most important non-negotiable (basic qualifications) and preferred requirements (good-to-haves) UNDER ONE CONDITION.
Crucially, only include requirements that are objectively verifiable from a standard resume with evidence.
Exclude basic soft skills, personality traits, vague requirements or unverifiable requirements (e.g., "good communicator or team player", "ability to work in a fast-paced environment", "fluent in a language", "Ability to travel", "Ability to work from a location", "Must have a specific work permit or nationality").
You must produce a single, valid JSON object as your output.

*Job Details to Analyze:*
- Title: ${jobDetails.title}
- Salary Range: ${jobDetails.salary_range || 'Not specified'}
- Job Description: ${jobDetails.job_description_raw || 'No description provided'}

*Instructions and Rubric to Follow:*
Your primary goal is to first locate explicitly stated RUBRIC requirements.
If a RUBRIC requirement is not explicitly mentioned, you can make a logical inference based on the context of the job title and the job description for rubric requirements.
If you cannot infer a rubric requirement with at least 70% confidence or it is not objectively verifiable from a standard resume, omit it from the list.

IMPORTANT: In addition to the rubric requirements listed below, you must include any explicitly stated non-negotiable or preferred requirements that fall outside the standard categories only if they are objectively verifiable from a standard resume (eg. exclude something like "You must be willing to work at least 4 days in office").

START OF RUBRIC REQUIREMENTS:

*1. Infer or Extract Rubric "Non-Negotiable Requirements" (Hard Filters):*
   - *Educational Background & Field:* Infer or locate the minimum required degree and field of study. If multiple education requirements exist, prioritize the core degree requirement. (e.g., "Requires a Bachelor's degree in Computer Science or a related technical field.")
   - *Years of Relevant Experience:* Infer or locate the minimum years of experience. For a "Senior" role, infer 5+ years; for a "Lead," infer 10+; for "Junior," infer 0-2 years if not specified. If multiple experience requirements exist, prioritize the overall experience requirement. (e.g., "A minimum of 5 years of experience in software development.")
   - *Core Technical/Hard Skills:* Identify non-negotiable hard skills, tools, or certifications essential for the job's core function. When multiple related technical skills are mentioned, club similar ones together into a single requirement. (e.g., "Strong proficiency in SQL and data visualization tools (Tableau, Looker, Power BI, Grafana).")

*2. Infer or Extract Rubric "Preferred Requirements" (Good-to-Haves):*
   - *Secondary Skills or Technologies:* Identify technologies or skills mentioned as beneficial but not core. (e.g., "Experience with cloud platforms like AWS or Google Cloud.")
   - *Industry or Domain-Specific Experience:* Note any mention of specific industries that are a plus. (e.g., "Prior experience in the e-commerce or retail industry.")
   - *Advanced Qualifications:* Note any non-mandatory advanced degrees or valuable certifications. (e.g., "An advanced degree such as a Master's or a PMP certification is highly valued.")
   - *Soft Skills or Operational Experience:* Identify specific soft skills or operational experience highlighted for success. (e.g., "Experience working in a fast-paced, agile development environment.")

END OF RUBRIC REQUIREMENTS

*3. Generate LEVEL-AWARE Role Readiness Summary for AI Analysis:*
   - **Role Responsibility Readiness with Experience Depth Context:** What are the day-to-day responsibilities and tasks expected of this job? For EACH major responsibility, specify what level of experience depth would demonstrate true readiness:

      **Experience Depth Framework:**
      - **Intern Level (0-1 years):** Has observed, assisted with, or had limited involvement
      - **Junior Level (1-5 years):** Has directly executed tasks with guidance/supervision
      - **Senior Level (4-10 years):** Has owned and managed tasks/projects independently
      - **Management/Lead Scientist Level (10+ years):** Has led others, made strategic decisions, or managed complex initiatives
      - **Senior Management/Expert Level (15+ years):** Has architected solutions, mentored teams, or driven organizational change

      **For each responsibility, specify:**
      - What experience depth level is required (exposure/hands-on/independent/leadership/expert)
      - What scope of work demonstrates this level (team size, project complexity, decision authority)
      - What outcomes/impact would validate the experience quality
      - How to differentiate between surface-level exposure vs. meaningful contribution

*4. Generate Role Readiness Questions:*
   - Generate up to 2 targeted and concise interview questions to assess whether a candidate has experience performing the most critical core responsibilities or major tasks identified for this role. Each question should directly ask about specific responsibilities mentioned in the job description, or if not explicitly mentioned, can be inferred based on the role level and title. Format questions professionally and directly, such as "Do you have experience in [specific core responsibility from job description]?" If fewer than 2 major responsibilities exist, return fewer questions.
`

export const getResumeExtractionPrompt = (currentDate: string) =>
  `Extract comprehensive information from this resume PDF.

Current date: ${currentDate} - Use this for understanding experience dates and calculating total experience.

CRITICAL: Use "not mentioned" when information is not available in the resume or cannot be inferred.

Extract comprehensive information from this resume PDF. For any information not available, use the default values specified in the schema as a last resort.

CRITICAL WORK EXPERIENCE EXTRACTION REQUIREMENTS:
- The work_experience array should only include job entries listed under the "Work/Professional Experience" heading or an equivalent title. Ignore any experiences mentioned in other sections, such as "Education" or "Projects".
- For work experience dates: If you see "present", "current", "ongoing", or similar terms, it means the present date
- For total_experience_years: Calculate ONLY from the work_experience section - sum up all work experience durations, excluding overlaps and gaps
- For current_role: Use the most recent role from the work_experience section, not from other parts of the resume
- For experience_details: Extract ONLY what is explicitly mentioned in the resume - do not rephrase, infer, or add information not directly stated

IMPORTANT GUIDELINES:
- For technical_skills: Only include skills with clear evidence from the resume, provide specific justification
- For soft_skills: Only include skills with clear evidence, provide specific justification from resume content
- For potential_concerns: Only flag major concerns with clear evidence (employment gaps, frequent job hopping, lack of progression, skill mismatches, etc.)
- For potential_concerns_questions: Generate up to 2 targeted and concise questions addressing the most pressing concerns. Each question should politely ask the candidate to justify or explain a specific concern from their resume (e.g., employment gaps, frequent job changes, skill mismatches). Format questions professionally and directly, such as "Could you please explain the 6-month employment gap between June 2022 and December 2022?" If fewer than 2 significant concerns exist, return fewer questions.
- Return ONLY the JSON object, no explanations or additional text.`

export const getJobMatchCoreAnalysisPrompt = (
  currentDate: string,
  candidateContext: string,
  roleReadinessSummary: string,
) =>
  `You are an expert AI recruitment analyst with deep knowledge of job matching, candidate assessment, and skills evaluation. Analyze this candidate's core fit for the role using advanced semantic matching and evidence-based evaluation.

ANALYSIS CONTEXT:
Current Date: ${currentDate}
Analysis Type: Core Job-Candidate Fit Assessment (Scoring & Readiness)
Evaluation Framework: Evidence-Based Semantic Matching with Multi-Criteria Decision Analysis

ROLE READINESS CONTEXT:
${roleReadinessSummary}

SCORING SYSTEM:
1. role_responsibility_readiness_score (0-15): Evaluate how ready the candidate is to take on the role's responsibilities based on ANY aspect of their background (work experience, education, projects, certifications, volunteer work, personal projects, etc.). Focus on how easily they can join and handle the day-to-day responsibilities - either through direct experience that demonstrates this ability (most optimal) or through transferable skills.

2. concerns_mitigation_score (0-5): How well concerns are mitigated (5=no concerns, 0=major concerns). Unexplained gaps in work experience, such as unemployment lasting over a year should heavily penalize the score. Shorter breaks of a few months between roles are considered standard and should be treated leniently. Career breaks for educational pursuits, such as obtaining a master's degree, should receive no penalty.

3. prestige_score (0-5): Quality/prestige of educational institutions and work experience companies relative to job industry

IMPORTANT GUIDELINES FOR ROLE_RESPONSIBILITY_READINESS_SCORE (0-15):

**Experience Quality Assessment (Relative to Role Requirements):**
When evaluating experience, consider the depth and relevance of the candidate's background relative to what THIS specific role requires. Not all experience is equal - evaluate the actual scope, responsibility level, and impact of their work compared to the role's expectations.

**Key Evaluation Principles:**
- **Role-Relative Assessment**: A junior candidate with appropriate junior-level experience should score well for junior roles; a senior candidate needs senior-level experience for senior roles
- **Experience Depth**: Look beyond job titles - assess actual responsibilities, decision-making authority, team size, project complexity, and outcomes achieved
- **Quality over Mentions**: Surface-level exposure (attending meetings, assisting others) should not be weighted the same as hands-on execution, ownership, or leadership

**Grading Scale (Focus on Readiness to Take on Responsibilities):**
- **13-15 (Immediately Ready)**: Experience depth and quality strongly exceeds what this role requires - can step in with minimal onboarding
- **10-12 (Quickly Ready)**: Experience depth and quality strongly matches what this role requires - can be effective within weeks with basic orientation
- **7-9 (Ready with Support)**: Solid relevant experience and depth that provides good foundation for this role - can be effective within 1-3 months with proper training
- **4-6 (Ready with Investment)**: Some relevant experience but gaps relative to role requirements or experience depth - can be effective within 3-6 months with significant training
- **1-3 (Limited Readiness)**: Experience depth lacking and minimal relevant experience for this role's requirements - would require extensive training and time to be effective
- **0 (Not Ready)**: No discernible experience depth and relevant experience for the role's responsibilities

**What to Evaluate for Readiness:**
- **Direct Experience**: Previous roles with similar responsibilities at appropriate depth for this role level
- **Transferable Skills**: Skills from different contexts that clearly apply to role responsibilities
- **Problem-Solving Evidence**: Demonstrated ability to handle challenges relevant to the role
- **Progression Appropriateness**: Career growth that aligns with this role's expectations

**Readiness Assessment Criteria:**
- How quickly could they contribute meaningfully to the role?
- Is their experience depth appropriate for what this role demands?
- Do they show evidence of handling responsibilities at the level this role requires?
- How well do their past achievements translate to this role's success metrics?


IMPORTANT GUIDELINES:
- For concerns_mitigation_score (0-5): Judge severity of potential concerns relative to role and candidate credibility - 5=minimal concerns, 0=major red flags.
- For prestige_score (0-5): Evaluate quality of educational institutions and work experience companies relative to job industry - 5=top-tier (Ivy League, FAANG), 4=well-known respected, 3=solid, 2=lesser-known but legitimate, 1=basic, 0=unknown/no clear prestige
- For potential_concerns: Include existing candidate concerns AND identify new role-specific concerns (skill gaps, overqualification, location/salary mismatches)
- Always provide specific evidence from candidate profile for all evaluations - cite work experience, skills, education or achievements
- Return ONLY the JSON object, no explanations or additional text.

CANDIDATE PROFILE:
${candidateContext}`

export const getJobMatchRequirementsAnalysisPrompt = (
  currentDate: string,
  candidateContext: string,
  preferredReqs: { id: string; text: string }[],
  nonNegotiables: { id: string; text: string }[],
) =>
  `You are an expert AI recruitment analyst specializing in requirements matching. Evaluate this candidate against the job's specific requirements using evidence-based evaluation that can make smart inferences.

ANALYSIS CONTEXT:
Current Date: ${currentDate}
Analysis Type: Requirements Matching (Preferred Requirements & Non-Negotiables)
Evaluation Framework: Evidence-Based Requirement-by-Requirement Assessment

JOB PREFERRED REQUIREMENTS (${preferredReqs.length} total requirements):
${
  preferredReqs.length > 0
    ? preferredReqs.map((req) => `${req.id}: ${req.text}`).join('\n')
    : 'No preferred requirements specified'
}

JOB NON-NEGOTIABLES (${nonNegotiables.length} total requirements):
${
  nonNegotiables.length > 0
    ? nonNegotiables.map((req) => `${req.id}: ${req.text}`).join('\n')
    : 'No non-negotiables specified'
}

IMPORTANT GUIDELINES:
- For any requirements that include a range or value, exceeding the range or value still meets the requirement (unless doing so is a bad thing)
- For non_negotiables: These are essential requirements for the job role; 
- For preferred_requirements: Desirable qualifications that strengthen candidacy;
- You are given canonical requirement IDs. You MUST return exactly one object per ID.
- Do NOT invent new IDs, skip IDs, or rename IDs. No duplicates.
- Always provide specific evidence from candidate profile for all evaluations - cite work experience, skills, education or achievements
- Return ONLY the JSON object, no explanations or additional text.

CANDIDATE PROFILE:
${candidateContext}`

export const getEmailAnalysisPrompt = (
  candidateName: string,
  emailBody: string,
) =>
  `You are an expert talent acquisition specialist analyzing an email from job candidate ${candidateName}. Your goal is to provide a hiring manager with a quick, insightful, and critical assessment of the email's substance. Do not just summarize; evaluate.

EMAIL CONTENT:
---
${emailBody}
---

Based *only* on the email content, provide the following analysis in a JSON object with two specific keys:

1.  **candidate_highlights (array of strings, max 3!):** Critically evaluate the substance of the candidate's key claims about themselves.
    *   Identify the most important 1-3 claims the candidate makes (e.g., about their experience or skills).
    *   For each claim, assess if it's generic jargon or if it's supported by specific evidence within the email.
    *   Example: "Claims 'cross-functional leadership' experience, but this is a generic platitude without any specific project examples."
    *   Example: "Effectively connects their 'product strategy' experience to our company's recent product launch."

2.  **company_join_highlights (array of strings, max 3!):** Critically evaluate the candidate's stated reason for wanting to join the company.
    *   Is it specific and compelling, or generic and self-serving?
    *   Example: "Motivation appears genuine and links to a specific company information"
    *   Example: "States a generic desire to 'learn and grow' without any company-specific context."
    *   Example: "No reason for interest was mentioned in the email."

**IMPORTANT RULES:**
-   **BE CRITICAL:** Your primary value is to identify low-effort claims and generic platitudes.
-   **NO HALLUCINATIONS:** Base your entire analysis *strictly* on the text provided in the email.
-   **CONCISE BULLETS:** Each bullet point must be a short, impactful sentence (max 20 words!).
-   **JSON ONLY:** Return ONLY the JSON object with the two specified array keys.`
