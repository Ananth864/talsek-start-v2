import { DocLink } from '#/components/documentation/DocLink';
import { DocumentationPage } from '#/components/documentation/DocumentationPage';
import { getPageSections } from '#/components/documentation/docStructure';

export default function GettingCandidates() {
  return (
    <DocumentationPage
      title="Getting Candidates"
      sections={getPageSections('/docs/getting-candidates')}
    >
      <section id="overview" className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 scroll-mt-24">Overview</h2>
        <p className="text-muted-foreground leading-relaxed mb-4">
          To receive candidate applications, you can use two methods: Form link and Email link. These links can be circulated in any job posting or job website page.
        </p>
        <p className="text-muted-foreground leading-relaxed">
          When candidates apply through these links, their profile will be evaluated and show up on your dashboard.
        </p>
      </section>

      <section id="copying-links" className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 scroll-mt-24">Where to Copy Your Links</h2>
        <div className="bg-muted/50 border rounded-lg p-6 my-6">
          <img src="/images/job-card.png" alt="Job card with copy buttons" className="w-full h-48 object-contain mb-4 rounded-md" />
          <p className="text-muted-foreground leading-relaxed">
            You can find and copy your Form link and Email link from the job cards in your dashboard. Each job card displays both link types with copy buttons next to each one.
          </p>
        </div>
      </section>

      <section id="form-link" className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 scroll-mt-24">Form Link Method</h2>
        <p className="text-muted-foreground leading-relaxed mb-6">
          The Form link provides candidates with a structured application form to submit their information.
        </p>

        <div className="space-y-4">
          <div className="border-l-4 border-[#4366B0] pl-4">
            <h3 className="font-semibold mb-2">How It Works</h3>
            <p className="text-muted-foreground mb-2">
              Candidates access your form link and fill out the application form with their details, resume, and other required information.
            </p>
            <p className="text-sm text-muted-foreground">
              The form uses your configured application template, ensuring consistent data collection across all candidates.
            </p>
          </div>

          <div className="border-l-4 border-[#4366B0] pl-4">
            <h3 className="font-semibold mb-2">Candidate Evaluation</h3>
            <p className="text-muted-foreground mb-2">
              Once submitted, the candidate's profile is automatically evaluated based on your job requirements.
            </p>
            <p className="text-sm text-muted-foreground">
              AI analyzes their resume and application data to determine match quality and suitability for the role.
            </p>
          </div>

          <div className="border-l-4 border-[#4366B0] pl-4">
            <h3 className="font-semibold mb-2">Dashboard Integration</h3>
            <p className="text-muted-foreground">
              Evaluated candidates appear in your dashboard where you can review, shortlist, and reach out to them.
            </p>
          </div>
        </div>

        <div className="bg-muted/50 border rounded-lg p-6 my-6">
          <h3 className="font-semibold mb-2">Best Practices</h3>
          <ul className="list-disc pl-6 space-y-2 text-sm text-muted-foreground">
            <li>Include the form link in your job postings on LinkedIn, Indeed, Glassdoor, and other platforms</li>
            <li>Add the link to your company's careers page or job listings</li>
            <li>Share the link directly with potential candidates through email or messaging</li>
            <li>Ensure your application form is configured with relevant questions for the role</li>
          </ul>
        </div>
      </section>

      <section id="email-link" className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 scroll-mt-24">Email Link Method</h2>
        <p className="text-muted-foreground leading-relaxed mb-6">
          The Email link allows candidates to apply by sending their resume directly to your job's email address.
        </p>

        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 mb-6">
          <p className="text-sm text-muted-foreground">
            <strong>Important:</strong> For email applications, candidates must submit a PDF resume. Applications without a PDF attachment will not be processed. Inform this requirement in your job posting.
          </p>
        </div>

        <div className="space-y-4">
          <div className="border-l-4 border-[#4366B0] pl-4">
            <h3 className="font-semibold mb-2">How It Works</h3>
            <p className="text-muted-foreground mb-2">
              Candidates send their resume and application details to your job's unique email address.
            </p>
            <p className="text-sm text-muted-foreground">
              The email body is also evaluated, so you can include instructions for candidates to provide additional context about their qualifications.
            </p>
          </div>

          <div className="border-l-4 border-[#4366B0] pl-4">
            <h3 className="font-semibold mb-2">PDF Requirement</h3>
            <p className="text-muted-foreground mb-2">
              Email applications must include a PDF resume attachment to be processed successfully.
            </p>
            <p className="text-sm text-muted-foreground">
              Make sure to clearly state this requirement in your job posting to avoid incomplete applications.
            </p>
          </div>

          <div className="border-l-4 border-[#4366B0] pl-4">
            <h3 className="font-semibold mb-2">Email Body Evaluation</h3>
            <p className="text-muted-foreground mb-2">
              The content of the email body is evaluated along with the resume attachment.
            </p>
            <p className="text-sm text-muted-foreground">
              Candidates can use the email body to provide additional context, cover letter content, or specific qualifications they want to highlight.
            </p>
          </div>

          <div className="border-l-4 border-[#4366B0] pl-4">
            <h3 className="font-semibold mb-2">Candidate Evaluation</h3>
            <p className="text-muted-foreground">
              Once received, the candidate's resume and email content are analyzed and their profile appears in your dashboard for review.
            </p>
          </div>
        </div>

        <div className="bg-muted/50 border rounded-lg p-6 my-6">
          <h3 className="font-semibold mb-2">Best Practices</h3>
          <ul className="list-disc pl-6 space-y-2 text-sm text-muted-foreground">
            <li>Clearly state the PDF requirement in your job posting</li>
            <li>Include the job's email address prominently in your listings</li>
            <li>Encourage candidates to use the email body to provide cover letter or additional context</li>
            <li>Monitor your dashboard for new candidates applying via email</li>
          </ul>
        </div>
      </section>

      <section id="managing-candidates" className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 scroll-mt-24">Managing Incoming Candidates</h2>
        <p className="text-muted-foreground leading-relaxed mb-6">
          Once candidates apply through either method, their profiles appear in your dashboard for review and management.
        </p>

        <div className="space-y-4">
          <div className="border-l-4 border-[#4366B0] pl-4">
            <h3 className="font-semibold mb-2">Dashboard Review</h3>
            <p className="text-muted-foreground">
              Access all candidates from your dashboard, view their AI evaluation scores, and review their profiles.
            </p>
          </div>

          <div className="border-l-4 border-[#4366B0] pl-4">
            <h3 className="font-semibold mb-2">Shortlisting</h3>
            <p className="text-muted-foreground">
              Shortlist promising candidates for further review and potential outreach.
            </p>
          </div>

          <div className="border-l-4 border-[#4366B0] pl-4">
            <h3 className="font-semibold mb-2">Reachout</h3>
            <p className="text-muted-foreground">
              Use personalized reachout templates to contact shortlisted candidates directly.
            </p>
          </div>
        </div>

        <div className="bg-muted/50 border rounded-lg p-6 my-6">
          <p>
            <DocLink to="/docs/dashboard/overview">Learn more about managing candidates in the dashboard</DocLink>
          </p>
        </div>
      </section>

      <section id="related" className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 scroll-mt-24">Related Pages</h2>
        <div className="space-y-3">
          <p>
            <DocLink to="/docs/create-a-job">Create a Job</DocLink> — Set up your job and generate candidate links
          </p>
          <p>
            <DocLink to="/docs/get-started/customize-application-form">Customize Application Form</DocLink> — Configure your application form template
          </p>
          <p>
            <DocLink to="/docs/get-started/set-reachout-template">Set Reachout Template</DocLink> — Create email templates for candidate outreach
          </p>
          <p>
            <DocLink to="/docs/dashboard/overview">Dashboard Overview</DocLink> — Learn about managing candidates in the dashboard
          </p>
        </div>
      </section>
    </DocumentationPage>
  );
}
