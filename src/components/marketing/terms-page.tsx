import { Card } from '#/components/ui/card'

const LAST_UPDATED = 'January 15, 2025'

/** Public terms of service (legal copy from source; shared marketing shell). */
export function TermsPage() {
  return (
    <main
      id="main-content"
      data-testid="terms-page"
      className="bg-muted/30 pt-24 pb-16"
      role="main"
    >
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground md:text-4xl">
            Terms of Service
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Last updated: {LAST_UPDATED}
          </p>
        </div>

        <Card className="p-6 md:p-8">
          <div className="prose prose-lg dark:prose-invert max-w-none space-y-8">
            <nav
              aria-label="Terms of Service sections"
              className="mb-12 rounded-xl border border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10 p-6 not-prose"
            >
              <h2 className="mb-6 text-xl font-bold text-foreground">
                Table of Contents
              </h2>
              <ol className="list-inside list-decimal space-y-3 text-base">
                <TocLink href="#acceptance">Acceptance of Terms</TocLink>
                <TocLink href="#service-description">
                  Service Description
                </TocLink>
                <TocLink href="#user-accounts">
                  User Accounts and Responsibilities
                </TocLink>
                <TocLink href="#acceptable-use">Acceptable Use Policy</TocLink>
                <TocLink href="#intellectual-property">
                  Intellectual Property Rights
                </TocLink>
                <TocLink href="#payment-terms">
                  Payment and Subscription Terms
                </TocLink>
                <TocLink href="#ai-processing">AI and Data Processing</TocLink>
                <TocLink href="#privacy-security">Privacy and Security</TocLink>
                <TocLink href="#limitation-liability">
                  Limitation of Liability
                </TocLink>
                <TocLink href="#termination">Termination</TocLink>
                <TocLink href="#dispute-resolution">
                  Dispute Resolution
                </TocLink>
                <TocLink href="#general-provisions">
                  General Provisions
                </TocLink>
              </ol>
            </nav>

            <section id="acceptance" className="space-y-4">
              <SectionHeading>1. Acceptance of Terms</SectionHeading>
              <p>
                Welcome to Talsek (&quot;we,&quot; &quot;our,&quot;
                &quot;us,&quot; or &quot;Talsek&quot;). These Terms of Service
                (&quot;Terms&quot;) constitute a legally binding agreement
                between you and Talsek regarding your use of our AI-powered
                hiring platform and related services.
              </p>
              <p>
                By creating an account, accessing our platform, or using any of
                our services, you acknowledge that you have read, understood,
                and agree to be bound by these Terms. If you do not agree to
                these Terms, you may not use our services.
              </p>
              <p>
                These Terms apply to all users of our platform, including but
                not limited to employers, recruiters, hiring managers, job
                seekers, and administrative users.
              </p>
            </section>

            <section id="service-description" className="space-y-4">
              <SectionHeading>2. Service Description</SectionHeading>

              <h3 className="text-xl font-semibold text-foreground">
                2.1 Platform Overview
              </h3>
              <p>
                Talsek provides an AI-powered hiring platform that enables
                organizations to:
              </p>
              <ul>
                <li>
                  Create and manage job postings with AI-optimized descriptions
                </li>
                <li>
                  Receive and process job applications through customized forms
                </li>
                <li>
                  Automatically analyze resumes and candidate qualifications
                </li>
                <li>
                  Match candidates to job requirements using machine learning
                  algorithms
                </li>
                <li>
                  Manage hiring workflows and candidate communication
                </li>
                <li>Track hiring metrics and generate insights</li>
              </ul>

              <h3 className="text-xl font-semibold text-foreground">
                2.2 AI-Powered Features
              </h3>
              <p>Our platform utilizes artificial intelligence to:</p>
              <ul>
                <li>
                  Parse and analyze resume content to extract relevant
                  qualifications
                </li>
                <li>
                  Score candidate-job compatibility based on requirements
                  matching
                </li>
                <li>
                  Identify skills, experience levels, and competencies
                </li>
                <li>Provide recommendations for hiring decisions</li>
                <li>
                  Generate insights on hiring patterns and candidate quality
                </li>
              </ul>

              <h3 className="text-xl font-semibold text-foreground">
                2.3 Service Availability
              </h3>
              <p>
                We strive to maintain high service availability but do not
                guarantee uninterrupted access. Our services may be temporarily
                unavailable due to maintenance, updates, or technical issues. We
                will provide reasonable notice for planned maintenance when
                possible.
              </p>
            </section>

            <section id="user-accounts" className="space-y-4">
              <SectionHeading>
                3. User Accounts and Responsibilities
              </SectionHeading>

              <h3 className="text-xl font-semibold text-foreground">
                3.1 Account Registration
              </h3>
              <p>To use our platform, you must:</p>
              <ul>
                <li>
                  Provide accurate, current, and complete registration
                  information
                </li>
                <li>
                  Be at least 18 years old or have legal capacity to enter
                  contracts
                </li>
                <li>
                  Represent a legitimate business entity if creating a company
                  account
                </li>
                <li>
                  Have authorization to bind your organization to these Terms
                </li>
              </ul>

              <h3 className="text-xl font-semibold text-foreground">
                3.2 Account Security
              </h3>
              <p>You are responsible for:</p>
              <ul>
                <li>
                  Maintaining the confidentiality of your account credentials
                </li>
                <li>All activities that occur under your account</li>
                <li>
                  Immediately notifying us of any unauthorized access or
                  security breaches
                </li>
                <li>
                  Using strong passwords and enabling multi-factor
                  authentication when available
                </li>
              </ul>

              <h3 className="text-xl font-semibold text-foreground">
                3.3 Company Accounts and User Roles
              </h3>
              <ul>
                <li>
                  <strong>Administrator:</strong> Full access to all company
                  account features, user management, and billing
                </li>
                <li>
                  <strong>Member:</strong> Access to hiring features within
                  assigned permissions
                </li>
                <li>
                  <strong>Limited Access:</strong> Restricted access based on
                  administrator-defined roles
                </li>
              </ul>
              <p>
                Administrators are responsible for managing user access,
                ensuring compliance with these Terms, and maintaining data
                security within their organization.
              </p>

              <h3 className="text-xl font-semibold text-foreground">
                3.4 Account Information Updates
              </h3>
              <p>
                You agree to promptly update your account information to keep it
                accurate and current. This includes contact information, company
                details, and payment information.
              </p>
            </section>

            <section id="acceptable-use" className="space-y-4">
              <SectionHeading>4. Acceptable Use Policy</SectionHeading>

              <h3 className="text-xl font-semibold text-foreground">
                4.1 Permitted Uses
              </h3>
              <p>You may use our platform to:</p>
              <ul>
                <li>Post legitimate job opportunities and requirements</li>
                <li>
                  Review and evaluate job applications in good faith
                </li>
                <li>
                  Communicate with candidates regarding employment opportunities
                </li>
                <li>
                  Make hiring decisions based on job-related qualifications
                </li>
                <li>Manage your organization&apos;s hiring processes</li>
              </ul>

              <h3 className="text-xl font-semibold text-foreground">
                4.2 Prohibited Uses
              </h3>
              <p>You may not use our platform to:</p>
              <ul>
                <li>
                  <strong>Discriminatory Practices:</strong> Engage in hiring
                  practices that violate anti-discrimination laws
                </li>
                <li>
                  <strong>False Information:</strong> Post fake job listings,
                  provide misleading company information, or misrepresent
                  opportunities
                </li>
                <li>
                  <strong>Privacy Violations:</strong> Collect personal
                  information beyond what is necessary for hiring decisions
                </li>
                <li>
                  <strong>System Abuse:</strong> Attempt to circumvent platform
                  security, overload systems, or access unauthorized data
                </li>
                <li>
                  <strong>Intellectual Property Infringement:</strong> Upload
                  content that violates third-party intellectual property rights
                </li>
                <li>
                  <strong>Spam or Harassment:</strong> Send unsolicited
                  communications or engage in harassing behavior
                </li>
                <li>
                  <strong>Illegal Activities:</strong> Use the platform for any
                  unlawful purposes or activities
                </li>
              </ul>

              <h3 className="text-xl font-semibold text-foreground">
                4.3 Employment Law Compliance
              </h3>
              <p>
                You agree to comply with all applicable employment laws,
                including but not limited to:
              </p>
              <ul>
                <li>Equal Employment Opportunity (EEO) requirements</li>
                <li>
                  Americans with Disabilities Act (ADA) compliance
                </li>
                <li>Fair Labor Standards Act (FLSA) provisions</li>
                <li>State and local employment regulations</li>
                <li>
                  International employment laws in your jurisdiction
                </li>
              </ul>

              <h3 className="text-xl font-semibold text-foreground">
                4.4 Data Quality and Accuracy
              </h3>
              <p>
                You are responsible for ensuring that all information you
                provide, including job descriptions, candidate evaluations, and
                company information, is accurate, complete, and not misleading.
              </p>
            </section>

            <section id="intellectual-property" className="space-y-4">
              <SectionHeading>5. Intellectual Property Rights</SectionHeading>

              <h3 className="text-xl font-semibold text-foreground">
                5.1 Platform Ownership
              </h3>
              <p>
                Talsek retains all rights, title, and interest in our platform,
                including:
              </p>
              <ul>
                <li>Software, algorithms, and AI models</li>
                <li>User interface design and functionality</li>
                <li>Trademarks, logos, and branding</li>
                <li>Documentation and support materials</li>
                <li>Aggregated and anonymized usage data</li>
              </ul>

              <h3 className="text-xl font-semibold text-foreground">
                5.2 User Content License
              </h3>
              <p>
                By uploading content to our platform, you grant Talsek a
                limited, non-exclusive license to:
              </p>
              <ul>
                <li>
                  Store, process, and analyze your content using our AI systems
                </li>
                <li>
                  Display content within the platform for authorized users
                </li>
                <li>Create backups and ensure data redundancy</li>
                <li>
                  Provide customer support and technical assistance
                </li>
              </ul>
              <p>
                This license does not grant us ownership of your content and
                terminates when you delete content or close your account.
              </p>

              <h3 className="text-xl font-semibold text-foreground">
                5.3 Candidate Data Rights
              </h3>
              <p>
                Candidate resumes and personal information remain the property
                of the respective candidates. You agree to:
              </p>
              <ul>
                <li>
                  Use candidate data only for legitimate hiring purposes
                </li>
                <li>
                  Respect candidate privacy and data protection rights
                </li>
                <li>
                  Comply with data retention and deletion requirements
                </li>
                <li>
                  Not share candidate information with unauthorized parties
                </li>
              </ul>

              <h3 className="text-xl font-semibold text-foreground">
                5.4 Feedback and Suggestions
              </h3>
              <p>
                Any feedback, suggestions, or ideas you provide regarding our
                platform become our property and may be used without
                compensation or acknowledgment.
              </p>
            </section>

            <section id="payment-terms" className="space-y-4">
              <SectionHeading>
                6. Payment and Subscription Terms
              </SectionHeading>

              <h3 className="text-xl font-semibold text-foreground">
                6.1 Subscription Plans
              </h3>
              <p>
                Our platform offers various subscription plans with different
                features and usage limits. Plan details, pricing, and features
                are described on our website and may be updated periodically.
              </p>

              <h3 className="text-xl font-semibold text-foreground">
                6.2 Billing and Payment
              </h3>
              <ul>
                <li>
                  <strong>Automatic Renewal:</strong> Subscriptions
                  automatically renew unless cancelled before the renewal date
                </li>
                <li>
                  <strong>Payment Methods:</strong> We accept major credit cards
                  and other payment methods as specified
                </li>
                <li>
                  <strong>Billing Cycles:</strong> Monthly or annual billing as
                  selected during subscription
                </li>
                <li>
                  <strong>Currency:</strong> All prices are in USD unless
                  otherwise specified
                </li>
              </ul>

              <h3 className="text-xl font-semibold text-foreground">
                6.3 Price Changes
              </h3>
              <p>
                We reserve the right to modify subscription prices with 30
                days&apos; notice. Price changes apply to renewal periods and do
                not affect current billing cycles.
              </p>

              <h3 className="text-xl font-semibold text-foreground">
                6.4 Refunds and Cancellations
              </h3>
              <ul>
                <li>
                  <strong>Cancellation:</strong> You may cancel your
                  subscription at any time through account settings
                </li>
                <li>
                  <strong>Refunds:</strong> Generally, subscription fees are
                  non-refundable except as required by law
                </li>
                <li>
                  <strong>Pro-rata Credits:</strong> Downgrades may result in
                  credits applied to future billing cycles
                </li>
                <li>
                  <strong>Free Trials:</strong> Cancel before trial expiration
                  to avoid charges
                </li>
              </ul>

              <h3 className="text-xl font-semibold text-foreground">
                6.5 Delinquent Accounts
              </h3>
              <p>
                Accounts with overdue payments may be suspended or terminated.
                You remain responsible for all fees incurred until cancellation
                is complete.
              </p>
            </section>

            <section id="ai-processing" className="space-y-4">
              <SectionHeading>7. AI and Data Processing</SectionHeading>

              <h3 className="text-xl font-semibold text-foreground">
                7.1 Consent to AI Processing
              </h3>
              <p>
                By using our platform, you consent to the automated processing
                of candidate and job data using artificial intelligence,
                including:
              </p>
              <ul>
                <li>Resume parsing and content extraction</li>
                <li>Skills and qualification analysis</li>
                <li>Candidate-job matching and scoring</li>
                <li>Predictive analytics and recommendations</li>
              </ul>

              <h3 className="text-xl font-semibold text-foreground">
                7.2 AI Accuracy and Limitations
              </h3>
              <p>
                While our AI systems are designed to be accurate and helpful,
                you acknowledge that:
              </p>
              <ul>
                <li>
                  AI analysis is not infallible and may contain errors or biases
                </li>
                <li>
                  Human review and judgment remain essential for hiring
                  decisions
                </li>
                <li>
                  Match scores and recommendations are tools to assist, not
                  replace, human decision-making
                </li>
                <li>
                  You are responsible for ensuring compliance with
                  anti-discrimination laws
                </li>
              </ul>

              <h3 className="text-xl font-semibold text-foreground">
                7.3 Algorithm Transparency
              </h3>
              <p>
                We are committed to algorithmic fairness and regularly audit our
                AI systems for bias. However, the specific details of our
                algorithms are proprietary and not disclosed to maintain
                competitive advantage and security.
              </p>

              <h3 className="text-xl font-semibold text-foreground">
                7.4 Continuous Improvement
              </h3>
              <p>
                We use aggregated, anonymized data to improve our AI algorithms.
                This helps enhance matching accuracy and platform performance
                for all users while protecting individual privacy.
              </p>
            </section>

            <section id="privacy-security" className="space-y-4">
              <SectionHeading>8. Privacy and Security</SectionHeading>

              <h3 className="text-xl font-semibold text-foreground">
                8.1 Privacy Policy
              </h3>
              <p>
                Our{' '}
                <a href="/privacy" className="text-primary hover:underline">
                  Privacy Policy
                </a>
                , incorporated by reference, explains how we collect, use, and
                protect your information. By using our services, you also agree
                to our Privacy Policy.
              </p>

              <h3 className="text-xl font-semibold text-foreground">
                8.2 Data Security
              </h3>
              <p>
                We implement industry-standard security measures to protect your
                data, including:
              </p>
              <ul>
                <li>Encryption of data in transit and at rest</li>
                <li>Regular security assessments and updates</li>
                <li>Access controls and authentication requirements</li>
                <li>Incident response procedures</li>
              </ul>

              <h3 className="text-xl font-semibold text-foreground">
                8.3 User Responsibilities
              </h3>
              <p>You are responsible for:</p>
              <ul>
                <li>Protecting your account credentials</li>
                <li>Using secure networks and devices</li>
                <li>Reporting suspected security issues promptly</li>
                <li>
                  Complying with your organization&apos;s security policies
                </li>
              </ul>
            </section>

            <section id="limitation-liability" className="space-y-4">
              <SectionHeading>9. Limitation of Liability</SectionHeading>

              <h3 className="text-xl font-semibold text-foreground">
                9.1 Service Availability
              </h3>
              <p>
                Our platform is provided &quot;as is&quot; and &quot;as
                available.&quot; We do not warrant that the service will be
                uninterrupted, error-free, or completely secure. We disclaim all
                warranties, express or implied, including but not limited to
                warranties of merchantability and fitness for a particular
                purpose.
              </p>

              <h3 className="text-xl font-semibold text-foreground">
                9.2 AI and Algorithmic Disclaimers
              </h3>
              <p>We make no representations or warranties regarding:</p>
              <ul>
                <li>
                  The accuracy or completeness of AI-generated analysis
                </li>
                <li>
                  The suitability of AI recommendations for your specific needs
                </li>
                <li>
                  The absence of bias or discrimination in algorithmic decisions
                </li>
                <li>
                  The prediction of candidate success or performance
                </li>
              </ul>

              <h3 className="text-xl font-semibold text-foreground">
                9.3 Limitation of Damages
              </h3>
              <p>
                To the maximum extent permitted by law, Talsek shall not be
                liable for:
              </p>
              <ul>
                <li>
                  Indirect, incidental, special, or consequential damages
                </li>
                <li>
                  Loss of profits, revenue, data, or business opportunities
                </li>
                <li>
                  Hiring decisions made based on platform recommendations
                </li>
                <li>Third-party actions or content</li>
              </ul>
              <p>
                Our total liability for any claim shall not exceed the amount
                you paid for the service in the 12 months preceding the claim.
              </p>

              <h3 className="text-xl font-semibold text-foreground">
                9.4 User Responsibility for Hiring Decisions
              </h3>
              <p>
                You acknowledge that all hiring decisions remain your sole
                responsibility. Our platform provides tools and insights to
                assist your decision-making process, but you are ultimately
                responsible for:
              </p>
              <ul>
                <li>
                  Compliance with employment laws and regulations
                </li>
                <li>Fair and non-discriminatory hiring practices</li>
                <li>
                  Verification of candidate information and qualifications
                </li>
                <li>Employment-related legal obligations</li>
              </ul>
            </section>

            <section id="termination" className="space-y-4">
              <SectionHeading>10. Termination</SectionHeading>

              <h3 className="text-xl font-semibold text-foreground">
                10.1 Termination by You
              </h3>
              <p>You may terminate your account at any time by:</p>
              <ul>
                <li>
                  Cancelling your subscription through account settings
                </li>
                <li>
                  Contacting our support team to close your account
                </li>
                <li>
                  Following the account deletion process in your settings
                </li>
              </ul>

              <h3 className="text-xl font-semibold text-foreground">
                10.2 Termination by Us
              </h3>
              <p>We may suspend or terminate your account if:</p>
              <ul>
                <li>You violate these Terms of Service</li>
                <li>Your account becomes delinquent on payments</li>
                <li>You engage in illegal or harmful activities</li>
                <li>
                  We discontinue the service (with reasonable notice)
                </li>
              </ul>

              <h3 className="text-xl font-semibold text-foreground">
                10.3 Effect of Termination
              </h3>
              <p>Upon termination:</p>
              <ul>
                <li>
                  Your access to the platform will be immediately suspended
                </li>
                <li>
                  You may download your data for a limited period (30 days)
                </li>
                <li>
                  We will delete your account data according to our retention
                  policies
                </li>
                <li>You remain responsible for any outstanding fees</li>
                <li>
                  Provisions regarding liability, indemnification, and dispute
                  resolution survive termination
                </li>
              </ul>

              <h3 className="text-xl font-semibold text-foreground">
                10.4 Data Export
              </h3>
              <p>
                Before termination, you may export your data in standard
                formats. After account deletion, data recovery may not be
                possible.
              </p>
            </section>

            <section id="dispute-resolution" className="space-y-4">
              <SectionHeading>11. Dispute Resolution</SectionHeading>

              <h3 className="text-xl font-semibold text-foreground">
                11.1 Governing Law
              </h3>
              <p>
                These Terms are governed by the laws of [State/Country], without
                regard to conflict of law principles.
              </p>

              <h3 className="text-xl font-semibold text-foreground">
                11.2 Dispute Resolution Process
              </h3>
              <p>
                Before pursuing legal action, we encourage you to contact us
                directly to resolve any disputes. We are committed to working
                with users to address concerns promptly and fairly.
              </p>

              <h3 className="text-xl font-semibold text-foreground">
                11.3 Arbitration
              </h3>
              <p>
                Any disputes not resolved through direct communication shall be
                settled through binding arbitration rather than in court, except
                for:
              </p>
              <ul>
                <li>Small claims court actions</li>
                <li>Intellectual property disputes</li>
                <li>Requests for injunctive relief</li>
              </ul>

              <h3 className="text-xl font-semibold text-foreground">
                11.4 Class Action Waiver
              </h3>
              <p>
                You agree to resolve disputes individually and waive any right
                to participate in class action lawsuits or class-wide
                arbitration.
              </p>
            </section>

            <section id="general-provisions" className="space-y-4">
              <SectionHeading>12. General Provisions</SectionHeading>

              <h3 className="text-xl font-semibold text-foreground">
                12.1 Entire Agreement
              </h3>
              <p>
                These Terms, together with our Privacy Policy, constitute the
                entire agreement between you and Talsek regarding your use of
                our services.
              </p>

              <h3 className="text-xl font-semibold text-foreground">
                12.2 Modifications
              </h3>
              <p>
                We may modify these Terms at any time. Material changes will be
                communicated through email or platform notifications. Your
                continued use after changes constitutes acceptance of the
                modified terms.
              </p>

              <h3 className="text-xl font-semibold text-foreground">
                12.3 Severability
              </h3>
              <p>
                If any provision of these Terms is found to be unenforceable,
                the remainder shall continue in full force and effect.
              </p>

              <h3 className="text-xl font-semibold text-foreground">
                12.4 Assignment
              </h3>
              <p>
                We may assign these Terms in connection with a merger,
                acquisition, or sale of assets. You may not assign your rights
                or obligations without our written consent.
              </p>

              <h3 className="text-xl font-semibold text-foreground">
                12.5 Force Majeure
              </h3>
              <p>
                We are not liable for delays or failures due to circumstances
                beyond our reasonable control, including natural disasters,
                government actions, or technical failures of third-party
                services.
              </p>

              <h3 className="text-xl font-semibold text-foreground">
                12.6 Contact Information
              </h3>
              <div className="not-prose rounded-xl border border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10 p-8">
                <p className="mb-6 text-lg font-medium text-foreground">
                  For questions about these Terms of Service, please reach out
                  to us through our{' '}
                  <a href="/contact" className="text-primary hover:underline">
                    support channels
                  </a>
                  .
                </p>
                <p className="text-base text-muted-foreground">
                  We are committed to addressing your concerns and will respond
                  to your inquiries promptly.
                </p>
              </div>
            </section>

            <div className="mt-12 border-t border-border pt-8">
              <p className="text-sm text-muted-foreground">
                These Terms of Service are effective as of {LAST_UPDATED} and
                were last updated on {LAST_UPDATED}.
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                By using Talsek, you acknowledge that you have read, understood,
                and agree to be bound by these Terms of Service.
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
