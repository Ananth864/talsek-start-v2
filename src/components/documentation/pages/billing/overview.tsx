import { DocLink } from '#/components/documentation/DocLink';
import { DocumentationPage } from '#/components/documentation/DocumentationPage';
import { getPageSections } from '#/components/documentation/docStructure';

export default function BillingOverview() {
  return (
    <DocumentationPage
      title="Billing Overview"
      sections={getPageSections('/docs/billing/overview')}
    >
      <section id="overview" className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 scroll-mt-24">Overview</h2>
        <p className="text-muted-foreground leading-relaxed mb-4">
          Billing in Talsek is designed to be flexible and transparent. You pay only for what you use, with options to scale up or down based on your hiring needs. Whether you're hiring occasionally or managing ongoing recruitment, there's a billing model that fits your workflow.
        </p>
        <p className="text-muted-foreground leading-relaxed">
          All billing information is accessible from the <DocLink to="/billing">Billing page</DocLink> in your dashboard, where you can view your current balance, purchase credits, manage subscriptions, and track usage.
        </p>
      </section>

      <section id="credits" className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 scroll-mt-24">Credits</h2>
        <p className="text-muted-foreground leading-relaxed mb-4">
          Credits are the currency used throughout our dashboard to pay for services. Each action you take—such as screening a candidate or conducting an interview—consumes a specific number of credits based on the service type.
        </p>
        
        <div className="bg-muted/50 border rounded-lg p-6 my-6">
          <h3 className="font-semibold mb-4">Credit Conversion</h3>
          <p className="text-muted-foreground mb-2">
            <strong>1 USD = 100 credits</strong>
          </p>
          <p className="text-muted-foreground mb-4">
            This means 1 cent equals 1 credit, making it easy to understand the cost of each action.
          </p>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="font-medium">$1.00</span>
              <span className="text-muted-foreground">= 100 credits</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">$10.00</span>
              <span className="text-muted-foreground">= 1,000 credits</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">$50.00</span>
              <span className="text-muted-foreground">= 5,000 credits</span>
            </div>
          </div>
        </div>

        <p className="text-muted-foreground leading-relaxed">
          Your credit balance is displayed in real-time on the <DocLink to="/billing">Billing tab</DocLink>. When your balance runs low, you'll receive a notification and see a banner in your dashboard prompting you to add more credits.
        </p>

        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 my-6">
          <p className="text-sm text-muted-foreground">
            <strong>Note:</strong> Purchased credits expire after one year from the date of purchase.
          </p>
        </div>
      </section>

      <section id="payment" className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 scroll-mt-24">Payment Methods</h2>
        <p className="text-muted-foreground leading-relaxed mb-4">
          Talsek offers three billing models to suit different needs:
        </p>

        <div className="space-y-6">
          <div className="border-l-4 border-[#4366B0] pl-4">
            <h3 className="font-semibold mb-2">Pay as You Go</h3>
            <p className="text-muted-foreground mb-2">
              No monthly commitment. Purchase credits as needed and use them whenever you want. Your first payment establishes a payment mandate, allowing instant top-ups in the future without re-entering payment details.
            </p>
            <p className="text-sm">
              <DocLink to="/docs/billing/how-to-buy-credits/pay-as-you-go">Learn more about Pay as You Go</DocLink> →
            </p>
          </div>

          <div className="border-l-4 border-purple-500 pl-4">
            <h3 className="font-semibold mb-2">Tier 1 Subscription</h3>
            <p className="text-muted-foreground mb-2">
              $50 per month with 5,000 credits included. Enjoy discounted rates on services and predictable monthly costs. Additional credits can be purchased at the standard rate if you exceed your allocation.
            </p>
            <p className="text-sm">
              <DocLink to="/docs/billing/how-to-buy-credits/subscriptions">Learn more about Subscriptions</DocLink> →
            </p>
          </div>

          <div className="border-l-4 border-amber-500 pl-4">
            <h3 className="font-semibold mb-2">Enterprise</h3>
            <p className="text-muted-foreground mb-2">
              Custom pricing tailored to your organization's needs. Best for high-volume hiring and HR consultancies requiring dedicated support and the most competitive rates.
            </p>
            <p className="text-sm">
              <DocLink to="/docs/billing/how-to-buy-credits/subscriptions">Learn more about Enterprise plans</DocLink> →
            </p>
          </div>
        </div>

        <div className="bg-muted/50 border rounded-lg p-6 my-8">
          <h3 className="font-semibold mb-4">Payment Mandate (Pay as You Go)</h3>
          <p className="text-muted-foreground mb-4">
            When you make your first payment, Talsek establishes a payment mandate <strong>with your card</strong>. This allows future charges to be processed instantly without requiring you to re-enter your payment information.
          </p>
          <p className="text-muted-foreground">
            The mandate is required for features like <DocLink to="/docs/billing/how-to-buy-credits/auto-refill">Auto-Refill</DocLink> and enables automatic top-ups whenever your total credits falls beneath your configured threshold.
          </p>
        </div>
      </section>

      <section id="monitoring" className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 scroll-mt-24">Monitoring Usage</h2>
        <p className="text-muted-foreground leading-relaxed mb-4">
          Keep track of your credit consumption through the Usage tab on the Billing page. You'll see:
        </p>

        <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-6">
          <li><strong>Real-time balance</strong> — Your current available credits displayed prominently</li>
          <li><strong>Daily usage charts</strong> — Visual representation of credit consumption over the last 14 days</li>
          <li><strong>Category breakdown</strong> — Credits used for resume screenings vs. interviews</li>
          <li><strong>Per-job breakdown</strong> — Detailed credit consumption for each job posting</li>
          <li><strong>Invoice history</strong> — Complete record of all payments with downloadable PDFs</li>
        </ul>

        <p className="text-muted-foreground leading-relaxed">
          For detailed information on tracking usage and managing invoices, see <DocLink to="/docs/billing/usage-and-invoices">Usage and Invoices</DocLink>.
        </p>
      </section>

      <section id="related" className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 scroll-mt-24">Related Pages</h2>
        <div className="space-y-3">
          <p>
            <DocLink to="/docs/billing/cost-of-services">Cost of Services</DocLink> — Learn about credit costs for different services
          </p>
          <p>
            <DocLink to="/docs/billing/how-to-buy-credits/pay-as-you-go">Pay as You Go</DocLink> — Flexible, usage-based billing
          </p>
          <p>
            <DocLink to="/docs/billing/how-to-buy-credits/subscriptions">Subscriptions</DocLink> — Monthly plans with included credits
          </p>
          <p>
            <DocLink to="/docs/billing/how-to-buy-credits/auto-refill">Auto-Refill</DocLink> — Automatic credit top-ups
          </p>
          <p>
            <DocLink to="/docs/billing/usage-and-invoices">Usage and Invoices</DocLink> — Track consumption and download invoices
          </p>
        </div>
      </section>
    </DocumentationPage>
  );
}
