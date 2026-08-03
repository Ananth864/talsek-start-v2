import { DocLink } from '#/components/documentation/DocLink';
import { DocumentationPage } from '#/components/documentation/DocumentationPage';
import { getPageSections } from '#/components/documentation/docStructure';

export default function ShortlistingRejecting() {
  return (
    <DocumentationPage
      title="Shortlisting/Rejecting Candidates"
      sections={getPageSections('/docs/dashboard/candidate-card/shortlisting-rejecting')}
    >
      <section id="overview" className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 scroll-mt-24">Overview</h2>
        <p className="text-muted-foreground leading-relaxed mb-4">
          Moving candidates through your hiring pipeline is a core workflow in Talsek. The shortlisting process advances candidates to the next hiring stage, while rejecting removes them from consideration. Both actions are performed directly from candidate cards in your dashboard.
        </p>
        <p className="text-muted-foreground leading-relaxed">
          Your hiring pipeline is defined by stages (e.g., "Resume Screening," "Screening Interview," "Final Reachout"). Shortlisting moves candidates forward through these stages, while rejecting ends their journey in your pipeline.
        </p>

        <div className="bg-muted/50 border rounded-lg p-6 my-6">
          <h3 className="font-semibold mb-3">Hiring Pipeline Flow</h3>
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1 bg-[#4366B0]/10 border border-[#4366B0]/20 rounded-lg p-4">
              <p className="text-sm text-center font-semibold text-[#4366B0]">Resume Screening</p>
              <p className="text-xs text-muted-foreground text-center mt-1">AI-powered resume analysis</p>
            </div>
            <div className="text-3xl text-muted-foreground">→</div>
            <div className="flex-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4">
              <p className="text-sm text-center font-semibold text-emerald-700 dark:text-emerald-400">Screening Interview</p>
              <p className="text-xs text-muted-foreground text-center mt-1">AI-powered video interviews</p>
            </div>
            <div className="text-3xl text-muted-foreground">→</div>
            <div className="flex-1 bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
              <p className="text-sm text-center font-semibold text-purple-700 dark:text-purple-400">Final Reachout</p>
              <p className="text-xs text-muted-foreground text-center mt-1">Personalized email outreach</p>
            </div>
          </div>
        </div>
      </section>

      <section id="shortlisting" className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 scroll-mt-24">Shortlisting Candidates</h2>
        <p className="text-muted-foreground leading-relaxed mb-6">
          Shortlisting a candidate moves them to the next hiring stage and initiates communication:
        </p>

        <div className="space-y-6">
          <div>
            <h3 className="font-semibold mb-2">Shortlist Flow</h3>
            <p className="text-muted-foreground mb-2">
              When you click the Shortlist button, the following sequence occurs:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
              <li><strong>Template Setup</strong> — If this is your first time shortlisting, you'll configure your reachout template</li>
              <li><strong>Confirmation Modal</strong> — Review the generated email and candidate's next stage</li>
              <li><strong>Credit Check</strong> — If moving to Screening Interview, system verifies you have sufficient credits</li>
              <li><strong>Email Sending</strong> — Email is sent to the candidate</li>
              <li><strong>Stage Progression</strong> — Candidate moves to the next hiring stage</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Template Setup (First Time)</h3>
            <p className="text-muted-foreground mb-2">
              The first time you shortlist a candidate, you'll be prompted to set up your reachout template:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
              <li>Clicking "Shortlist" opens the <DocLink to="/docs/get-started/set-reachout-template">Reachout Template Modal</DocLink></li>
              <li>Configure email subject and body for your outreach</li>
              <li>Use template variables like <code className="bg-muted px-1 py-0.5 rounded text-sm">{"{{candidate_name}}"}</code> and <code className="bg-muted px-1 py-0.5 rounded text-sm">{"{{job_title}}"}</code></li>
              <li>Save template for future use</li>
            </ul>
            <div className="bg-muted/50 border rounded-lg p-4 mt-4">
              <p className="text-sm text-muted-foreground">
                <strong>Template Types:</strong> You'll set up two templates — one for "Screening Interview" stage and one for "Final Reachout" stage.
              </p>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Confirmation Modal</h3>
            <p className="text-muted-foreground mb-2">
              After template setup, shortlisting shows a confirmation modal with:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
              <li><strong>Generated Email</strong> — Personalized message using your template</li>
              <li><strong>Subject Line</strong> — Email subject (editable before sending)</li>
              <li><strong>Email Body</strong> — Full email content (editable before sending)</li>
              <li><strong>Next Stage</strong> — Shows the stage candidate will move to</li>
              <li><strong>Confirm/Cancel</strong> — Buttons to proceed or cancel</li>
            </ul>
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 mt-4">
              <p className="text-sm text-muted-foreground">
                <strong>Tip:</strong> Review and edit the generated email before sending to ensure it meets your standards.
              </p>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Sending the Interview Link</h3>
            <p className="text-muted-foreground mb-2">
              When you shortlist a candidate to the "Screening Interview" stage, the email sent to them will include a unique interview link.
            </p>
            <p className="text-muted-foreground mb-4">
              The candidate simply clicks the link in the email to start their interview — no login or account required.
            </p>
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mt-4">
              <p className="text-sm text-muted-foreground">
                <strong>Quick Add:</strong> Use <code className="bg-muted px-1 py-0.5 rounded text-sm">{"{{interview_link}}"}</code> in your email template to automatically include the interview link as a clickable button.
              </p>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Credit Check</h3>
            <p className="text-muted-foreground mb-2">
              Shortlisting to the "Screening Interview" stage requires sufficient credits:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
              <li><strong>Interview Cost</strong> — Each interview consumes credits (varies by plan)</li>
              <li><strong>Balance Check</strong> — System verifies you have enough credits before proceeding</li>
              <li><strong>Insufficient Credits</strong> — Shows the <DocLink to="/docs/billing/overview">Insufficient Credits Modal</DocLink> prompting you to add credits</li>
            </ul>
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 mt-4">
              <p className="text-sm text-muted-foreground">
                <strong>Note:</strong> Shortlisting to other stages (e.g., "Final Reachout") does not consume interview credits.
              </p>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Permission Requirements</h3>
            <p className="text-muted-foreground mb-2">
              Shortlisting candidates requires specific permissions:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
              <li><strong>canSendReachout</strong> — Permission to send reachout emails</li>
              <li><strong>No Permission</strong> — Shortlist button is disabled and shows lock icon</li>
            </ul>
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mt-4">
              <p className="text-sm text-muted-foreground">
                <strong>Access Denied:</strong> If you don't have permission, contact your admin to <DocLink to="/docs/get-started/add-team-members">add team members</DocLink> and manage permissions.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="rejecting" className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 scroll-mt-24">Rejecting Candidates</h2>
        <p className="text-muted-foreground leading-relaxed mb-6">
          Rejecting removes a candidate from your hiring pipeline:
        </p>

        <div className="space-y-6">
          <div>
            <h3 className="font-semibold mb-2">Reject Flow</h3>
            <p className="text-muted-foreground mb-2">
              When you click the Reject button, the following sequence occurs:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
              <li><strong>Confirmation Dialog</strong> — System asks you to confirm the rejection</li>
              <li><strong>Warning Message</strong> — Shows that the candidate card will disappear from your dashboard</li>
              <li><strong>Confirm Action</strong> — If confirmed, candidate is marked as rejected in database</li>
              <li><strong>Card Removal</strong> — Candidate card disappears from dashboard view</li>
              <li><strong>Permanent Action</strong> — Cannot be undone</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Confirmation Dialog</h3>
            <p className="text-muted-foreground mb-2">
              Clicking Reject opens a confirmation dialog:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
              <li><strong>Warning Message</strong> — "This candidate card will disappear from your dashboard view"</li>
              <li><strong>Confirmation Question</strong> — "Are you sure you want to reject this candidate?"</li>
              <li><strong>Cancel Button</strong> — Returns to dashboard without action</li>
              <li><strong>Confirm Button</strong> — Red button to proceed with rejection</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Rejection Process</h3>
            <p className="text-muted-foreground mb-2">
              After confirmation, the system:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
              <li><strong>Updates Status</strong> — Marks candidate as "rejected" in database</li>
              <li><strong>Removes Card</strong> — Card disappears from dashboard view</li>
              <li><strong>Permanent Action</strong> — Cannot be undone</li>
            </ul>
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mt-4">
              <p className="text-sm text-muted-foreground">
                <strong>Warning:</strong> Rejecting a candidate is permanent. Make sure you've reviewed their profile and AI analysis before proceeding.
              </p>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Button States</h3>
            <p className="text-muted-foreground mb-2">
              The Reject button shows different states during the process:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
              <li><strong>Normal</strong> — Red "Reject" button with trash icon</li>
              <li><strong>Processing</strong> — Button disabled, shows loading spinner</li>
              <li><strong>Disabled</strong> — Grayed out if candidate is already rejected</li>
            </ul>
          </div>
        </div>
      </section>

      <section id="bulk-actions" className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 scroll-mt-24">Bulk Actions</h2>
        <p className="text-muted-foreground leading-relaxed mb-6">
          When you need to process multiple candidates at once, Talsek provides powerful bulk action capabilities. Instead of handling candidates one by one, you can select multiple candidates and shortlist or reject them in a single operation.
        </p>

        <div className="space-y-6">
          <div>
            <h3 className="font-semibold mb-2">Accessing Bulk Actions</h3>
            <p className="text-muted-foreground mb-2">
              Bulk actions are accessed from the candidate list header:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
              <li><strong>Bulk Action Dropdown</strong> — Located next to the Filter button in the candidate list header</li>
              <li><strong>Select to Shortlist</strong> — Enters selection mode for bulk shortlisting candidates to the next stage</li>
              <li><strong>Select to Reject</strong> — Enters selection mode for bulk rejecting candidates</li>
            </ul>
            <div className="bg-muted/50 border rounded-lg p-4 mt-4">
              <p className="text-sm text-muted-foreground">
                <strong>Note:</strong> Bulk actions are only available when there is a next stage to move candidates to. On the final stage, bulk shortlist is disabled.
              </p>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Selection Mode</h3>
            <p className="text-muted-foreground mb-2">
              After clicking a bulk action option, you enter selection mode:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
              <li><strong>Candidate Selection</strong> — Click on individual candidate cards to select/deselect them</li>
              <li><strong>Select All</strong> — Use the "Select All" button to select all visible candidates at once</li>
              <li><strong>Selection Counter</strong> — Shows how many candidates are currently selected</li>
              <li><strong>Stage Tabs Disabled</strong> — While in selection mode, you cannot switch between stages</li>
              <li><strong>Cancel</strong> — Exit selection mode without performing any action</li>
              <li><strong>Confirm</strong> — Proceed with the bulk action for selected candidates</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Bulk Shortlist</h3>
            <p className="text-muted-foreground mb-2">
              Bulk shortlisting allows you to move multiple candidates to the next hiring stage simultaneously:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
              <li><strong>Email Template</strong> — Review and customize the email that will be sent to all selected candidates</li>
              <li><strong>Template Variables</strong> — Variables like <code className="bg-muted px-1 py-0.5 rounded text-sm">{"{{candidate_name}}"}</code> are personalized for each candidate</li>
              <li><strong>Interview Link</strong> — For interview stage transitions, ensure the <code className="bg-muted px-1 py-0.5 rounded text-sm">{"{{interview_link}}"}</code> placeholder is included</li>
              <li><strong>Stage Transition</strong> — Shows current stage → next stage clearly in the modal</li>
              <li><strong>Progress Tracking</strong> — Real-time progress with elapsed time and estimated time remaining</li>
              <li><strong>Result Summary</strong> — Shows success/failure count after processing completes</li>
            </ul>
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mt-4">
              <p className="text-sm text-muted-foreground">
                <strong>Credit Check:</strong> When bulk shortlisting to the "Screening Interview" stage, the system verifies you have sufficient credits for all selected candidates before proceeding.
              </p>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Bulk Reject</h3>
            <p className="text-muted-foreground mb-2">
              Bulk rejection allows you to mark multiple candidates as rejected in one operation:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
              <li><strong>Confirmation</strong> — Review the number of candidates to be rejected</li>
              <li><strong>Warning</strong> — Clear warning that candidates will be removed from the active pipeline</li>
              <li><strong>Progress Bar</strong> — Visual progress indicator during batch processing</li>
              <li><strong>Result Summary</strong> — Shows how many candidates were successfully rejected</li>
            </ul>
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mt-4">
              <p className="text-sm text-muted-foreground">
                <strong>Warning:</strong> Bulk rejection is permanent and cannot be undone. Make sure you've reviewed the selected candidates before confirming.
              </p>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Error Handling</h3>
            <p className="text-muted-foreground mb-2">
              Bulk operations may partially succeed if some candidates fail to process:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
              <li><strong>Partial Success</strong> — If some candidates succeed and others fail, you'll see a breakdown</li>
              <li><strong>Error Details</strong> — Failed candidates show the reason for failure</li>
              <li><strong>Retry</strong> — You can retry failed candidates individually or in a new bulk operation</li>
            </ul>
          </div>
        </div>
      </section>

      <section id="related" className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 scroll-mt-24">Related Pages</h2>
        <div className="space-y-3">
          <p>
            <DocLink to="/docs/dashboard/candidate-card/overview">Candidate Card — Overview</DocLink> — Understanding candidate card components and status indicators
          </p>
          <p>
            <DocLink to="/docs/dashboard/candidate-card/profile-dialog">AI Analysis Dialog</DocLink> — Viewing detailed AI analysis and candidate information
          </p>
          <p>
            <DocLink to="/docs/get-started/set-reachout-template">Set Reachout Template</DocLink> — Configuring email templates for candidate outreach
          </p>
          <p>
            <DocLink to="/docs/billing/overview">Billing Overview</DocLink> — Understanding credit costs for interviews
          </p>
          <p>
            <DocLink to="/docs/core-ai-services/overview">Core AI Services</DocLink> — How AI analysis and matching works
          </p>
        </div>
      </section>
    </DocumentationPage>
  );
}
