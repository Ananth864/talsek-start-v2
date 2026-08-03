import { DocLink } from '#/components/documentation/DocLink';
import { DocumentationPage } from '#/components/documentation/DocumentationPage';
import { getPageSections } from '#/components/documentation/docStructure';

export default function GetStarted() {
  return (
    <DocumentationPage
      title="Get Started"
      sections={getPageSections('/docs/get-started')}
    >
      <section id="what-is-talsek" className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 scroll-mt-24">What is Talsek?</h2>
        <p className="text-muted-foreground leading-relaxed">
          Talsek is an AI-powered hiring platform that helps you find the best candidates for your open positions. We use advanced AI to screen applicants and match them to your job requirements, saving you time and improving the quality of your hires.
        </p>
      </section>

      <section id="account-setup" className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 scroll-mt-24">Account Setup</h2>
        <p className="text-muted-foreground leading-relaxed mb-4">
          To get started, you'll need to create an account. Choose the option that works best for you:
        </p>
        <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
          <li>
            <DocLink to="/signup">Sign up</DocLink> for a new account
          </li>
          <li>
            <DocLink to="/signin">Sign in</DocLink> if you already have an account
          </li>
        </ul>
      </section>

      <section id="first-steps" className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 scroll-mt-24">First Steps</h2>
        <p className="text-muted-foreground leading-relaxed mb-4">
          After signing in, you'll go through a quick setup process:
        </p>
        <ol className="list-decimal pl-6 space-y-2 text-muted-foreground">
          <li>Enter your company information</li>
          <li>Add credits to your account</li>
          <li>Customize your application form</li>
          <li>Set up your reachout templates</li>
          <li>Create your first job</li>
          <li><DocLink to="/users">Add team members</DocLink> (optional)</li>
        </ol>
      </section>

      <section id="company-input" className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 scroll-mt-24">Company Input Modal</h2>
        <p className="text-muted-foreground leading-relaxed mb-4">
          When you sign in for the first time, you'll see a modal asking for your company information. This one-time setup ensures that Talsek is configured for your organization.
        </p>
        <div className="bg-muted/50 border rounded-lg p-4 my-6">
        </div>
        <p className="text-muted-foreground leading-relaxed">
          Fill in your company name and other required details to proceed to the dashboard. This information is used to personalize your experience and ensure proper billing setup.
        </p>
      </section>
    </DocumentationPage>
  );
}
