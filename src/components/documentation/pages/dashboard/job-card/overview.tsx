import { DocLink } from '#/components/documentation/DocLink';
import { DocumentationPage } from '#/components/documentation/DocumentationPage';
import { getPageSections } from '#/components/documentation/docStructure';

export default function JobCardOverview() {
  return (
    <DocumentationPage
      title="Job Card — Overview"
      sections={getPageSections('/docs/dashboard/job-card/overview')}
    >
      <section id="overview" className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 scroll-mt-24">Overview</h2>
        <p className="text-muted-foreground leading-relaxed mb-4">
          A Job Card is primary display unit for your job postings in dashboard's left panel. Each card represents a single job position and provides quick access to key information, candidate counts, and actions for managing of job.
        </p>
        <p className="text-muted-foreground leading-relaxed">
          Job cards appear in Jobs List section of your dashboard, allowing you to select jobs to view their candidates, copy sharing links, and access job details.
        </p>

        <div className="bg-muted/50 border rounded-lg p-6 my-6">
          <h3 className="font-semibold mb-3">Job Card Anatomy</h3>
          <img
            src="/images/job-card.png"
            alt="Job Card Anatomy"
            className="w-full rounded-lg border border-border"
          />
        </div>
      </section>

      <section id="components" className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 scroll-mt-24">Components</h2>
        <p className="text-muted-foreground leading-relaxed mb-6">
          Each job card contains several key components:
        </p>

        <div className="space-y-3">
          <p className="text-muted-foreground"><strong>Job Title</strong> — Full job position name displayed prominently at the top</p>
          <p className="text-muted-foreground"><strong>Job Posting Code</strong> — A unique identifier for the job to enable quick search</p>
          <p className="text-muted-foreground"><strong>Applicant Count</strong> — Total number of applicants for this job</p>
          <p className="text-muted-foreground"><strong>Requirement Counts</strong> — Two badges showing preferred requirements (PR) and non-negotiables (NN)</p>
          <p className="text-muted-foreground"><strong>Action Buttons</strong> — Copy email, copy form link, and view details</p>
        </div>
      </section>

      <section id="candidates" className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 scroll-mt-24">Candidates</h2>
        <p className="text-muted-foreground leading-relaxed mb-6">
          The primary purpose of job cards is to access candidate lists:
        </p>

        <div className="space-y-6">
          <div>
            <h3 className="font-semibold mb-2">Selecting a Job</h3>
            <p className="text-muted-foreground mb-2">
              Click on any job card to view its candidates:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
              <li><strong>Click Action</strong> — Click anywhere on the card</li>
              <li><strong>Right Panel Update</strong> — Candidates panel shows candidates for selected job</li>
              <li><strong>Selection Indicator</strong> — Selected job shows ring and background highlight</li>
              <li><strong>Persistence</strong> — Selected job remains selected until you click another</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Empty State</h3>
            <p className="text-muted-foreground mb-2">
              If a job has no candidates, the right panel shows:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
              <li><strong>Message</strong> — "No candidates yet" text</li>
              <li><strong>Call to Action</strong> — "Create your first job posting!" prompt</li>
              <li><strong>Helpful Text</strong> — "Try a different search term" if searching</li>
              <li><strong>Purpose</strong> — Guides users to add candidates or select a different job</li>
            </ul>
          </div>
        </div>
      </section>

      <section id="actions" className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 scroll-mt-24">Available Actions</h2>
        <p className="text-muted-foreground leading-relaxed mb-6">
          Job cards provide three primary actions:
        </p>

        <div className="space-y-3">
          <p className="text-muted-foreground"><strong>Copy Forwarding Email</strong> — Copy job's forwarding email to clipboard for sharing with candidates</p>
          <p className="text-muted-foreground"><strong>Copy Form Link</strong> — Copy application form link to clipboard for sharing on job boards and social media</p>
          <p className="text-muted-foreground"><strong>View Job Details</strong> — Open <DocLink to="/docs/dashboard/job-card/job-details">Job Details modal</DocLink> to view and edit all job information</p>
        </div>
      </section>

      <section id="related" className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 scroll-mt-24">Related Pages</h2>
        <div className="space-y-3">
          <p>
            <DocLink to="/docs/dashboard/job-card/job-details">Job Details</DocLink> — Viewing and editing job information
          </p>
          <p>
            <DocLink to="/docs/dashboard/candidate-card/overview">Candidate Card — Overview</DocLink> — Understanding candidate cards for selected jobs
          </p>
          <p>
            <DocLink to="/docs/create-a-job">Create a Job</DocLink> — Creating new job postings
          </p>
          <p>
            <DocLink to="/docs/getting-candidates">Getting Candidates</DocLink> — Sharing job links and receiving applications
          </p>
        </div>
      </section>
    </DocumentationPage>
  );
}
