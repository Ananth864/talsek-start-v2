import { DocLink } from '#/components/documentation/DocLink';
import { DocumentationPage } from '#/components/documentation/DocumentationPage';
import { getPageSections } from '#/components/documentation/docStructure';

export default function Subscriptions() {
  return (
    <DocumentationPage
      title="Subscriptions"
      sections={getPageSections('/docs/billing/how-to-buy-credits/subscriptions')}
    >
      <section id="overview" className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 scroll-mt-24">Overview</h2>
        <p className="text-muted-foreground leading-relaxed mb-4">
          Subscriptions provide predictable monthly costs and discounted credit rates. With a subscription, you receive a monthly credit allocation and pay less per action compared to Pay as You Go.
        </p>
        <p className="text-muted-foreground leading-relaxed">
          Subscriptions are ideal if you hire regularly, want predictable budgeting, or prefer the savings from discounted rates. You can upgrade, downgrade, or cancel your subscription at any time.
        </p>
      </section>

      <section id="plans" className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 scroll-mt-24">Available Plans</h2>
        <p className="text-muted-foreground leading-relaxed mb-6">
          Talsek offers two subscription tiers designed for different needs:
        </p>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Tier 1 */}
          <div className="border-2 border-[#4366B0] rounded-xl p-6 bg-gradient-to-br from-[#4366B0]/5 to-transparent">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Tier 1</h3>
              <span className="bg-[#4366B0] text-white text-xs font-semibold px-2 py-1 rounded">POPULAR</span>
            </div>
            <div className="mb-4">
              <span className="text-3xl font-bold">$50</span>
              <span className="text-muted-foreground">/month</span>
            </div>
            <ul className="space-y-2 mb-6">
              <li className="flex items-start gap-2">
                <span className="text-[#4366B0] mt-1">✓</span>
                <span className="text-sm">5,000 credits included monthly</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#4366B0] mt-1">✓</span>
                <span className="text-sm">Resume Screening: 4 credits (20% off)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#4366B0] mt-1">✓</span>
                <span className="text-sm">Screening Interview: 30 credits (25% off)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#4366B0] mt-1">✓</span>
                <span className="text-sm">Priority support</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#4366B0] mt-1">✓</span>
                <span className="text-sm">Additional credits at the standard rate</span>
              </li>
            </ul>
            <p className="text-sm text-muted-foreground">
              Best for: Regular hiring, small to medium teams, predictable budgeting
            </p>
          </div>

          {/* Enterprise */}
          <div className="border-2 border-amber-500 rounded-xl p-6 bg-gradient-to-br from-amber-500/5 to-transparent">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Enterprise</h3>
              <span className="bg-amber-500 text-white text-xs font-semibold px-2 py-1 rounded">CUSTOM</span>
            </div>
            <div className="mb-4">
              <span className="text-3xl font-bold">Custom</span>
              <span className="text-muted-foreground"> pricing</span>
            </div>
            <ul className="space-y-2 mb-6">
              <li className="flex items-start gap-2">
                <span className="text-amber-600 mt-1">✓</span>
                <span className="text-sm">Custom credit allocations</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-600 mt-1">✓</span>
                <span className="text-sm">Best-in-class credit rates</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-600 mt-1">✓</span>
                <span className="text-sm">Dedicated account manager</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-600 mt-1">✓</span>
                <span className="text-sm">Custom integrations</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-600 mt-1">✓</span>
                <span className="text-sm">Priority support (SLA)</span>
              </li>
            </ul>
            <p className="text-sm text-muted-foreground">
              Best for: High-volume hiring, HR consultancies, large organizations. Contact support to set up an enterprise deal with best rates.
            </p>
          </div>
        </div>

        <div className="bg-muted/50 border rounded-lg p-6 my-6">
          <h3 className="font-semibold mb-4">How to Subscribe</h3>
          <p className="text-muted-foreground mb-4">
            To start a subscription, go to <DocLink to="/billing">Billing page</DocLink> and click "Change Plan." Select your desired plan and complete checkout.
          </p>
          <p className="text-muted-foreground">
            For Enterprise plans, <DocLink to="/pricing">contact sales</DocLink> to discuss your requirements and receive a custom quote.
          </p>
        </div>
      </section>

      <section id="pricing-tiers" className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 scroll-mt-24">Pricing Tiers</h2>
        <p className="text-muted-foreground leading-relaxed mb-6">
          Compare credit costs across all billing models:
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
              <tr className="border-b hover:bg-muted/30 transition-colors">
                <td className="py-4 px-4 font-medium">Monthly Cost</td>
                <td className="py-4 px-4 text-right text-muted-foreground">—</td>
                <td className="py-4 px-4 text-right text-[#4366B0] font-semibold">$50</td>
                <td className="py-4 px-4 text-right text-muted-foreground">Custom</td>
              </tr>
              <tr className="border-b hover:bg-muted/30 transition-colors">
                <td className="py-4 px-4 font-medium">Included Credits</td>
                <td className="py-4 px-4 text-right text-muted-foreground">—</td>
                <td className="py-4 px-4 text-right text-[#4366B0] font-semibold">5,000</td>
                <td className="py-4 px-4 text-right text-muted-foreground">Custom</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-6 my-6">
          <h3 className="font-semibold mb-2 text-emerald-800 dark:text-emerald-200">Subscription Savings</h3>
          <p className="text-muted-foreground mb-2">
            With Tier 1, you save up to 25% on each action compared to Pay as You Go. If you use your full 5,000 credit allocation, your effective rate is just $0.01 per credit—a 50% discount over Pay as You Go.
          </p>
          <p className="text-sm text-muted-foreground">
            For detailed cost comparisons, see <DocLink to="/docs/billing/cost-of-services">Cost of Services</DocLink>.
          </p>
        </div>
      </section>

      <section id="benefits" className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 scroll-mt-24">Benefits</h2>
        <p className="text-muted-foreground leading-relaxed mb-6">
          Subscriptions offer several advantages for teams with regular hiring needs:
        </p>

        <div className="space-y-4">
          <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/30 border border-border/50">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-600 font-semibold">
              1
            </div>
            <div>
              <h3 className="font-semibold mb-1">Predictable Costs</h3>
              <p className="text-muted-foreground text-sm">
                Fixed monthly fee means no surprises. Budget accurately for your hiring activities month after month.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/30 border border-border/50">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-600 font-semibold">
              2
            </div>
            <div>
              <h3 className="font-semibold mb-1">Discounted Rates</h3>
              <p className="text-muted-foreground text-sm">
                Save 20-25% on every action compared to Pay as You Go. Significant savings for regular usage.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/30 border border-border/50">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-600 font-semibold">
              3
            </div>
            <div>
              <h3 className="font-semibold mb-1">Monthly Allocation</h3>
              <p className="text-muted-foreground text-sm">
                Tier 1 includes 5,000 credits each month. Credits reset at billing cycle start, ensuring fresh allocation.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/30 border border-border/50">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-600 font-semibold">
              4
            </div>
            <div>
              <h3 className="font-semibold mb-1">Priority Support</h3>
              <p className="text-muted-foreground text-sm">
                Get faster response times and dedicated assistance for any issues or questions.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/30 border border-border/50">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-600 font-semibold">
              5
            </div>
            <div>
              <h3 className="font-semibold mb-1">Flexibility</h3>
              <p className="text-muted-foreground text-sm">
                Change plans or cancel anytime. No long-term contracts or penalties for adjusting your subscription.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="managing" className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 scroll-mt-24">Managing Your Subscription</h2>
        <p className="text-muted-foreground leading-relaxed mb-6">
          You have full control over your subscription. Manage it from the Billing page in your dashboard.
        </p>

        <div className="space-y-6">
          <div className="border-l-4 border-[#4366B0] pl-4">
            <h3 className="font-semibold mb-2">Upgrading</h3>
            <p className="text-muted-foreground mb-2">
              Upgrade from Tier 1 to Enterprise anytime. Contact sales to discuss your needs and receive a custom quote. Your new plan takes effect immediately.
            </p>
          </div>

          <div className="border-l-4 border-[#4366B0] pl-4">
            <h3 className="font-semibold mb-2">Downgrading</h3>
            <p className="text-muted-foreground mb-2">
              Downgrade from Enterprise to Tier 1 anytime. The change takes effect at the end of your current billing period. You'll retain Enterprise benefits until then.
            </p>
          </div>

          <div className="border-l-4 border-[#4366B0] pl-4">
            <h3 className="font-semibold mb-2">Cancelling</h3>
            <p className="text-muted-foreground mb-2">
              Cancel your subscription at any time. Your access continues until the end of your current billing period—no immediate loss of service. After cancellation, you can switch to Pay as You Go or purchase credits as needed.
            </p>
          </div>

          <div className="border-l-4 border-[#4366B0] pl-4">
            <h3 className="font-semibold mb-2">Changing Payment Method</h3>
            <p className="text-muted-foreground mb-2">
              Update your payment method through the checkout process. When you make a new payment, your card details are updated automatically.
            </p>
          </div>
        </div>

        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-6 my-8">
          <h3 className="font-semibold mb-2 text-blue-800 dark:text-blue-200">Important Notes</h3>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li>Monthly credit allocations reset at the start of each billing cycle</li>
            <li>Unused credits from your allocation do roll over to the next month</li>
            <li>If you exceed your allocation, additional credits can be purchased at the standard rate</li>
            <li>Cancellations take effect at the end of the billing period, not immediately</li>
          </ul>
        </div>
      </section>

      <section id="related" className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 scroll-mt-24">Related Pages</h2>
        <div className="space-y-3">
          <p>
            <DocLink to="/docs/billing/overview">Billing Overview</DocLink> — Introduction to billing and credits
          </p>
          <p>
            <DocLink to="/docs/billing/cost-of-services">Cost of Services</DocLink> — Detailed service costs and comparisons
          </p>
          <p>
            <DocLink to="/docs/billing/how-to-buy-credits/pay-as-you-go">Pay as You Go</DocLink> — Flexible, usage-based billing
          </p>
          <p>
            <DocLink to="/docs/billing/how-to-buy-credits/auto-refill">Auto-Refill</DocLink> — Automatic credit top-ups
          </p>
          <p>
            <DocLink to="/docs/billing/usage-and-invoices">Usage and Invoices</DocLink> — Track your credit consumption
          </p>
        </div>
      </section>
    </DocumentationPage>
  );
}
