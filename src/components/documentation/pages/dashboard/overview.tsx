import { DocLink } from '#/components/documentation/DocLink';
import { DocumentationPage } from '#/components/documentation/DocumentationPage';
import { getPageSections } from '#/components/documentation/docStructure';

export default function DashboardOverview() {
  return (
    <DocumentationPage
      title="Dashboard Overview"
      sections={getPageSections('/docs/dashboard/overview')}
    >
      <section id="overview" className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 scroll-mt-24">Overview</h2>
        <p className="text-muted-foreground leading-relaxed mb-4">
          The Dashboard is your central hub for managing hiring activities. It provides a comprehensive view of your jobs and candidates, enabling you to track applications, review AI-powered analysis, and move candidates through your hiring pipeline efficiently.
        </p>
        <p className="text-muted-foreground leading-relaxed">
          The dashboard is divided into two main sections: <strong>Jobs List</strong> on the left and <strong>Candidates List</strong> on the right. This layout allows you to quickly switch between jobs and review candidates for each position.
        </p>
      </section>

      <section id="navigation" className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 scroll-mt-24">Navigation</h2>
        <p className="text-muted-foreground leading-relaxed mb-6">
          Navigate to dashboard using sidebar and header controls:
        </p>

        <div className="space-y-6">
          <div>
            <h3 className="font-semibold mb-2">Sidebar Navigation</h3>
            <p className="text-muted-foreground mb-2">
              The left sidebar provides quick access to all major sections of your dashboard:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
              <li><strong>Get Started</strong> — Onboarding checklist and initial setup</li>
              <li><strong>Dashboard</strong> — Jobs and candidates management</li>
              <li><strong>Customize Form</strong> — Configure your application form fields</li>
              <li><strong>Reachout Templates</strong> — Set up email templates for candidate outreach</li>
              <li><strong>Bulk Upload</strong> — Upload multiple resumes at once</li>
              <li><strong>Candidates</strong> — View all candidates across all jobs</li>
              <li><strong>Team</strong> — Manage team members (admin only)</li>
              <li><strong>Billing</strong> — Credits, subscriptions, and invoices (admin only)</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Jobs List (Left Panel)</h3>
            <p className="text-muted-foreground mb-2">
              The left panel displays all your job postings with key information:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
              <li><strong>Job Title</strong> — Name of the position</li>
              <li><strong>Job Posting Link</strong> — Unique code for the job posting</li>
              <li><strong>Applicant Count</strong> — Number of candidates for this job</li>
              <li><strong>Requirement Counts</strong> — Preferred (PR) and Non-Negotiable (NN) requirements</li>
              <li><strong>Action Buttons</strong> — Copy email, copy form link, view job details</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Candidates List (Right Panel)</h3>
            <p className="text-muted-foreground mb-2">
              The right panel shows candidates for the selected job:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
              <li><strong>Match Score</strong> — AI-calculated compatibility percentage</li>
              <li><strong>Candidate Info</strong> — Name, email, application date</li>
              <li><strong>Resume Link</strong> — Download candidate's resume</li>
              <li><strong>Requirements Met</strong> — Preferred and non-negotiable counts</li>
              <li><strong>Action Buttons</strong> — AI Analysis, Shortlist, Reject</li>
            </ul>
          </div>
        </div>
      </section>

      <section id="quick-actions" className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 scroll-mt-24">Quick Actions</h2>
        <p className="text-muted-foreground leading-relaxed mb-6">
          Perform common tasks directly from the dashboard:
        </p>

        <div className="space-y-6">
          <div>
            <h3 className="font-semibold mb-2">Create Job</h3>
            <p className="text-muted-foreground mb-2">
              Click the "Add New Job" button at the top of the Jobs List to create a new job posting. This opens the job creation dialog where you can enter job details, requirements, and logistics.
            </p>
            <p className="text-sm text-muted-foreground">
              Requires <DocLink to="/docs/get-started/add-team-members">admin permission</DocLink> to create jobs.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Search Jobs</h3>
            <p className="text-muted-foreground mb-2">
              Use the search bar in the Jobs List to filter jobs by title or job posting link. This helps you quickly find specific positions when you have many jobs.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Collapse/Expand Panels</h3>
            <p className="text-muted-foreground mb-2">
              Click the collapse button in the Jobs List header to toggle between full-width and collapsed views. In collapsed mode, jobs are shown as icons with initials, saving screen space.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Select Job</h3>
            <p className="text-muted-foreground mb-2">
              Click on any job card in the Jobs List to view its candidates in the right panel. The selected job is highlighted with a ring and background color.
            </p>
          </div>
        </div>
      </section>

      <section id="analytics" className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 scroll-mt-24">Analytics</h2>
        <p className="text-muted-foreground leading-relaxed mb-6">
          The dashboard provides real-time analytics to help you understand your hiring pipeline:
        </p>

        <div className="bg-muted/50 border rounded-lg p-6 my-6">
          <h3 className="font-semibold mb-3">Dashboard Layout</h3>
          <p className="text-sm text-muted-foreground mb-3">
            The dashboard is organized into a two-panel layout for efficient workflow:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#4366B0]/10 border border-[#4366B0]/20 rounded-lg p-4">
              <h4 className="font-semibold mb-2 text-[#4366B0]">Jobs List (Left Panel)</h4>
              <p className="text-xs text-muted-foreground">
                • All your job postings<br/>
                • Search and filter capabilities<br/>
                • Quick access to job details
              </p>
            </div>
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4">
              <h4 className="font-semibold mb-2 text-emerald-700 dark:text-emerald-400">Candidates List (Right Panel)</h4>
              <p className="text-xs text-muted-foreground">
                • Candidates for selected job<br/>
                • AI-powered match scores<br/>
                • Shortlist and reject actions
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="border-l-4 border-emerald-500 pl-4">
            <h3 className="font-semibold mb-2">Match Scores</h3>
            <p className="text-muted-foreground mb-2">
              Each candidate card displays an AI-calculated match score (0-100%) based on how well they meet your job requirements. The score is color-coded:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                <h4 className="font-semibold mb-2 text-green-700 dark:text-green-400">80%+</h4>
                <p className="text-sm text-muted-foreground">Strong match — Green border and score</p>
              </div>
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                <h4 className="font-semibold mb-2 text-yellow-700 dark:text-yellow-400">40-79%</h4>
                <p className="text-sm text-muted-foreground">Moderate match — Yellow border and score</p>
              </div>
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                <h4 className="font-semibold mb-2 text-red-700 dark:text-red-400">{"<"}40%</h4>
                <p className="text-sm text-muted-foreground">Weak match — Red border and score</p>
              </div>
            </div>
          </div>

          <div className="border-l-4 border-emerald-500 pl-4">
            <h3 className="font-semibold mb-2">Applicant Counts</h3>
            <p className="text-muted-foreground mb-2">
              Each job card shows the total number of applicants for that position. This helps you prioritize which jobs need attention and understand your hiring volume.
            </p>
          </div>

          <div className="border-l-4 border-emerald-500 pl-4">
            <h3 className="font-semibold mb-2">Requirement Counts</h3>
            <p className="text-muted-foreground mb-2">
              Job cards display the number of Preferred (PR) and Non-Negotiable (NN) requirements. Candidate cards show how many of each requirement type they meet:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground mt-4">
              <li><strong>Preferred Requirements</strong> — Nice-to-have skills/qualifications (blue badges)</li>
              <li><strong>Non-Negotiables</strong> — Must-have requirements (red badges)</li>
              <li>Badges show met/total counts (e.g., "3/5" means 3 of 5 requirements met)</li>
            </ul>
          </div>
        </div>
      </section>

      <section id="related-pages" className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 scroll-mt-24">Related Pages</h2>
        <div className="space-y-3">
          <p>
            <DocLink to="/docs/dashboard/candidate-card/overview">Candidate Card — Overview</DocLink> — Understanding candidate cards and their components
          </p>
          <p>
            <DocLink to="/docs/dashboard/candidate-card/profile-dialog">AI Analysis Dialog</DocLink> — Viewing detailed candidate information
          </p>
          <p>
            <DocLink to="/docs/dashboard/candidate-card/shortlisting-rejecting">Shortlisting/Rejecting Candidates</DocLink> — Managing candidate workflow
          </p>
          <p>
            <DocLink to="/docs/dashboard/job-card/overview">Job Card — Overview</DocLink> — Understanding job cards in the sidebar
          </p>
          <p>
            <DocLink to="/docs/dashboard/job-card/job-details">Job Details</DocLink> — Viewing and editing job information
          </p>
        </div>
      </section>
    </DocumentationPage>
  );
}
