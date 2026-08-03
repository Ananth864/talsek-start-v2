import { DocLink } from '#/components/documentation/DocLink';
import { DocumentationPage } from '#/components/documentation/DocumentationPage';
import { getPageSections } from '#/components/documentation/docStructure';

export default function JobCardJobDetails() {
  return (
    <DocumentationPage
      title="Job Details"
      sections={getPageSections('/docs/dashboard/job-card/job-details')}
    >
      <section id="overview" className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 scroll-mt-24">Overview</h2>
        <p className="text-muted-foreground leading-relaxed mb-4">
          The Job Details modal provides comprehensive information about a job posting, allowing you to review and edit all job configuration. This includes job description, requirements, logistics, and application form settings.
        </p>
        <p className="text-muted-foreground leading-relaxed">
          The modal is accessible by clicking the edit (pencil) icon on any job card in the Jobs List. It opens as an overlay on top of your dashboard, allowing you to make changes without navigating away from your current view.
        </p>
      </section>

      <section id="accessing" className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 scroll-mt-24">Accessing Job Details</h2>
        <p className="text-muted-foreground leading-relaxed mb-6">
          Open the Job Details modal by clicking the edit (pencil) icon on any job card in the Jobs List.
        </p>

        <div className="space-y-3">
          <p className="text-muted-foreground"><strong>From Job Card</strong> — Click the edit (pencil) icon on any job card to open the modal</p>
          <p className="text-muted-foreground"><strong>Modal Behavior</strong> — Modal appears centered on screen, content scrolls, and closes with X or Escape</p>
        </div>
      </section>

      <section id="sections" className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 scroll-mt-24">Information Sections</h2>
        <p className="text-muted-foreground leading-relaxed mb-6">
          The Job Details modal is organized into several sections:
        </p>

        <div className="space-y-3">
          <p className="text-muted-foreground"><strong>Basic Information</strong> — Job title, posting code, company name, and status</p>
          <p className="text-muted-foreground"><strong>Job Description</strong> — Rich text editor for detailed role information shown to candidates</p>
          <p className="text-muted-foreground"><strong>Requirements</strong> — Preferred requirements (bonus points) and non-negotiables (deal-breakers) for AI matching</p>
          <p className="text-muted-foreground"><strong>Logistics Configuration</strong> — Location, employment type, salary range, experience level, and start date</p>
          <p className="text-muted-foreground"><strong>Application Form Settings</strong> — Enable/disable form, customize questions, and manage form link and expiration — See <DocLink to="/docs/get-started/customize-application-form">Customize Application Form</DocLink></p>
        </div>
      </section>

      <section id="actions" className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 scroll-mt-24">Editing Requirements</h2>
        <p className="text-muted-foreground leading-relaxed mb-6">
          You can edit which requirements are included in your job's AI matching criteria:
        </p>

        <div className="space-y-6">
          <div className="border-l-4 border-emerald-500 pl-4">
            <h3 className="font-semibold mb-2">Start Editing</h3>
            <p className="text-muted-foreground mb-2">
              Click the "Edit Requirements" button at the top of the Requirements section:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
              <li><strong>Checkboxes Appear</strong> — Each requirement shows a checkbox</li>
              <li><strong>Toggle Inclusion</strong> — Check or uncheck to include/exclude requirements</li>
              <li><strong>Visual Feedback</strong> — Unchecked items appear crossed out with reduced opacity</li>
            </ul>
          </div>

          <div className="border-l-4 border-emerald-500 pl-4">
            <h3 className="font-semibold mb-2">Save Changes</h3>
            <p className="text-muted-foreground mb-2">
              Click "Save Changes" to apply your edits:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
              <li><strong>Validation</strong> — Must have at least one preferred and one non-negotiable requirement</li>
              <li><strong>Update Database</strong> — Requirements are saved to your job configuration</li>
              <li><strong>Exit Edit Mode</strong> — Returns to view mode with updated requirements</li>
              <li><strong>Toast Notification</strong> — "Requirements updated" message appears</li>
            </ul>
          </div>

          <div className="border-l-4 border-emerald-500 pl-4">
            <h3 className="font-semibold mb-2">Cancel Editing</h3>
            <p className="text-muted-foreground mb-2">
              Click "Cancel" to discard your changes:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
              <li><strong>Discard Changes</strong> — All edits are discarded</li>
              <li><strong>Exit Edit Mode</strong> — Returns to view mode with original requirements</li>
            </ul>
          </div>
        </div>
      </section>

      <section id="related" className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 scroll-mt-24">Related Pages</h2>
        <div className="space-y-3">
          <p>
            <DocLink to="/docs/dashboard/job-card/overview">Job Card — Overview</DocLink> — Understanding job cards in the dashboard
          </p>
          <p>
            <DocLink to="/docs/create-a-job">Create a Job</DocLink> — Creating new job postings
          </p>
          <p>
            <DocLink to="/docs/get-started/customize-application-form">Customize Application Form</DocLink> — Configuring form fields and settings
          </p>
          <p>
            <DocLink to="/docs/getting-candidates">Getting Candidates</DocLink> — Sharing job links and receiving applications
          </p>
        </div>
      </section>
    </DocumentationPage>
  );
}
