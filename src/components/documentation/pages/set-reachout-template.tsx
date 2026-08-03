import { DocLink } from '#/components/documentation/DocLink';
import { DocumentationPage } from '#/components/documentation/DocumentationPage';
import { getPageSections } from '#/components/documentation/docStructure';

export default function SetReachoutTemplate() {
  return (
    <DocumentationPage
      title="Set Reachout Template"
      sections={getPageSections('/docs/get-started/set-reachout-template')}
    >
      <section id="template-overview" className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 scroll-mt-24">Template Overview</h2>
        <p className="text-muted-foreground leading-relaxed mb-4">
          Reachout templates are pre-written email messages sent to candidates when you shortlist them. Templates save time and ensure consistent communication across your team.
        </p>
        <p className="text-muted-foreground leading-relaxed">
          To access template settings, go to <DocLink to="/reachout-templates">Reachout Templates</DocLink> page in your dashboard.
        </p>
      </section>

      <section id="email-structure" className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 scroll-mt-24">Email Structure</h2>
        <p className="text-muted-foreground leading-relaxed mb-4">
          When creating a reachout template, configure the email components in this order:
        </p>
        
        <div className="space-y-4">
          <div className="border-l-4 border-[#4366B0] pl-4">
            <h3 className="font-semibold mb-2">1. Reply-to Email</h3>
            <p className="text-muted-foreground">
              Configure the email address that will receive candidate replies.
            </p>
          </div>          
          <div className="border-l-4 border-[#4366B0] pl-4">
            <h3 className="font-semibold mb-2">2. Subject Line</h3>
            <p className="text-muted-foreground">
              Set the subject line for your email.
            </p>
          </div>          
          <div className="border-l-4 border-[#4366B0] pl-4">
            <h3 className="font-semibold mb-2">3. Message Body</h3>
            <p className="text-muted-foreground">
              Write the main email content using template variables.
            </p>
          </div>
        </div>
      </section>

      <section id="variables" className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 scroll-mt-24">Template Variables</h2>
        <p className="text-muted-foreground leading-relaxed mb-4">
          Templates use variables to personalize each email. These are replaced with actual candidate or job information when the email is sent.
        </p>
 
        <div className="overflow-x-auto my-6">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="py-3 px-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Variable</th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Description</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b hover:bg-muted/30 transition-colors">
                <td className="py-4 px-4 font-medium">{`{{candidate_name}}`}</td>
                <td className="py-4 px-4 text-muted-foreground">Candidate's full name</td>
              </tr>
              <tr className="border-b hover:bg-muted/30 transition-colors">
                <td className="py-4 px-4 font-medium">{`{{job_title}}`}</td>
                <td className="py-4 px-4 text-muted-foreground">Title of the job position</td>
              </tr>
              <tr className="border-b hover:bg-muted/30 transition-colors">
                <td className="py-4 px-4 font-medium">{`{{company_name}}`}</td>
                <td className="py-4 px-4 text-muted-foreground">Your company name</td>
              </tr>
              <tr className="border-b hover:bg-muted/30 transition-colors">
                <td className="py-4 px-4 font-medium">{`{{recruiter_name}}`}</td>
                <td className="py-4 px-4 text-muted-foreground">Name of the recruiter sending the email</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 my-6">
        <p className="text-sm text-muted-foreground">
          <strong>Note:</strong> Remember to click the "Save" button to save your template changes.
        </p>
      </div>

      <section id="related" className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 scroll-mt-24">Related Pages</h2>
        <div className="space-y-3">
          <p>
            <DocLink to="/docs/get-started">Get Started Overview</DocLink> — Back to getting started guide
          </p>
          <p>
            <DocLink to="/docs/get-started/customize-application-form">Customize Application Form</DocLink> — Configure your application form fields
          </p>
          <p>
            <DocLink to="/docs/get-started/add-team-members">Add Team Members</DocLink> — Invite collaborators to your account
          </p>
        </div>
      </section>
    </DocumentationPage>
  );
}
