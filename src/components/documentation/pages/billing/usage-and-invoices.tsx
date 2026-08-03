import { DocLink } from '#/components/documentation/DocLink';
import { DocumentationPage } from '#/components/documentation/DocumentationPage';
import { getPageSections } from '#/components/documentation/docStructure';

export default function UsageAndInvoices() {
  return (
    <DocumentationPage
      title="Usage and Invoices"
      sections={getPageSections('/docs/billing/usage-and-invoices')}
    >
      <section id="overview" className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 scroll-mt-24">Overview</h2>
        <p className="text-muted-foreground leading-relaxed mb-4">
          Tracking your credit usage and managing invoices is essential for understanding your spending and planning your hiring activities. Talsek provides comprehensive tools to monitor consumption in real-time and access complete payment history.
        </p>
        <p className="text-muted-foreground leading-relaxed">
          All usage and billing information is accessible from the <DocLink to="/billing">Billing page</DocLink> in your dashboard, organized into three tabs: Billing, Usage, and Invoices.
        </p>
      </section>

      <section id="tracking" className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 scroll-mt-24">Tracking Usage</h2>
        <p className="text-muted-foreground leading-relaxed mb-6">
          Monitor your credit consumption through multiple views on the Billing page:
        </p>

        <div className="space-y-6">
          <div className="border-l-4 border-[#4366B0] pl-4">
            <h3 className="font-semibold mb-2">Real-Time Balance</h3>
            <p className="text-muted-foreground mb-2">
              Your current credit balance is displayed prominently on the Billing tab. This updates automatically as you consume credits and reflects additions from purchases or subscriptions.
            </p>
            <div className="bg-muted/50 border rounded-lg p-4 mt-4">
              <h4 className="font-semibold mb-2 text-sm">Balance Updates</h4>
              <ul className="list-disc pl-6 space-y-1 text-sm text-muted-foreground">
                <li>Updates immediately when credits are consumed</li>
                <li>Refreshes automatically after purchases (may take 2-3 seconds)</li>
                <li>Auto-refreshes every 30 seconds to show latest balance</li>
              </ul>
            </div>
          </div>

          <div className="border-l-4 border-[#4366B0] pl-4">
            <h3 className="font-semibold mb-2">Daily Usage Charts</h3>
            <p className="text-muted-foreground mb-2">
              The Usage tab displays a bar chart showing your credit consumption over the last 14 days. This helps you identify patterns in your hiring activity and plan accordingly.
            </p>
            <div className="bg-muted/50 border rounded-lg p-4 mt-4">
              <h4 className="font-semibold mb-2 text-sm">Chart Insights</h4>
              <ul className="list-disc pl-6 space-y-1 text-sm text-muted-foreground">
                <li>Identify peak usage days (e.g., after posting new jobs)</li>
                <li>Track trends in your hiring volume over time</li>
                <li>Correlate usage with specific campaigns or job postings</li>
                <li>Plan credit purchases based on historical patterns</li>
              </ul>
            </div>
          </div>

          <div className="border-l-4 border-[#4366B0] pl-4">
            <h3 className="font-semibold mb-2">Category Breakdown</h3>
            <p className="text-muted-foreground mb-2">
              A pie chart shows how your credits are distributed between resume screenings and screening interviews. This helps you understand which services consume most of your budget.
            </p>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="bg-[#4366B0]/10 border border-[#4366B0]/20 rounded-lg p-4">
                <h4 className="font-semibold mb-2 text-sm text-[#4366B0]">Resume Screenings</h4>
                <p className="text-sm text-muted-foreground">
                  Each resume screening consumes credits based on your plan. Track how many resumes you've processed and total credits used.
                </p>
              </div>
              <div className="bg-[#38bdf8]/10 border border-[#38bdf8]/20 rounded-lg p-4">
                <h4 className="font-semibold mb-2 text-sm text-[#38bdf8]">Screening Interviews</h4>
                <p className="text-sm text-muted-foreground">
                  Interviews consume more credits but provide deeper candidate assessment. Monitor interview volume and associated costs.
                </p>
              </div>
            </div>
          </div>

          <div className="border-l-4 border-[#4366B0] pl-4">
            <h3 className="font-semibold mb-2">Per-Job Breakdown</h3>
            <p className="text-muted-foreground mb-2">
              A detailed table shows credit consumption for each job posting. This helps you understand which positions are most resource-intensive and optimize your hiring strategy.
            </p>
            <div className="bg-muted/50 border rounded-lg p-4 mt-4">
              <h4 className="font-semibold mb-2 text-sm">Table Columns</h4>
              <ul className="list-disc pl-6 space-y-1 text-sm text-muted-foreground">
                <li><strong>Job Title</strong> — Name of the position</li>
                <li><strong>Resumes</strong> — Number of resumes screened for this job</li>
                <li><strong>Interviews</strong> — Number of interviews conducted for this job</li>
                <li><strong>Total Credits</strong> — Combined credits consumed for this job</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-6 my-8">
          <h3 className="font-semibold mb-2 text-blue-800 dark:text-blue-200">Low Credit Warning</h3>
          <p className="text-muted-foreground mb-2">
            When your credit balance drops below 50 credits, a persistent banner appears in the bottom-right corner of your dashboard. This banner cannot be dismissed and reminds you to add credits before running out.
          </p>
          <p className="text-sm text-muted-foreground">
            The banner changes color: <strong>amber</strong> when below 50 credits, <strong>red</strong> when exhausted. Click "Add Credits" to navigate directly to the Billing page.
          </p>
        </div>
      </section>

      <section id="invoices" className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 scroll-mt-24">Invoices</h2>
        <p className="text-muted-foreground leading-relaxed mb-6">
          The Invoices tab provides a complete history of all payments made to your account. Each payment generates an invoice that you can view and download as a PDF for your records.
        </p>

        <div className="overflow-x-auto my-6">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="py-3 px-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Column</th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Description</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b hover:bg-muted/30 transition-colors">
                <td className="py-4 px-4 font-medium">Date</td>
                <td className="py-4 px-4 text-muted-foreground">When the payment was processed</td>
              </tr>
              <tr className="border-b hover:bg-muted/30 transition-colors">
                <td className="py-4 px-4 font-medium">Description</td>
                <td className="py-4 px-4 text-muted-foreground">Type of payment (e.g., "Credit Top-up," "Tier 1 Subscription," "Auto-Refill Top-up")</td>
              </tr>
              <tr className="border-b hover:bg-muted/30 transition-colors">
                <td className="py-4 px-4 font-medium">Amount</td>
                <td className="py-4 px-4 text-muted-foreground">Total amount charged (including tax) in your currency</td>
              </tr>
              <tr className="border-b hover:bg-muted/30 transition-colors">
                <td className="py-4 px-4 font-medium">Status</td>
                <td className="py-4 px-4 text-muted-foreground">Payment status (succeeded, failed, refunded)</td>
              </tr>
              <tr className="border-b hover:bg-muted/30 transition-colors">
                <td className="py-4 px-4 font-medium">Invoice</td>
                <td className="py-4 px-4 text-muted-foreground">Download button for PDF invoice (available for successful payments)</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="space-y-6 mt-8">
          <div className="border-l-4 border-[#4366B0] pl-4">
            <h3 className="font-semibold mb-2">Downloading Invoices</h3>
            <p className="text-muted-foreground mb-2">
              Each successful payment has a "PDF" button in the Invoice column. Click this button to download the invoice as a PDF file.
            </p>
            <div className="bg-muted/50 border rounded-lg p-4 mt-4">
              <h4 className="font-semibold mb-2 text-sm">Invoice Contents</h4>
              <ul className="list-disc pl-6 space-y-1 text-sm text-muted-foreground">
                <li>Payment date and invoice number</li>
                <li>Billing company name and address</li>
                <li>Payment method (last 4 digits shown)</li>
                <li>Itemized charges with tax breakdown</li>
                <li>Total amount paid</li>
              </ul>
            </div>
          </div>

          <div className="border-l-4 border-[#4366B0] pl-4">
            <h3 className="font-semibold mb-2">Payment Types</h3>
            <p className="text-muted-foreground mb-2">
              Invoices show different payment types based on how you added credits:
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 p-2 rounded bg-muted/30">
                <span className="font-medium text-sm">Credit Top-up</span>
                <span className="text-sm text-muted-foreground">— Manual credit purchase</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded bg-muted/30">
                <span className="font-medium text-sm">Auto-Refill Top-up</span>
                <span className="text-sm text-muted-foreground">— Automatic credit addition</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded bg-muted/30">
                <span className="font-medium text-sm">Tier 1 Subscription</span>
                <span className="text-sm text-muted-foreground">— Monthly subscription payment</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded bg-muted/30">
                <span className="font-medium text-sm">Enterprise Subscription</span>
                <span className="text-sm text-muted-foreground">— Custom plan payment</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded bg-muted/30">
                <span className="font-medium text-sm">Pay as You Go Setup</span>
                <span className="text-sm text-muted-foreground">— First payment establishing mandate</span>
              </div>
            </div>
          </div>

          <div className="border-l-4 border-[#4366B0] pl-4">
            <h3 className="font-semibold mb-2">Pagination</h3>
            <p className="text-muted-foreground mb-2">
              If you have many invoices, they're displayed 10 at a time. Use the pagination controls at the bottom of the table to navigate through your invoice history.
            </p>
            <p className="text-sm text-muted-foreground">
              The pagination shows your current position (e.g., "Showing 1–10 of 45") and provides Previous/Next buttons to navigate.
            </p>
          </div>
        </div>
      </section>

      <section id="notifications" className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 scroll-mt-24">Notifications</h2>
        <p className="text-muted-foreground leading-relaxed mb-6">
          Talsek sends notifications to keep you informed about your billing status and usage. These appear as toast messages in your dashboard and may include email notifications.
        </p>

        <div className="space-y-4">
          <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/30 border border-border/50">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 font-semibold">
              ✓
            </div>
            <div>
              <h3 className="font-semibold mb-1">Payment Success</h3>
              <p className="text-muted-foreground text-sm">
                When a payment completes successfully, you'll receive confirmation that credits have been added to your account. This includes manual purchases, subscription payments, and Auto-Refill transactions.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/30 border border-border/50">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center text-red-600 font-semibold">
              ✕
            </div>
            <div>
              <h3 className="font-semibold mb-1">Payment Failure</h3>
              <p className="text-muted-foreground text-sm">
                If a payment fails (e.g., insufficient funds, expired card), you'll receive an error message with details. Common causes include card expiration, insufficient balance, or bank declines.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/30 border border-border/50">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600 font-semibold">
              !
            </div>
            <div>
              <h3 className="font-semibold mb-1">Low Credit Warning</h3>
              <p className="text-muted-foreground text-sm">
                When your balance drops below 50 credits, you'll see a persistent banner in your dashboard. This serves as a reminder to add credits before running out completely.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/30 border border-border/50">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-600 font-semibold">
              ℹ
            </div>
            <div>
              <h3 className="font-semibold mb-1">Subscription Updates</h3>
              <p className="text-muted-foreground text-sm">
                When your subscription renews, you'll receive confirmation. If you cancel, you'll be notified of the effective cancellation date and reminded that access continues until period end.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-6 my-8">
          <h3 className="font-semibold mb-2 text-amber-800 dark:text-amber-200">Payment Processing Time</h3>
          <p className="text-muted-foreground mb-2">
            After completing checkout, there may be a short delay (typically 2-5 seconds) before credits appear in your balance. This is due to webhook processing from our payment provider.
          </p>
          <p className="text-sm text-muted-foreground">
            If credits don't appear after 30 seconds, refresh the page or contact support.
          </p>
        </div>
      </section>

      <section id="related" className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 scroll-mt-24">Related Pages</h2>
        <div className="space-y-3">
          <p>
            <DocLink to="/docs/billing/overview">Billing Overview</DocLink> — Introduction to billing and credits
          </p>
          <p>
            <DocLink to="/docs/billing/cost-of-services">Cost of Services</DocLink> — Understanding service costs
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
        </div>
      </section>
    </DocumentationPage>
  );
}
