import { DocLink } from '#/components/documentation/DocLink';
import { DocumentationPage } from '#/components/documentation/DocumentationPage';
import { getPageSections } from '#/components/documentation/docStructure';

export default function CandidateProfileDialog() {
  return (
    <DocumentationPage
      title="AI Analysis Dialog"
      sections={getPageSections('/docs/dashboard/candidate-card/profile-dialog')}
    >
      <section id="overview" className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 scroll-mt-24">Overview</h2>
        <p className="text-muted-foreground leading-relaxed mb-4">
          The AI Analysis Dialog is a comprehensive modal that displays detailed information about a candidate, including their match score breakdown, AI analysis results, interview data, parsed resume information, and email content. It provides a deeper view than the candidate card, allowing you to make informed decisions about shortlisting or rejecting candidates.
        </p>
        <p className="text-muted-foreground leading-relaxed">
          The dialog is accessible by clicking the "AI Analysis" button (eye icon) on any candidate card. It opens as an overlay on top of your dashboard, allowing you to review details without navigating away from your current view.
        </p>
      </section>

      <section id="accessing" className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 scroll-mt-24">Accessing the Dialog</h2>
        <p className="text-muted-foreground leading-relaxed mb-6">
          Open the AI Analysis Dialog from the dashboard:
        </p>

        <div className="space-y-6">
          <div>
            <h3 className="font-semibold mb-2">From Candidate Card</h3>
            <p className="text-muted-foreground mb-2">
              Click the "AI Analysis" button (eye icon) on any candidate card in the right panel of the dashboard. This will open the analysis dialog for that specific candidate.
            </p>
            <div className="bg-muted/50 border rounded-lg p-4 mt-4">
              <p className="text-sm text-muted-foreground">
                <strong>Tip:</strong> The "AI Analysis" button is the leftmost action button on each candidate card, showing an eye icon.
              </p>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Dialog Behavior</h3>
            <p className="text-muted-foreground mb-2">
              The analysis dialog opens as a modal overlay with the following characteristics:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
              <li><strong>Large Modal</strong> — Spans 70% of viewport width, 93% height</li>
              <li><strong>Tabbed Interface</strong> — Information organized into 5 tabs</li>
              <li><strong>Scrollable Content</strong> — Long content scrolls within each tab</li>
              <li><strong>Close Button</strong> — Click X in top-right or press Escape to close</li>
              <li><strong>Header Information</strong> — Shows candidate name, email, application date, stage, and match score</li>
            </ul>
          </div>
        </div>
      </section>

      <section id="tabs" className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 scroll-mt-24">Dialog Tabs</h2>
        <p className="text-muted-foreground leading-relaxed mb-6">
          The AI Analysis Dialog uses a tabbed interface to organize different types of candidate information. Each tab provides focused details on a specific aspect of the candidate's profile.
        </p>

        <div className="space-y-6">
          <div>
            <h3 className="font-semibold mb-2">Tab Navigation</h3>
            <p className="text-muted-foreground mb-2">
              Tabs are displayed at the top of the dialog content area:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
              <li><strong>Overview</strong> — Score breakdown and AI recommendations</li>
              <li><strong>Requirement Analysis</strong> — Detailed requirement-by-requirement analysis</li>
              <li><strong>Interview</strong> — Interview session data and responses</li>
              <li><strong>Resume Data</strong> — Parsed resume information</li>
              <li><strong>Email</strong> — Email content and insights (if applicable)</li>
            </ul>
          </div>
        </div>
      </section>

      <section id="dialog-structure" className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 scroll-mt-24">Dialog Structure</h2>
        <div className="bg-muted/50 border rounded-lg p-6 my-6">
          <p className="text-sm text-muted-foreground mb-4">
            The dialog is organized into tabs, each focusing on different aspects of candidate information:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#4366B0]/10 border border-[#4366B0]/20 rounded-lg p-4">
              <h4 className="font-semibold mb-2 text-[#4366B0]">Overview Tab</h4>
              <p className="text-xs text-muted-foreground">
                • Score breakdown cards<br/>
                • AI recommendation<br/>
                • Key concerns
              </p>
            </div>
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4">
              <h4 className="font-semibold mb-2 text-emerald-700 dark:text-emerald-400">Requirement Analysis Tab</h4>
              <p className="text-xs text-muted-foreground">
                • Non-negotiables analysis<br/>
                • Preferred requirements analysis<br/>
                • Form answers (if applicable)
              </p>
            </div>
            <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
              <h4 className="font-semibold mb-2 text-purple-700 dark:text-purple-400">Interview Tab</h4>
              <p className="text-xs text-muted-foreground">
                • Interview questions & answers<br/>
                • AI assessment scores<br/>
                • Requirement fit check
              </p>
            </div>
            <div className="bg-sky-500/10 border border-sky-500/20 rounded-lg p-4">
              <h4 className="font-semibold mb-2 text-sky-700 dark:text-sky-400">Resume Data Tab</h4>
              <p className="text-xs text-muted-foreground">
                • Parsed candidate information<br/>
                • Work experience timeline<br/>
                • Education, skills
              </p>
            </div>
            <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg p-4">
              <h4 className="font-semibold mb-2 text-rose-700 dark:text-rose-400">Email Tab</h4>
              <p className="text-xs text-muted-foreground">
                • Email insights & highlights<br/>
                • Full email content<br/>
                • Email headers & details
              </p>
            </div>
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
              <h4 className="font-semibold mb-2 text-amber-700 dark:text-amber-400">Tab Visibility</h4>
              <p className="text-xs text-muted-foreground">
                • Interview Tab: Empty if no interview session exists<br/>
                • Email Tab: Empty if candidate didn't apply via email<br/>
                • Resume Data Tab: Empty if no parsed data available
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="overview-tab" className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 scroll-mt-24">Overview Tab</h2>
        <p className="text-muted-foreground leading-relaxed mb-6">
          The Overview tab provides a high-level summary of the candidate's fit for the role, including score breakdown and AI-generated insights.
        </p>

        <div className="space-y-6">
          <div>
            <h3 className="font-semibold mb-2">Score Cards</h3>
            <p className="text-muted-foreground mb-2">
              Three cards display the match score breakdown:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
              <li><strong>Overall Fit</strong> — Base score component from overall assessment (out of overall weight)</li>
              <li><strong>Bonus Points</strong> — Points earned from preferred requirements (out of preferred weight)</li>
              <li><strong>Final Score</strong> — Combined score out of 100, reduced by 50% if non-negotiables not met</li>
            </ul>
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 mt-4">
              <p className="text-sm text-muted-foreground">
                <strong>Note:</strong> If a candidate doesn't meet all non-negotiables, the final score is reduced by 50% to reflect this critical gap.
              </p>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">AI Recommendation</h3>
            <p className="text-muted-foreground mb-2">
              The AI provides a recommendation with supporting rationale:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
              <li><strong>Verdict</strong> — AI's overall recommendation (e.g., "Strong candidate")</li>
              <li><strong>Rationale</strong> — Detailed explanation for the recommendation</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Key Strengths & Potential Concerns</h3>
            <p className="text-muted-foreground mb-2">
              Two sections highlight important aspects of the candidate's profile:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4">
                <h4 className="font-semibold mb-2 text-emerald-700 dark:text-emerald-400">Key Strengths</h4>
                <p className="text-sm text-muted-foreground">
                  List of key concerns identified from the candidate's resume and analysis.
                </p>
              </div>
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
                <h4 className="font-semibold mb-2 text-amber-700 dark:text-amber-400">Potential Concerns</h4>
                <p className="text-sm text-muted-foreground">
                  Areas of concern or gaps that might affect the candidate's suitability for the role.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="requirement-analysis-tab" className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 scroll-mt-24">Requirement Analysis Tab</h2>
        <p className="text-muted-foreground leading-relaxed mb-6">
          The Requirement Analysis tab provides a detailed, requirement-by-requirement breakdown of how well the candidate matches your job criteria.
        </p>

        <div className="space-y-6">
          <div>
            <h3 className="font-semibold mb-2">Non-Negotiables Analysis</h3>
            <p className="text-muted-foreground mb-2">
              Must-have requirements are analyzed with special attention:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
              <li><strong>Requirement Text</strong> — The must-have skill or qualification</li>
              <li><strong>Match Status</strong> — Green check if met, red X if not met</li>
              <li><strong>Evidence</strong> — Resume excerpts supporting the assessment</li>
              <li><strong>Summary Badge</strong> — Shows count of met requirements (e.g., "2/3")</li>
            </ul>
            <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg p-4 mt-4">
              <p className="text-sm text-muted-foreground">
                <strong>Important:</strong> Non-negotiables are deal-breakers. Candidates missing these are typically not suitable for the position.
              </p>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Preferred Requirements Analysis</h3>
            <p className="text-muted-foreground mb-2">
              Nice-to-have requirements are analyzed individually:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
              <li><strong>Requirement Text</strong> — The specific skill or qualification</li>
              <li><strong>Match Status</strong> — Green check if met, red X if not met</li>
              <li><strong>Evidence</strong> — Resume excerpts supporting the analysis</li>
              <li><strong>Summary Badge</strong> — Shows count of met requirements (e.g., "3/5")</li>
            </ul>
            <div className="bg-sky-500/10 border border-sky-500/20 rounded-lg p-4 mt-4">
              <p className="text-sm text-muted-foreground">
                <strong>Preferred Requirements</strong> are nice-to-have skills that strengthen a candidate's profile but aren't strictly required.
              </p>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Form Answers</h3>
            <p className="text-muted-foreground mb-2">
              If the candidate applied through the form, their answers are displayed:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
              <li><strong>Question Text</strong> — The question as configured in your form</li>
              <li><strong>Answer</strong> — The candidate's response</li>
              <li><strong>Custom Questions</strong> — Shows custom question text if configured</li>
              <li><strong>Phone Formatting</strong> — Phone numbers are automatically formatted</li>
            </ul>
          </div>
        </div>
      </section>

      <section id="interview-tab" className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 scroll-mt-24">Interview Tab</h2>
        <p className="text-muted-foreground leading-relaxed mb-6">
          The Interview tab displays data from the candidate's screening interview session, including questions, answers, and AI assessments.
        </p>

        <div className="space-y-6">
          <div>
            <h3 className="font-semibold mb-2">Interview Header</h3>
            <p className="text-muted-foreground mb-2">
              The top section shows interview session information:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
              <li><strong>Interview Analysis Title</strong> — Section header</li>
              <li><strong>Status Badge</strong> — Shows "completed" or other status</li>
              <li><strong>Session Date</strong> — When the interview was created</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Introduction Section</h3>
            <p className="text-muted-foreground mb-2">
              The first question is an introduction:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
              <li><strong>Question</strong> — The introduction question text</li>
              <li><strong>Answer</strong> — Candidate's response</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Profile Assessment Section</h3>
            <p className="text-muted-foreground mb-2">
              AI conversation questions assess the candidate's profile:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
              <li><strong>Question</strong> — The profile assessment question</li>
              <li><strong>Satisfactory Badge</strong> — Shows "Satisfactory", "Not Satisfactory", or "Pending Evaluation"</li>
              <li><strong>AI Assessment</strong> — AI's evaluation of the response</li>
              <li><strong>Show Full Conversation</strong> — Button to view the complete AI-candidate conversation</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Motivation Section</h3>
            <p className="text-muted-foreground mb-2">
              A question about the candidate's motivation for career change:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
              <li><strong>Question</strong> — Career change motivation question</li>
              <li><strong>Answer</strong> — Candidate's response</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Requirement Fit Check Section</h3>
            <p className="text-muted-foreground mb-2">
              Questions verify if the candidate meets job requirements:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
              <li><strong>Requirement Questions</strong> — 2-column grid showing each requirement</li>
              <li><strong>Pass/Fail Indicator</strong> — Green check if meets, red X if doesn't meet</li>
              <li><strong>Answer Label</strong> — "Meets Requirement" or "Does Not Meet Requirement"</li>
              <li><strong>Informational Questions</strong> — Additional questions in a separate section</li>
            </ul>
            <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4 mt-4">
              <p className="text-sm text-muted-foreground">
                <strong>Requirement Questions</strong> include willingness to work, start dates, salary expectations, and other job-specific requirements.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="resume-data-tab" className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 scroll-mt-24">Resume Data Tab</h2>
        <p className="text-muted-foreground leading-relaxed mb-6">
          The Resume Data tab displays parsed information extracted from the candidate's resume, organized into structured sections.
        </p>

        <div className="space-y-6">
          <div>
            <h3 className="font-semibold mb-2">Quick Navigation Sidebar</h3>
            <p className="text-muted-foreground mb-2">
              A sticky sidebar provides quick navigation to different sections:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
              <li><strong>Candidate Info</strong> — Basic information and summary</li>
              <li><strong>Work Experience</strong> — Employment history timeline</li>
              <li><strong>Education</strong> — Academic credentials</li>
              <li><strong>Skills & Expertise</strong> — Technical and professional skills</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Candidate Information</h3>
            <p className="text-muted-foreground mb-2">
              Basic information extracted from the resume:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
              <li><strong>Summary</strong> — Professional summary or objective</li>
              <li><strong>Additional Fields</strong> — Other extracted information in a grid layout</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Work Experience</h3>
            <p className="text-muted-foreground mb-2">
              Employment history displayed as a timeline:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
              <li><strong>Job Title & Company</strong> — Position and organization name</li>
              <li><strong>Date Range</strong> — Start and end dates</li>
              <li><strong>Location</strong> — Job location (if available)</li>
              <li><strong>Description</strong> — Job description</li>
              <li><strong>Key Achievements</strong> — Bullet points of accomplishments</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Education</h3>
            <p className="text-muted-foreground mb-2">
              Academic credentials displayed in a grid:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
              <li><strong>Degree</strong> — Qualification or degree title</li>
              <li><strong>Institution</strong> — School or university name</li>
              <li><strong>Year</strong> — Graduation year</li>
              <li><strong>GPA</strong> — Grade point average (if available)</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Skills & Expertise</h3>
            <p className="text-muted-foreground mb-2">
              Technical and professional skills displayed as tags:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
              <li><strong>Skill Tags</strong> — Individual skills as clickable badges</li>
              <li><strong>Multiple Categories</strong> — Different skill groups if available</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Key Strengths</h3>
            <p className="text-muted-foreground mb-2">
              Key concerns identified from the resume:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
              <li><strong>Strength</strong> — The strength name</li>
              <li><strong>Justification</strong> — Explanation or evidence for the strength</li>
            </ul>
          </div>
        </div>
      </section>

      <section id="email-tab" className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 scroll-mt-24">Email Tab</h2>
        <p className="text-muted-foreground leading-relaxed mb-6">
          The Email tab displays the candidate's application email content and AI-generated insights (if the candidate applied via email).
        </p>

        <div className="space-y-6">
          <div>
            <h3 className="font-semibold mb-2">Email Insights</h3>
            <p className="text-muted-foreground mb-2">
              AI-generated highlights from the email:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
              <li><strong>Key Points About Candidate</strong> — Important information extracted about the candidate</li>
              <li><strong>Why Candidate Wants to Join Company</strong> — Motivations for applying</li>
            </ul>
            <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg p-4 mt-4">
              <p className="text-sm text-muted-foreground">
                <strong>Note:</strong> This section only appears if the candidate applied via email and AI analysis is available.
              </p>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Email Details</h3>
            <p className="text-muted-foreground mb-2">
              Email headers and metadata:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
              <li><strong>Subject</strong> — Email subject line</li>
              <li><strong>From</strong> — Sender's email address</li>
              <li><strong>To</strong> — Recipient email address</li>
              <li><strong>Date</strong> — Email date</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Message Content</h3>
            <p className="text-muted-foreground mb-2">
              Full email body content:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
              <li><strong>Formatted Display</strong> — Preserves original formatting</li>
              <li><strong>Whitespace Preservation</strong> — Maintains line breaks and spacing</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Empty State</h3>
            <p className="text-muted-foreground mb-2">
              If the candidate didn't apply via email:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
              <li><strong>Message</strong> — "Application not submitted through email"</li>
              <li><strong>Explanation</strong> — "This candidate applied through another source"</li>
            </ul>
          </div>
        </div>
      </section>

      <section id="actions" className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 scroll-mt-24">Actions</h2>
        <p className="text-muted-foreground leading-relaxed mb-6">
          The AI Analysis Dialog is designed for information review only. To take action on a candidate:
        </p>

        <div className="space-y-6">
          <div>
            <h3 className="font-semibold mb-2">Close Dialog</h3>
            <p className="text-muted-foreground mb-2">
              Close the dialog using any of these methods:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
              <li><strong>X Button</strong> — Click the X icon in the top-right corner</li>
              <li><strong>Escape Key</strong> — Press the Escape key on your keyboard</li>
              <li><strong>Click Outside</strong> — Click anywhere outside the dialog</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-2">No Direct Actions</h3>
            <p className="text-muted-foreground mb-2">
              The dialog is designed for information review only. To take action on a candidate:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
              <li>Close the dialog to return to the dashboard</li>
              <li>Use the action buttons on the candidate card (Shortlist, Reject)</li>
              <li>This prevents accidental actions while reviewing details</li>
            </ul>
            <div className="bg-muted/50 border rounded-lg p-4 mt-4">
              <p className="text-sm text-muted-foreground">
                <strong>Design Rationale:</strong> Separating information review from action buttons helps prevent mistakes and encourages thorough review before making decisions.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="related" className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 scroll-mt-24">Related Pages</h2>
        <div className="space-y-3">
          <p>
            <DocLink to="/docs/dashboard/candidate-card/overview">Candidate Card — Overview</DocLink> — Understanding candidate cards in the dashboard
          </p>
          <p>
            <DocLink to="/docs/dashboard/candidate-card/shortlisting-rejecting">Shortlisting/Rejecting Candidates</DocLink> — Taking action on candidates after review
          </p>
          <p>
            <DocLink to="/docs/core-ai-services/overview">Core AI Services</DocLink> — How AI analysis works
          </p>
          <p>
            <DocLink to="/docs/core-ai-services/resume-screening">Resume Screening</DocLink> — Detailed explanation of resume analysis process
          </p>
          <p>
            <DocLink to="/docs/core-ai-services/screening-interview">Screening Interview</DocLink> — Understanding the AI-powered interview process
          </p>
        </div>
      </section>
    </DocumentationPage>
  );
}
