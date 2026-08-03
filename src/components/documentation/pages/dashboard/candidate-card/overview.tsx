import { DocLink } from '#/components/documentation/DocLink';
import { DocumentationPage } from '#/components/documentation/DocumentationPage';
import { getPageSections } from '#/components/documentation/docStructure';

export default function CandidateCardOverview() {
  return (
    <DocumentationPage
      title="Candidate Card — Overview"
      sections={getPageSections('/docs/dashboard/candidate-card/overview')}
    >
      <section id="what-is" className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 scroll-mt-24">What is a Candidate Card?</h2>
        <p className="text-muted-foreground leading-relaxed mb-4">
          A Candidate Card is primary display unit for individual candidates in your dashboard. Each card represents a single applicant for a selected job, providing a quick overview of their qualifications, AI analysis results, and available actions.
        </p>
        <p className="text-muted-foreground leading-relaxed">
          Candidate cards appear in the right panel of the dashboard when you select a job from the left panel. They are displayed in a scrollable list, with each card showing essential information at a glance.
        </p>

        <div className="bg-muted/50 border rounded-lg p-6 my-6">
          <h3 className="font-semibold mb-3">Candidate Card Layout</h3>
          <img
            src="/images/candidate-card.png"
            alt="Candidate Card Layout"
            className="w-full rounded-lg border border-border"
          />
        </div>
      </section>

      <section id="components" className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 scroll-mt-24">Components</h2>
        <p className="text-muted-foreground leading-relaxed mb-6">
          Each candidate card contains several key components:
        </p>

        <div className="space-y-6">
          <div>
            <h3 className="font-semibold mb-2">Match Score Circle</h3>
            <p className="text-muted-foreground mb-2">
              A circular progress indicator showing the AI-calculated match percentage (0-100%). The circle is color-coded based on the score:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
              <li><strong>Green (80%+)</strong> — Strong match</li>
              <li><strong>Yellow (40-79%)</strong> — Moderate match</li>
              <li><strong>Red ({"<"}40%)</strong> — Weak match</li>
            </ul>
            <p className="text-sm text-muted-foreground mt-2">
              The score is calculated by analyzing the candidate's resume against your job's preferred and non-negotiable requirements.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Candidate Information</h3>
            <p className="text-muted-foreground mb-2">
              The left side of the card displays candidate details:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
              <li><strong>Name</strong> — Candidate's full name (or email if name not available)</li>
              <li><strong>Email</strong> — Candidate's email address</li>
              <li><strong>Application Date</strong> — When the candidate applied</li>
              <li><strong>Resume Link</strong> — Download button to view the candidate's resume</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Requirements Badges</h3>
            <p className="text-muted-foreground mb-2">
              Two badges show how many requirements the candidate meets:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="bg-sky-500/10 border border-sky-500/20 rounded-lg p-4">
                <h4 className="font-semibold mb-2 text-sky-700 dark:text-sky-400">Preferred Requirements</h4>
                <p className="text-sm text-muted-foreground">
                  Blue badge showing met/total count (e.g., "3/5"). These are nice-to-have skills and qualifications.
                </p>
              </div>
              <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg p-4">
                <h4 className="font-semibold mb-2 text-rose-700 dark:text-rose-400">Non-Negotiables</h4>
                <p className="text-sm text-muted-foreground">
                  Red badge showing met/total count (e.g., "2/3"). These are must-have requirements.
                </p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Action Buttons</h3>
            <p className="text-muted-foreground mb-2">
              Three buttons at the bottom of the card allow you to take action on the candidate:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
              <li><strong>AI Analysis</strong> — View detailed AI analysis and candidate profile</li>
              <li><strong>Shortlist</strong> — Move candidate to next hiring stage</li>
              <li><strong>Reject</strong> — Remove candidate from consideration</li>
            </ul>
          </div>
        </div>
      </section>

      <section id="status" className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 scroll-mt-24">Status Indicators</h2>
        <p className="text-muted-foreground leading-relaxed mb-6">
          Candidate cards display various status indicators to help you understand their current state:
        </p>

        <div className="space-y-6">
          <div>
            <h3 className="font-semibold mb-2">Starred Status</h3>
            <p className="text-muted-foreground mb-2">
              A star icon in the top-right corner indicates whether the candidate is starred for later review. Click the star to toggle this status.
            </p>
            <div className="bg-muted/50 border rounded-lg p-4 mt-4">
              <p className="text-sm text-muted-foreground">
                <strong>Tip:</strong> Use starring to mark candidates you want to review later or compare with others.
              </p>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Processing States</h3>
            <p className="text-muted-foreground mb-2">
              Cards may show loading states when operations are in progress:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
              <li><strong>Star Updating</strong> — Star icon shows loading spinner while updating</li>
              <li><strong>Shortlist Processing</strong> — Button shows loading spinner while sending email</li>
              <li><strong>Reject Processing</strong> — Reject button shows loading spinner while confirming</li>
            </ul>
          </div>
        </div>
      </section>

      <section id="actions" className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 scroll-mt-24">Available Actions</h2>
        <p className="text-muted-foreground leading-relaxed mb-6">
          Each candidate card provides three primary actions:
        </p>

        <div className="space-y-6">
          <div className="border-l-4 border-emerald-500 pl-4">
            <h3 className="font-semibold mb-2">AI Analysis</h3>
            <p className="text-muted-foreground mb-2">
              Click "AI Analysis" button to open <DocLink to="/docs/dashboard/candidate-card/profile-dialog">AI Analysis Dialog</DocLink>, which shows detailed AI analysis results including:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
              <li>Complete match score breakdown</li>
              <li>Detailed analysis of each requirement</li>
              <li>Resume content and extracted information</li>
              <li>Contact details and application information</li>
            </ul>
          </div>

          <div className="border-l-4 border-emerald-500 pl-4">
            <h3 className="font-semibold mb-2">Shortlist</h3>
            <p className="text-muted-foreground mb-2">
              Click "Shortlist" button to move candidate to next hiring stage. This will:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
              <li>Generate a personalized email using your reachout template</li>
              <li>Send email to candidate</li>
              <li>Update the candidate's status to the next stage</li>
              <li>Create an interview link if the next stage is "Screening Interview"</li>
            </ul>
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 mt-4">
              <p className="text-sm text-muted-foreground">
                <strong>Note:</strong> Shortlisting requires <DocLink to="/docs/billing/overview">credits</DocLink>. If moving to "Screening Interview" stage, you'll need sufficient credits for the interview cost.
              </p>
            </div>
          </div>

          <div className="border-l-4 border-emerald-500 pl-4">
            <h3 className="font-semibold mb-2">Reject</h3>
            <p className="text-muted-foreground mb-2">
              Click "Reject" button to remove candidate from consideration. This will:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
              <li>Show a confirmation dialog asking you to confirm the rejection</li>
              <li>Mark the candidate as rejected in the system</li>
              <li>Remove the card from your dashboard view</li>
            </ul>
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mt-4">
              <p className="text-sm text-muted-foreground">
                <strong>Warning:</strong> Rejecting a candidate is permanent. The card will disappear from your dashboard and cannot be recovered.
              </p>
            </div>
          </div>

          <div className="border-l-4 border-emerald-500 pl-4">
            <h3 className="font-semibold mb-2">Star/Unstar</h3>
            <p className="text-muted-foreground mb-2">
              Click the star icon to mark the candidate for later review. This is useful for:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
              <li>Comparing multiple candidates side-by-side</li>
              <li>Marking candidates to discuss with your team</li>
              <li>Keeping track of promising candidates while reviewing others</li>
            </ul>
          </div>
        </div>
      </section>

      <section id="related" className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 scroll-mt-24">Related Pages</h2>
        <div className="space-y-3">
          <p>
            <DocLink to="/docs/dashboard/candidate-card/profile-dialog">AI Analysis Dialog</DocLink> — Viewing detailed candidate information and AI analysis
          </p>
          <p>
            <DocLink to="/docs/dashboard/candidate-card/shortlisting-rejecting">Shortlisting/Rejecting Candidates</DocLink> — Detailed guide on managing candidate workflow
          </p>
          <p>
            <DocLink to="/docs/core-ai-services/overview">Core AI Services</DocLink> — Understanding how AI analysis works
          </p>
        </div>
      </section>
    </DocumentationPage>
  );
}
