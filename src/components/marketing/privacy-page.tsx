import { Card } from '#/components/ui/card'

const LAST_UPDATED = 'January 15, 2025'

/** Public privacy policy (legal copy from source; shared marketing shell). */
export function PrivacyPage() {
  return (
    <main
      id="main-content"
      data-testid="privacy-page"
      className="bg-muted/30 pt-24 pb-16"
      role="main"
    >
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground md:text-4xl">
            Privacy Policy
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Last updated: {LAST_UPDATED}
          </p>
        </div>

        <Card className="p-6 md:p-8">
          <div className="prose prose-lg dark:prose-invert max-w-none space-y-8">
            <nav
              aria-label="Privacy Policy sections"
              className="mb-12 rounded-xl border border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10 p-6 not-prose"
            >
              <h2 className="mb-6 text-xl font-bold text-foreground">
                Table of Contents
              </h2>
              <ol className="list-inside list-decimal space-y-3 text-base">
                <TocLink href="#introduction">Introduction</TocLink>
                <TocLink href="#information-we-collect">
                  Information We Collect
                </TocLink>
                <TocLink href="#how-we-use-information">
                  How We Use Your Information
                </TocLink>
                <TocLink href="#data-sharing">
                  Data Sharing and Disclosure
                </TocLink>
                <TocLink href="#your-rights">Your Rights and Choices</TocLink>
                <TocLink href="#security">
                  Data Security and Retention
                </TocLink>
                <TocLink href="#international-transfers">
                  International Data Transfers
                </TocLink>
                <TocLink href="#cookies">
                  Cookies and Tracking Technologies
                </TocLink>
                <TocLink href="#updates">Policy Updates</TocLink>
                <TocLink href="#contact">Contact Information</TocLink>
              </ol>
            </nav>

            <section id="introduction" className="space-y-4">
              <SectionHeading>1. Introduction</SectionHeading>
              <p>
                Welcome to Talsek (&quot;we,&quot; &quot;our,&quot; or
                &quot;us&quot;). We are committed to protecting your privacy and
                handling your personal information transparently. This Privacy
                Policy explains how we collect, use, disclose, and safeguard
                your information when you use our AI-powered hiring platform.
              </p>
              <p>
                Our platform uses artificial intelligence to match job
                candidates with opportunities, analyze resumes, and streamline
                the hiring process. This policy covers all interactions with our
                service, including our website, dashboard, application forms,
                and API integrations.
              </p>
              <p>
                By using Talsek, you consent to the data practices described in
                this policy. If you do not agree with these practices, please do
                not use our service.
              </p>
            </section>

            <section id="information-we-collect" className="space-y-4">
              <SectionHeading>2. Information We Collect</SectionHeading>

              <h3 className="text-xl font-semibold text-foreground">
                2.1 Account Information
              </h3>
              <ul>
                <li>
                  <strong>Profile Data:</strong> Name, email address, job title,
                  company information
                </li>
                <li>
                  <strong>Authentication Data:</strong> Password (encrypted),
                  authentication tokens, session information
                </li>
                <li>
                  <strong>Company Details:</strong> Company name, size,
                  industry, contact information
                </li>
                <li>
                  <strong>User Roles:</strong> Administrator, member, or other
                  assigned roles within your organization
                </li>
              </ul>

              <h3 className="text-xl font-semibold text-foreground">
                2.2 Google OAuth Integration
              </h3>
              <p>When you sign up or sign in using Google OAuth, we may collect:</p>
              <ul>
                <li>
                  <strong>Google Profile Information:</strong> Name, email
                  address, profile picture
                </li>
                <li>
                  <strong>Gmail Access (when authorized):</strong> Email content
                  for job application processing
                </li>
                <li>
                  <strong>Google Account Tokens:</strong> Access and refresh
                  tokens for API communication
                </li>
              </ul>
              <p>
                <strong>Important:</strong> We only request Gmail access when
                you explicitly authorize it for processing job applications.
                Email data is processed solely for matching candidates to job
                requirements and is not used for any other purpose.
              </p>

              <h3 className="text-xl font-semibold text-foreground">
                2.3 Job Application Data
              </h3>
              <ul>
                <li>
                  <strong>Candidate Information:</strong> Names, email
                  addresses, contact details
                </li>
                <li>
                  <strong>Resume Content:</strong> Educational background, work
                  experience, skills, certifications
                </li>
                <li>
                  <strong>Application Responses:</strong> Answers to custom job
                  application questions
                </li>
                <li>
                  <strong>Assessment Results:</strong> Scores, rankings, and
                  evaluation data
                </li>
              </ul>

              <h3 className="text-xl font-semibold text-foreground">
                2.4 AI Analysis Data
              </h3>
              <ul>
                <li>
                  <strong>Match Scores:</strong> AI-generated compatibility
                  ratings between candidates and jobs
                </li>
                <li>
                  <strong>Skill Analysis:</strong> Extracted skills,
                  competencies, and qualifications
                </li>
                <li>
                  <strong>Requirements Matching:</strong> Analysis of how
                  candidates meet job requirements
                </li>
                <li>
                  <strong>Processing Metadata:</strong> Timestamps, confidence
                  scores, algorithm versions
                </li>
              </ul>

              <h3 className="text-xl font-semibold text-foreground">
                2.5 Usage and Analytics Data
              </h3>
              <ul>
                <li>
                  <strong>Platform Usage:</strong> Pages visited, features used,
                  time spent on platform
                </li>
                <li>
                  <strong>Technical Information:</strong> IP addresses, browser
                  types, device information
                </li>
                <li>
                  <strong>Performance Data:</strong> Error logs, response times,
                  system performance metrics
                </li>
                <li>
                  <strong>Audit Logs:</strong> Security events, login attempts,
                  data access records
                </li>
              </ul>
            </section>

            <section id="how-we-use-information" className="space-y-4">
              <SectionHeading>3. How We Use Your Information</SectionHeading>

              <h3 className="text-xl font-semibold text-foreground">
                3.1 Core Platform Services
              </h3>
              <ul>
                <li>
                  <strong>AI-Powered Matching:</strong> Using machine learning
                  to match candidates with job opportunities
                </li>
                <li>
                  <strong>Resume Analysis:</strong> Parsing and analyzing resume
                  content to extract relevant information
                </li>
                <li>
                  <strong>Application Processing:</strong> Managing job
                  applications, communications, and workflow
                </li>
                <li>
                  <strong>User Authentication:</strong> Securing accounts and
                  managing access permissions
                </li>
              </ul>

              <h3 className="text-xl font-semibold text-foreground">
                3.2 Communication and Notifications
              </h3>
              <ul>
                <li>Sending job application updates and notifications</li>
                <li>Providing customer support and responding to inquiries</li>
                <li>
                  Sharing important service announcements and updates
                </li>
                <li>
                  Facilitating communication between employers and candidates
                </li>
              </ul>

              <h3 className="text-xl font-semibold text-foreground">
                3.3 Platform Improvement
              </h3>
              <ul>
                <li>
                  Analyzing usage patterns to improve our AI algorithms
                </li>
                <li>
                  Enhancing user experience and platform performance
                </li>
                <li>Developing new features and functionality</li>
                <li>
                  Conducting research to advance hiring technology
                </li>
              </ul>

              <h3 className="text-xl font-semibold text-foreground">
                3.4 Legal and Security Purposes
              </h3>
              <ul>
                <li>
                  Complying with legal obligations and regulatory requirements
                </li>
                <li>
                  Protecting against fraud, abuse, and security threats
                </li>
                <li>
                  Enforcing our Terms of Service and platform policies
                </li>
                <li>
                  Maintaining audit trails for compliance purposes
                </li>
              </ul>
            </section>

            <section id="data-sharing" className="space-y-4">
              <SectionHeading>4. Data Sharing and Disclosure</SectionHeading>

              <h3 className="text-xl font-semibold text-foreground">
                4.1 Within Your Organization
              </h3>
              <p>
                Job application data is shared with authorized users within your
                company account, including administrators and team members with
                appropriate permissions.
              </p>

              <h3 className="text-xl font-semibold text-foreground">
                4.2 With Service Providers
              </h3>
              <ul>
                <li>
                  <strong>Supabase:</strong> Database hosting, authentication,
                  and backend services
                </li>
                <li>
                  <strong>Google:</strong> OAuth authentication and Gmail API
                  services (when authorized)
                </li>
                <li>
                  <strong>Sentry:</strong> Error tracking and performance
                  monitoring
                </li>
                <li>
                  <strong>Cloud Infrastructure:</strong> Hosting, storage, and
                  content delivery services
                </li>
              </ul>

              <h3 className="text-xl font-semibold text-foreground">
                4.3 Legal Disclosures
              </h3>
              <p>
                We may disclose your information when required by law or to:
              </p>
              <ul>
                <li>
                  Comply with legal process, court orders, or government
                  requests
                </li>
                <li>
                  Protect our rights, property, or safety, or that of our users
                </li>
                <li>
                  Investigate potential violations of our Terms of Service
                </li>
                <li>
                  Respond to claims of illegal activity or rights infringement
                </li>
              </ul>

              <h3 className="text-xl font-semibold text-foreground">
                4.4 Business Transfers
              </h3>
              <p>
                In the event of a merger, acquisition, or sale of assets, your
                information may be transferred to the acquiring entity, subject
                to the same privacy protections.
              </p>

              <h3 className="text-xl font-semibold text-foreground">
                4.5 What We Do NOT Do
              </h3>
              <ul>
                <li>We do not sell personal information to third parties</li>
                <li>
                  We do not share candidate data with unauthorized parties
                </li>
                <li>
                  We do not use your data for advertising or marketing to
                  external parties
                </li>
                <li>
                  We do not provide data to data brokers or marketing companies
                </li>
              </ul>
            </section>

            <section id="your-rights" className="space-y-4">
              <SectionHeading>5. Your Rights and Choices</SectionHeading>

              <h3 className="text-xl font-semibold text-foreground">
                5.1 Account Management
              </h3>
              <ul>
                <li>
                  <strong>Access:</strong> View and download your personal data
                  through your account settings
                </li>
                <li>
                  <strong>Update:</strong> Modify your profile information,
                  preferences, and company details
                </li>
                <li>
                  <strong>Delete:</strong> Request deletion of your account and
                  associated data
                </li>
                <li>
                  <strong>Export:</strong> Download your data in a portable
                  format
                </li>
              </ul>

              <h3 className="text-xl font-semibold text-foreground">
                5.2 Communication Preferences
              </h3>
              <ul>
                <li>Opt out of non-essential email communications</li>
                <li>
                  Manage notification settings for job applications and updates
                </li>
                <li>Control marketing and promotional communications</li>
              </ul>

              <h3 className="text-xl font-semibold text-foreground">
                5.3 GDPR Rights (EU Residents)
              </h3>
              <p>
                If you are located in the European Union, you have additional
                rights under GDPR:
              </p>
              <ul>
                <li>
                  <strong>Right to Access:</strong> Request information about
                  how your data is processed
                </li>
                <li>
                  <strong>Right to Rectification:</strong> Correct inaccurate or
                  incomplete data
                </li>
                <li>
                  <strong>Right to Erasure:</strong> Request deletion of your
                  personal data
                </li>
                <li>
                  <strong>Right to Restrict Processing:</strong> Limit how we
                  use your data
                </li>
                <li>
                  <strong>Right to Data Portability:</strong> Receive your data
                  in a structured format
                </li>
                <li>
                  <strong>Right to Object:</strong> Object to processing based
                  on legitimate interests
                </li>
                <li>
                  <strong>Rights Related to Automated Decision-making:</strong>{' '}
                  Understanding and challenging AI-based decisions
                </li>
              </ul>

              <h3 className="text-xl font-semibold text-foreground">
                5.4 CCPA Rights (California Residents)
              </h3>
              <p>
                California residents have rights under the California Consumer
                Privacy Act:
              </p>
              <ul>
                <li>
                  Right to know what personal information is collected and how
                  it&apos;s used
                </li>
                <li>Right to delete personal information</li>
                <li>
                  Right to non-discrimination for exercising privacy rights
                </li>
                <li>
                  Right to opt-out of the sale of personal information (we do
                  not sell data)
                </li>
              </ul>

              <h3 className="text-xl font-semibold text-foreground">
                5.5 Exercising Your Rights
              </h3>
              <p>
                To exercise any of these rights, please contact us through our
                support channels. We will respond to your request within 30 days
                and may require identity verification.
              </p>
            </section>

            <section id="security" className="space-y-4">
              <SectionHeading>6. Data Security and Retention</SectionHeading>

              <h3 className="text-xl font-semibold text-foreground">
                6.1 Security Measures
              </h3>
              <ul>
                <li>
                  <strong>Encryption:</strong> Data is encrypted in transit and
                  at rest using industry-standard protocols
                </li>
                <li>
                  <strong>Access Controls:</strong> Role-based access with
                  multi-factor authentication
                </li>
                <li>
                  <strong>Regular Audits:</strong> Security assessments and
                  vulnerability testing
                </li>
                <li>
                  <strong>Incident Response:</strong> Procedures for detecting
                  and responding to security breaches
                </li>
                <li>
                  <strong>Staff Training:</strong> Regular security awareness
                  training for all employees
                </li>
              </ul>

              <h3 className="text-xl font-semibold text-foreground">
                6.2 Data Retention
              </h3>
              <ul>
                <li>
                  <strong>Account Data:</strong> Retained while your account is
                  active and for 90 days after deletion
                </li>
                <li>
                  <strong>Job Applications:</strong> Retained for 7 years to
                  comply with employment law requirements
                </li>
                <li>
                  <strong>Analytics Data:</strong> Aggregated data retained for
                  3 years for product improvement
                </li>
                <li>
                  <strong>Audit Logs:</strong> Security logs retained for 1 year
                  for compliance purposes
                </li>
                <li>
                  <strong>Backup Data:</strong> Backup copies automatically
                  deleted within 30 days
                </li>
              </ul>

              <h3 className="text-xl font-semibold text-foreground">
                6.3 Data Breach Procedures
              </h3>
              <p>
                In the unlikely event of a data breach, we will notify affected
                users and relevant authorities within 72 hours, as required by
                law. We maintain comprehensive incident response procedures to
                minimize any potential impact.
              </p>
            </section>

            <section id="international-transfers" className="space-y-4">
              <SectionHeading>7. International Data Transfers</SectionHeading>
              <p>
                Your information may be processed and stored in servers located
                in various countries, including the United States. We ensure
                appropriate safeguards are in place for international data
                transfers:
              </p>
              <ul>
                <li>
                  Standard Contractual Clauses approved by the European
                  Commission
                </li>
                <li>
                  Adequacy decisions for countries with appropriate data
                  protection laws
                </li>
                <li>
                  Certification under privacy frameworks like Privacy Shield
                  successors
                </li>
                <li>
                  Regular assessment of data protection standards in destination
                  countries
                </li>
              </ul>
            </section>

            <section id="cookies" className="space-y-4">
              <SectionHeading>
                8. Cookies and Tracking Technologies
              </SectionHeading>

              <h3 className="text-xl font-semibold text-foreground">
                8.1 Types of Cookies We Use
              </h3>
              <ul>
                <li>
                  <strong>Essential Cookies:</strong> Required for platform
                  functionality and security
                </li>
                <li>
                  <strong>Authentication Cookies:</strong> Manage user sessions
                  and login status
                </li>
                <li>
                  <strong>Preference Cookies:</strong> Remember your settings
                  and preferences
                </li>
                <li>
                  <strong>Analytics Cookies:</strong> Help us understand
                  platform usage and performance
                </li>
              </ul>

              <h3 className="text-xl font-semibold text-foreground">
                8.2 Third-Party Services
              </h3>
              <ul>
                <li>
                  <strong>Google Analytics:</strong> Website traffic and usage
                  analysis (anonymized)
                </li>
                <li>
                  <strong>Sentry:</strong> Error tracking and performance
                  monitoring
                </li>
                <li>
                  <strong>Supabase:</strong> Authentication and session
                  management
                </li>
              </ul>

              <h3 className="text-xl font-semibold text-foreground">
                8.3 Managing Cookies
              </h3>
              <p>
                You can control cookies through your browser settings. However,
                disabling essential cookies may affect platform functionality.
                You can opt out of analytics cookies through your account
                preferences.
              </p>
            </section>

            <section id="updates" className="space-y-4">
              <SectionHeading>9. Policy Updates</SectionHeading>
              <p>
                We may update this Privacy Policy periodically to reflect
                changes in our practices or applicable laws. We will notify you
                of material changes by:
              </p>
              <ul>
                <li>Email notification to your registered email address</li>
                <li>Prominent notice on our platform</li>
                <li>In-app notifications when you next log in</li>
              </ul>
              <p>
                Your continued use of the platform after any changes constitutes
                acceptance of the updated policy. We encourage you to review
                this policy regularly.
              </p>
            </section>

            <section id="contact" className="space-y-4">
              <SectionHeading>10. Contact Information</SectionHeading>
              <div className="not-prose rounded-xl border border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10 p-8">
                <p className="mb-6 text-lg font-medium text-foreground">
                  If you have any questions about this Privacy Policy or our
                  data practices, please reach out to us through our{' '}
                  <a href="/contact" className="text-primary hover:underline">
                    support channels
                  </a>
                  .
                </p>
                <p className="text-base text-muted-foreground">
                  We are committed to addressing your privacy concerns and will
                  respond to your inquiries promptly and transparently.
                </p>
              </div>
              <p>
                We are committed to resolving any privacy concerns promptly and
                transparently. Please allow up to 30 days for a complete
                response to your inquiry.
              </p>
            </section>

            <div className="mt-12 border-t border-border pt-8">
              <p className="text-sm text-muted-foreground">
                This Privacy Policy is effective as of {LAST_UPDATED} and was
                last updated on {LAST_UPDATED}.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </main>
  )
}

function SectionHeading({ children }: { children: string }) {
  return (
    <h2 className="mb-4 border-b-2 border-primary/20 pb-3 text-3xl font-bold text-foreground">
      {children}
    </h2>
  )
}

function TocLink({
  href,
  children,
}: {
  href: string
  children: string
}) {
  return (
    <li>
      <a href={href} className="text-primary hover:text-primary/80">
        {children}
      </a>
    </li>
  )
}
