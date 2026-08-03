import { DocLink } from '#/components/documentation/DocLink';
import { DocumentationPage } from '#/components/documentation/DocumentationPage';
import { getPageSections } from '#/components/documentation/docStructure';

export default function CostOfServices() {
  return (
    <DocumentationPage
      title="Cost of Services"
      sections={getPageSections('/docs/billing/cost-of-services')}
    >
      <section id="overview" className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 scroll-mt-24">Overview</h2>
        <p className="text-muted-foreground leading-relaxed mb-4">
          Each service on Talsek consumes credits based on its complexity and resource requirements. Understanding these costs helps you budget effectively and choose the right billing model for your needs.
        </p>
        <p className="text-muted-foreground leading-relaxed">
          Credit costs vary depending on your billing plan. Subscriptions offer discounted rates compared to Pay as You Go, making them more economical for regular usage.
        </p>
      </section>

      <section id="credit-pricing" className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 scroll-mt-24">Credit Pricing</h2>
        <p className="text-muted-foreground leading-relaxed mb-4">
          Credits follow a simple conversion rate that makes it easy to understand costs:
        </p>

        <div className="bg-muted/50 border rounded-lg p-6 my-6">
          <h3 className="font-semibold mb-4">Base Rate</h3>
          <div className="text-center py-4">
            <div className="text-3xl font-bold text-[#4366B0] mb-2">1 cent = 1 credit</div>
            <p className="text-muted-foreground">or equivalently, 1 USD = 100 credits</p>
          </div>
        </div>

        <p className="text-muted-foreground leading-relaxed">
          This base rate applies to all billing models. The difference between plans lies in how many credits each service consumes, not in the credit value itself.
        </p>
      </section>

      <section id="screening-costs" className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 scroll-mt-24">Screening Costs</h2>
        <p className="text-muted-foreground leading-relaxed mb-6">
          Two main services consume credits: resume screening and screening interviews. Costs vary by billing plan:
        </p>

        <div className="overflow-x-auto my-6">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="py-3 px-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Service</th>
                <th className="py-3 px-4 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">Pay as You Go</th>
                <th className="py-3 px-4 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">Tier 1</th>
                <th className="py-3 px-4 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">Enterprise</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b hover:bg-muted/30 transition-colors">
                <td className="py-4 px-4 font-medium">Resume Screening</td>
                <td className="py-4 px-4 text-right">5 credits</td>
                <td className="py-4 px-4 text-right text-[#4366B0] font-semibold">4 credits</td>
                <td className="py-4 px-4 text-right text-muted-foreground">Custom</td>
              </tr>
              <tr className="border-b hover:bg-muted/30 transition-colors">
                <td className="py-4 px-4 font-medium">Screening Interview</td>
                <td className="py-4 px-4 text-right">40 credits</td>
                <td className="py-4 px-4 text-right text-[#4366B0] font-semibold">30 credits</td>
                <td className="py-4 px-4 text-right text-muted-foreground">Custom</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="bg-muted/50 border rounded-lg p-4 my-6">
          <p className="text-sm text-muted-foreground">
            <strong>Note:</strong> All credit costs are per candidate.
          </p>
        </div>

        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-6 my-6">
          <h3 className="font-semibold mb-2 text-amber-800 dark:text-amber-200">What's the Difference?</h3>
          <p className="text-muted-foreground mb-2">
            <strong>Resume Screening</strong> analyzes candidate resumes against your job requirements using AI, providing match scores and insights.
          </p>
          <p className="text-muted-foreground">
            <strong>Screening Interview</strong> is a video interview where AI asks candidates questions and evaluates their responses, providing deeper assessment of skills and fit.
          </p>
        </div>

        <p className="text-muted-foreground leading-relaxed">
          For more details on how screening works and when to use each service, see <DocLink to="/docs/core-ai-services/overview">Core AI Services</DocLink> documentation.
        </p>
      </section>

      <section id="subscriptions" className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 scroll-mt-24">Subscriptions</h2>
        <p className="text-muted-foreground leading-relaxed mb-4">
          Subscriptions provide two key benefits: monthly credit allocations and discounted per-action rates.
        </p>

        <div className="space-y-6">
          <div className="border-l-4 border-purple-500 pl-4">
            <h3 className="font-semibold mb-2">Monthly Credit Allocation</h3>
            <p className="text-muted-foreground mb-2">
              Tier 1 subscription includes 5,000 credits each month. These credits reset at the start of each billing cycle, ensuring you always have a fresh allocation.
            </p>
            <p className="text-sm text-muted-foreground">
              If you exceed your monthly allocation, you can purchase additional credits at the standard rate.
            </p>
          </div>

          <div className="border-l-4 border-emerald-500 pl-4">
            <h3 className="font-semibold mb-2">Discounted Rates</h3>
            <p className="text-muted-foreground mb-2">
              Subscriptions reduce the credit cost of each action:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Resume Screening: <strong>20% discount</strong> (4 credits vs. 5)</li>
              <li>Screening Interview: <strong>25% discount</strong> (30 credits vs. 40)</li>
            </ul>
          </div>
        </div>

        <div className="bg-muted/50 border rounded-lg p-6 my-8">
          <h3 className="font-semibold mb-4">Cost Comparison Example</h3>
          <p className="text-muted-foreground mb-4">
            Here's how costs compare for a typical hiring workflow (10 resume screenings + 3 interviews):
          </p>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="font-medium">Pay as You Go</span>
              <span className="font-bold">170 credits ($1.70)</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="font-medium">Tier 1</span>
              <span className="font-bold text-[#4366B0]">130 credits ($1.30)</span>
            </div>
          </div>
        </div>

        <p className="text-muted-foreground leading-relaxed">
          For detailed information on subscription plans and how to manage them, see <DocLink to="/docs/billing/how-to-buy-credits/subscriptions">Subscriptions</DocLink>.
        </p>
      </section>

      <section id="enterprise" className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 scroll-mt-24">Enterprise Deals</h2>
        <p className="text-muted-foreground leading-relaxed">
          For enterprise plans, you get the best rates after negotiations with us. Contact sales to discuss your requirements and receive a custom quote tailored to your organization's needs.
        </p>
      </section>

      <section id="related" className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 scroll-mt-24">Related Pages</h2>
        <div className="space-y-3">
          <p>
            <DocLink to="/docs/billing/overview">Billing Overview</DocLink> — Introduction to billing and credits
          </p>
          <p>
            <DocLink to="/docs/billing/how-to-buy-credits/pay-as-you-go">Pay as You Go</DocLink> — Flexible, usage-based billing
          </p>
          <p>
            <DocLink to="/docs/billing/how-to-buy-credits/subscriptions">Subscriptions</DocLink> — Monthly plans with included credits
          </p>
          <p>
            <DocLink to="/docs/billing/usage-and-invoices">Usage and Invoices</DocLink> — Track your credit consumption
          </p>
        </div>
      </section>
    </DocumentationPage>
  );
}
