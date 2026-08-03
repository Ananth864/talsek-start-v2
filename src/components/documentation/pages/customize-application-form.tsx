import { DocLink } from '#/components/documentation/DocLink';
import { DocumentationPage } from '#/components/documentation/DocumentationPage';
import { getPageSections } from '#/components/documentation/docStructure';

export default function CustomizeApplicationForm() {
  return (
    <DocumentationPage
      title="Customize Application Form"
      sections={getPageSections('/docs/get-started/customize-application-form')}
    >
      <section id="form-overview" className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 scroll-mt-24">Form Overview</h2>
        <p className="text-muted-foreground leading-relaxed mb-4">
          Application form collects information from candidates during the application process. You can customize which fields to include, what type of data to collect, and how questions are presented.
        </p>
        <p className="text-muted-foreground leading-relaxed">
          To access form customization settings, go to <DocLink to="/form-settings">Form Settings</DocLink> page in your dashboard.
        </p>
      </section>

      <section id="adding-removing-fields" className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 scroll-mt-24">Adding & Removing Fields</h2>
        <p className="text-muted-foreground leading-relaxed mb-4">
          Customize your form by adding or removing fields based on what information you need from candidates:
        </p>
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Adding Fields</h3>
            <p className="text-muted-foreground">
              Click "Add Field" button and select the type of field you want to add. Position it where you want it in the form.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Removing Fields</h3>
            <p className="text-muted-foreground">
              Hover over any field and click the delete button to remove it from the form.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Reordering Fields</h3>
            <p className="text-muted-foreground">
              Drag and drop fields to change their order in the form.
            </p>
          </div>
        </div>
      </section>

      <section id="field-types" className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 scroll-mt-24">Field Types</h2>
        <p className="text-muted-foreground leading-relaxed mb-4">
          Different field types collect different types of information. Choose the right type for each question:
        </p>
        <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
          <li>
            <strong>Text</strong> — Short text responses (e.g., name, phone number)
          </li>
          <li>
            <strong>Text Area</strong> — Longer responses (e.g., cover letter)
          </li>
          <li>
            <strong>Email</strong> — Email addresses with validation
          </li>
          <li>
            <strong>Number</strong> — Numeric values (e.g., years of experience)
          </li>
          <li>
            <strong>Date</strong> — Date selection (e.g., availability start date)
          </li>
          <li>
            <strong>File Upload</strong> — Resume and other document uploads
          </li>
          <li>
            <strong>Dropdown</strong> — Select one option from a list
          </li>
          <li>
            <strong>Checkbox</strong> — Multiple choice selections
          </li>
        </ul>
      </section>

      <section id="previewing" className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 scroll-mt-24">Previewing Your Form</h2>
        <p className="text-muted-foreground leading-relaxed mb-4">
          Before publishing your form, use the preview feature to see how candidates will experience it:
        </p>
        <ol className="list-decimal pl-6 space-y-2 text-muted-foreground">
          <li>Click "Preview" button in form editor</li>
          <li>Test filling out the form as a candidate would</li>
          <li>Check that all fields work as expected</li>
          <li>Make any necessary adjustments</li>
          <li>Click "Save" to apply changes</li>
        </ol>
      </section>

      <section id="related" className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 scroll-mt-24">Related Pages</h2>
        <div className="space-y-3">
          <p>
            <DocLink to="/docs/get-started">Get Started Overview</DocLink> — Back to getting started guide
          </p>
          <p>
            <DocLink to="/docs/get-started/set-reachout-template">Set Reachout Template</DocLink> — Create email templates for candidate outreach
          </p>
          <p>
            <DocLink to="/docs/get-started/add-team-members">Add Team Members</DocLink> — Invite collaborators to your account
          </p>
          <p>
            <DocLink to="/docs/create-a-job">Create a Job</DocLink> — Set up your first job posting
          </p>
        </div>
      </section>
    </DocumentationPage>
  );
}
