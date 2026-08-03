import { DocLink } from '#/components/documentation/DocLink';
import { DocumentationPage } from '#/components/documentation/DocumentationPage';
import { getPageSections } from '#/components/documentation/docStructure';

export default function CreateAJob() {
  return (
    <DocumentationPage
      title="Create a Job"
      sections={getPageSections('/docs/create-a-job')}
    >
      <section id="overview" className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 scroll-mt-24">Overview</h2>
        <p className="text-muted-foreground leading-relaxed mb-4">
          Creating a job posting is the first step to attracting and evaluating candidates on Talsek. Each job defines the requirements, logistics, and screening process you want to use for this role.
        </p>
        <p className="text-muted-foreground leading-relaxed">
          Credits are consumed when processing candidates (resume screening, interviews), not when creating job postings. Focus on writing clear, accurate job details to attract the right candidates.
        </p>
      </section>

      <section id="screening-process" className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 scroll-mt-24">Choosing Your Screening Process</h2>
        <p className="text-muted-foreground leading-relaxed mb-6">
          Select how you want to evaluate candidates for this role. Your choice affects the depth of insights you'll receive and the credits consumed per candidate.
        </p>

        <div className="space-y-6">
          <div className="border-l-4 border-[#4366B0] pl-4">
            <h3 className="font-semibold mb-2">Resume Screening Only</h3>
            <p className="text-muted-foreground mb-2">
              AI-powered resume analysis and candidate ranking. Fast initial screening process.
            </p>
            <p className="text-sm text-muted-foreground">
              Best for high-volume screening, roles where resume is the primary evaluation tool, and quick initial filtering without interviews.
            </p>
          </div>

          <div className="border-l-4 border-[#38bdf8] pl-4">
            <h3 className="font-semibold mb-2">Resume + Screening Interview</h3>
            <p className="text-muted-foreground mb-2">
              Complete evaluation with AI-powered conversational interviews. Deeper behavioral and technical insights.
            </p>
            <p className="text-sm text-muted-foreground">
              Best for critical roles requiring deep candidate assessment, asking curated role readiness and potential concerns for each candidate, and teams wanting comprehensive candidate profiles.
            </p>
          </div>
        </div>
      </section>

      <section id="creating-job" className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 scroll-mt-24">Creating Your First Job</h2>
        <p className="text-muted-foreground leading-relaxed mb-6">
          The job creation process is a 4-step wizard that guides you through selecting your screening process, entering job details, reviewing AI-extracted requirements, and configuring your application form.
        </p>

        <div className="space-y-4">
          <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/30 border border-border/50">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#4366B0]/10 flex items-center justify-center text-[#4366B0] font-semibold">
              1
            </div>
            <div>
              <h3 className="font-semibold mb-1">Navigate to Dashboard</h3>
              <p className="text-sm text-muted-foreground">
                Go to your main dashboard from the sidebar.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/30 border border-border/50">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#4366B0]/10 flex items-center justify-center text-[#4366B0] font-semibold">
              2
            </div>
            <div>
              <h3 className="font-semibold mb-1">Click "Create New Job"</h3>
              <p className="text-sm text-muted-foreground">
                Find the button in the top-right corner of the Jobs section.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/30 border border-border/50">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#4366B0]/10 flex items-center justify-center text-[#4366B0] font-semibold">
              3
            </div>
            <div>
              <h3 className="font-semibold mb-1">Choose Screening Process</h3>
              <p className="text-sm text-muted-foreground">
                Select between Resume Screening Only or Resume + Screening Interview based on your role requirements.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-6 my-6">
          <p className="text-sm text-muted-foreground">
            <strong>Note:</strong> Creating a job posting is free. Credits are only used when you screen candidates or conduct interviews.
          </p>
        </div>
      </section>

      <section id="job-details" className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 scroll-mt-24">Job Details Fields Explained</h2>
        <p className="text-muted-foreground leading-relaxed mb-6">
          This section explains each field in the job creation form and how it's used throughout the platform. Accurate job details help attract the right candidates and provide context for AI screening and candidate evaluation.
        </p>

        <div className="overflow-x-auto my-6">
          <table className="w-full border-collapse rounded-lg border-border">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="py-3 px-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Field</th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Description</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b hover:bg-muted/30 transition-colors">
                <td className="py-4 px-4 font-medium">Job Title</td>
                <td className="py-4 px-4 text-muted-foreground">Clear, standard role name (max 40 characters)</td>
              </tr>
              <tr className="border-b hover:bg-muted/30 transition-colors">
                <td className="py-4 px-4 font-medium">Job Code</td>
                <td className="py-4 px-4 text-muted-foreground">Unique identifier (e.g., ENG-2024-001)</td>
              </tr>
              <tr className="border-b hover:bg-muted/30 transition-colors">
                <td className="py-4 px-4 font-medium">Salary Range</td>
                <td className="py-4 px-4 text-muted-foreground">Yearly CTC in USD or INR. Increases application quality.</td>
              </tr>
              <tr className="border-b hover:bg-muted/30 transition-colors">
                <td className="py-4 px-4 font-medium">Job Description</td>
                <td className="py-4 px-4 text-muted-foreground">Full description with responsibilities and requirements. AI uses this to extract requirements.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="bg-muted/50 border rounded-lg p-6 my-6">
          <h3 className="font-semibold mb-2">AI-Powered Extraction</h3>
          <p className="text-sm text-muted-foreground">
            AI analyzes your job title, salary, and description to automatically extract preferred requirements and non-negotiables.
          </p>
        </div>
      </section>

      <section id="logistics" className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 scroll-mt-24">Logistics Configuration (Resume + Interview Only)</h2>
        <p className="text-muted-foreground leading-relaxed mb-6">
          When you select Resume + Screening Interview, you'll configure additional logistics details for candidates joining interviews.
        </p>
        <div className="bg-muted/50 border rounded-lg p-6">
          <p className="text-sm text-muted-foreground">
            <strong>Note:</strong> The following logistics fields only appear when you select Resume + Screening Interview as your screening process.
          </p>
          <p className="text-sm text-muted-foreground mt-4">
            Configure details such as joining date, location type, work arrangement, shift timing, and travel requirements based on your role's needs.
          </p>
        </div>
      </section>

      <section id="ai-extraction" className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 scroll-mt-24">AI-Powered Requirements Extraction</h2>
        <p className="text-muted-foreground leading-relaxed mb-6">
          AI analyzes your job description and automatically extracts requirements based on the role title, salary, and description you provide.
        </p>

        <div className="space-y-6">
          <div className="border-l-4 border-[#4366B0] pl-4">
            <h3 className="font-semibold mb-2">Identifies Non-Negotiables</h3>
            <p className="text-muted-foreground mb-2">
              Mandatory qualifications that candidates must have to be considered.
            </p>
            <div className="bg-muted/50 border rounded-lg p-4 mt-4">
              <h4 className="font-semibold mb-2 text-sm">Examples:</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>Candidates must hold a professional certification such as CPA or PMP</li>
                <li>Candidates must have at least five years of professional experience in a relevant field</li>
              </ul>
            </div>
          </div>

          <div className="border-l-4 border-[#4366B0] pl-4">
            <h3 className="font-semibold mb-2">Identifies Preferred Requirements</h3>
            <p className="text-muted-foreground mb-2">
              Nice-to-have skills that give candidates an edge and help distinguish top performers.
            </p>
            <div className="bg-muted/50 border rounded-lg p-4 mt-4">
              <h4 className="font-semibold mb-2 text-sm">Examples:</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>Candidates with an advanced degree such as Master's in Accounting/Finance, MBA, or equivalent</li>
                <li>Candidates with demonstrated leadership experience in team environments</li>
                <li>Candidates with hands-on industry experience using React or AWS</li>
              </ul>
            </div>
          </div>

          <div className="border-l-4 border-[#4366B0] pl-4">
            <h3 className="font-semibold mb-2">Focuses on Verifiable Skills</h3>
            <p className="text-muted-foreground mb-2">
              AI prioritizes objectively verifiable requirements from resumes over vague soft skills.
            </p>
            <p className="text-sm text-muted-foreground">
              Write comprehensive job descriptions with specific technical skills and measurable experience levels to improve extraction accuracy.
            </p>
          </div>

          <div className="bg-muted/50 border rounded-lg p-6 my-6">
            <h3 className="font-semibold mb-2">Review and Edit</h3>
            <p className="text-sm text-muted-foreground">
              You can review and modify extracted requirements before publishing your job. AI provides suggestions, but you have final approval.
            </p>
          </div>

          <div className="bg-muted/50 border rounded-lg p-6 my-6">
            <h3 className="font-semibold mb-2">Strict Grading</h3>
            <p className="text-sm text-muted-foreground">
              AI follows non-negotiable requirements very strictly when grading candidates. Candidates who don't meet these requirements won't advance.
            </p>
          </div>
        </div>
      </section>

      <section id="application-form" className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 scroll-mt-24">Configuring Application Form</h2>
        <p className="text-muted-foreground leading-relaxed mb-6">
          The default form template that you've saved will be loaded for your job. You can modify the questions on top of that template if you desire.
        </p>

        <div className="bg-muted/50 border rounded-lg p-6 my-6">
          <h3 className="font-semibold mb-2">Adding and Removing Questions</h3>
          <p className="text-sm text-muted-foreground mb-2">
            You can add or remove questions from the loaded template. For custom questions, you must enter the question text to proceed.
          </p>
          <p className="text-sm text-muted-foreground">
            <strong>Note:</strong> To add more custom questions beyond what's available in the wizard, you need to add them to your form template in Form Settings. You cannot add new questions directly through the job creation wizard.
          </p>
        </div>

        <div className="bg-muted/50 border rounded-lg p-6 my-6">
          <p>
            <DocLink to="/docs/get-started/customize-application-form">Learn more about customizing application form templates</DocLink>
          </p>
        </div>
      </section>


      <section id="related" className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 scroll-mt-24">Related Pages</h2>
        <div className="space-y-3">
          <p>
            <DocLink to="/docs/get-started">Get Started Overview</DocLink> — Back to getting started guide
          </p>
          <p>
            <DocLink to="/docs/get-started/add-credits">Add Credits</DocLink> — Understanding credits and payment methods
          </p>
          <p>
            <DocLink to="/docs/get-started/customize-application-form">Customize Application Form</DocLink> — Configure your application form
          </p>
          <p>
            <DocLink to="/docs/get-started/set-reachout-template">Set Reachout Template</DocLink> — Create email templates for outreach
          </p>
          <p>
            <DocLink to="/docs/get-started/add-team-members">Add Team Members</DocLink> — Invite collaborators to your account
          </p>
          <p>
            <DocLink to="/docs/getting-candidates">Getting Candidates</DocLink> — Learn how to source and import candidates
          </p>
        </div>
      </section>
    </DocumentationPage>
  );
}
