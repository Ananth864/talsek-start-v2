import { DocLink } from '#/components/documentation/DocLink';
import { DocumentationPage } from '#/components/documentation/DocumentationPage';
import { getPageSections } from '#/components/documentation/docStructure';

export default function AutoRefill() {
  return (
    <DocumentationPage
      title="Auto-Refill"
      sections={getPageSections('/docs/billing/how-to-buy-credits/auto-refill')}
    >
      <section id="overview" className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 scroll-mt-24">Overview</h2>
        <p className="text-muted-foreground leading-relaxed mb-4">
          Auto-Refill automatically adds credits to your account when your balance drops below a threshold you set. This ensures you never run out of credits unexpectedly and can continue hiring without interruption.
        </p>
        <p className="text-muted-foreground leading-relaxed">
          Auto-Refill requires a payment mandate (established through your first payment). Once enabled, the system checks your balance periodically and charges your saved payment method when needed.
        </p>
      </section>

      <section id="setting-up" className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 scroll-mt-24">Setting Up Auto-Refill</h2>
        <p className="text-muted-foreground leading-relaxed mb-6">
          Configure Auto-Refill from the Billing page in your dashboard. You'll need to set two values:
        </p>

        <div className="space-y-6">
          <div className="border-l-4 border-[#4366B0] pl-4">
            <h3 className="font-semibold mb-2">1. Enable Auto-Refill</h3>
            <p className="text-muted-foreground mb-2">
              First, toggle Auto-Refill to "On" in the Billing page. This option is only available if you have a payment mandate established.
            </p>
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 mt-4">
              <p className="text-sm text-muted-foreground">
                <strong>Note:</strong> If you don't see the Auto-Refill option, you need to make your first payment to establish a payment mandate. See <DocLink to="/docs/billing/how-to-buy-credits/pay-as-you-go">Pay as You Go</DocLink> for details.
              </p>
            </div>
          </div>

          <div className="border-l-4 border-[#4366B0] pl-4">
            <h3 className="font-semibold mb-2">2. Set Threshold</h3>
            <p className="text-muted-foreground mb-2">
              Choose the credit balance at which Auto-Refill should trigger. When your balance drops below this number, the system will automatically add more credits.
            </p>
            <div className="bg-muted/50 border rounded-lg p-4 mt-4">
              <h4 className="font-semibold mb-2 text-sm">Recommended Thresholds</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Minimum threshold:</span>
                  <span className="font-medium">50 credits</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Recommended range:</span>
                  <span className="font-medium">300-500 credits</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Maximum threshold:</span>
                  <span className="font-medium">10,000 credits</span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-l-4 border-[#4366B0] pl-4">
            <h3 className="font-semibold mb-2">3. Set Refill Amount</h3>
            <p className="text-muted-foreground mb-2">
              Choose how much to add when Auto-Refill triggers. This is the dollar amount that will be charged to your payment method.
            </p>
            <div className="bg-muted/50 border rounded-lg p-4 mt-4">
              <h4 className="font-semibold mb-2 text-sm">Quick Amounts</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Common refill amounts include $1, $5, $10, $25, $50, and $100. You can also enter a custom amount.
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Minimum amount:</span>
                  <span className="font-medium">$1 (100 credits)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">No maximum limit:</span>
                  <span className="font-medium">Set any amount</span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-l-4 border-[#4366B0] pl-4">
            <h3 className="font-semibold mb-2">4. Save Settings</h3>
            <p className="text-muted-foreground mb-2">
              After configuring your threshold and amount, click "Save Changes" to activate Auto-Refill. You'll receive a confirmation when settings are saved.
            </p>
            <p className="text-sm text-muted-foreground">
              You can modify these settings anytime from the Billing page.
            </p>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 scroll-mt-24">How It Works</h2>
        <p className="text-muted-foreground leading-relaxed mb-6">
          Once configured, Auto-Refill operates automatically in the background:
        </p>

        <div className="space-y-4">
          <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/30 border border-border/50">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#4366B0]/10 flex items-center justify-center text-[#4366B0] font-semibold">
              1
            </div>
            <div>
              <h3 className="font-semibold mb-1">Periodic Checks</h3>
              <p className="text-muted-foreground text-sm">
                The system checks your credit balance every 6 hours. These checks happen automatically—you don't need to do anything.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/30 border border-border/50">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#4366B0]/10 flex items-center justify-center text-[#4366B0] font-semibold">
              2
            </div>
            <div>
              <h3 className="font-semibold mb-1">Threshold Detection</h3>
              <p className="text-muted-foreground text-sm">
                If your balance is below your configured threshold, Auto-Refill triggers. The charge is processed instantly using your saved payment method.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/30 border border-border/50">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#4366B0]/10 flex items-center justify-center text-[#4366B0] font-semibold">
              3
            </div>
            <div>
              <h3 className="font-semibold mb-1">Credit Addition</h3>
              <p className="text-muted-foreground text-sm">
                Credits are added to your account immediately after payment is confirmed. You'll receive a notification confirming the top-up.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/30 border border-border/50">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#4366B0]/10 flex items-center justify-center text-[#4366B0] font-semibold">
              4
            </div>
            <div>
              <h3 className="font-semibold mb-1">Invoice Generation</h3>
              <p className="text-muted-foreground text-sm">
                Each Auto-Refill charge generates an invoice. View and download invoices from the Invoices tab on the Billing page.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-6 my-8">
          <h3 className="font-semibold mb-2 text-blue-800 dark:text-blue-200">Important Timing Note</h3>
          <p className="text-muted-foreground mb-2">
            Because the system checks every 6 hours, your balance may temporarily drop below your threshold between checks. This is normal behavior.
          </p>
          <p className="text-sm text-muted-foreground">
            For example, if your threshold is 100 credits and you have 150 credits, you could use 60 credits in one action (dropping to 90). The next check will trigger Auto-Refill, but there may be a delay of up to 6 hours.
          </p>
        </div>

        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-6 my-6">
          <h3 className="font-semibold mb-4 text-amber-800 dark:text-amber-200">Example Scenario</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-4">
              <div>
                <p className="font-semibold mb-1">1. Setup</p>
                <p className="text-muted-foreground">Threshold: 100 credits | Refill: $25 (2,500 credits)</p>
              </div>
              <div>
                <p className="font-semibold mb-1">2. Starting Balance</p>
                <p className="text-muted-foreground">500 credits</p>
              </div>
              <div>
                <p className="font-semibold mb-1">3. Resume Screening</p>
                <p className="text-muted-foreground">50 resumes screened (250 credits consumed)</p>
              </div>
              <div>
                <p className="font-semibold mb-1">4. Balance Check</p>
                <p className="text-muted-foreground">250 credits—still above threshold</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <p className="font-semibold mb-1">5. Interviews</p>
                <p className="text-muted-foreground">30 interviews conducted (1,200 credits consumed)</p>
              </div>
              <div>
                <p className="font-semibold mb-1">6. Threshold Triggered</p>
                <p className="text-muted-foreground">Balance drops to 50 credits—below threshold</p>
              </div>
              <div>
                <p className="font-semibold mb-1">7. Auto-Refill Activated</p>
                <p className="text-muted-foreground">$25 charged, 2,500 credits added</p>
              </div>
              <div>
                <p className="font-semibold mb-1">8. Final Balance</p>
                <p className="text-muted-foreground">2,550 credits</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="managing" className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 scroll-mt-24">Managing Auto-Refill</h2>
        <p className="text-muted-foreground leading-relaxed mb-6">
          You have full control over Auto-Refill settings. Manage them from the Billing page:
        </p>

        <div className="space-y-6">
          <div className="border-l-4 border-[#4366B0] pl-4">
            <h3 className="font-semibold mb-2">Enabling/Disabling</h3>
            <p className="text-muted-foreground mb-2">
              Toggle Auto-Refill on or off anytime. When disabled, automatic top-ups stop, but your payment mandate remains active for manual purchases.
            </p>
            <p className="text-sm text-muted-foreground">
              To disable, go to Billing page, toggle Auto-Refill to "Off," and save changes.
            </p>
          </div>

          <div className="border-l-4 border-[#4366B0] pl-4">
            <h3 className="font-semibold mb-2">Changing Threshold</h3>
            <p className="text-muted-foreground mb-2">
              Adjust your threshold anytime based on your usage patterns. If you're running low frequently, increase the threshold. If you're topping up too often, decrease it.
            </p>
            <div className="bg-muted/50 border rounded-lg p-4 mt-4">
              <h4 className="font-semibold mb-2 text-sm">When to Increase Threshold</h4>
              <ul className="list-disc pl-6 space-y-1 text-sm text-muted-foreground">
                <li>You frequently see low credit warnings</li>
                <li>Auto-Refill triggers multiple times per week</li>
                <li>You want a larger safety buffer</li>
              </ul>
            </div>
          </div>

          <div className="border-l-4 border-[#4366B0] pl-4">
            <h3 className="font-semibold mb-2">Changing Refill Amount</h3>
            <p className="text-muted-foreground mb-2">
              Modify how much to add each time Auto-Refill triggers. Increase if you need more credits per top-up, decrease if you're accumulating unused credits.
            </p>
            <div className="bg-muted/50 border rounded-lg p-4 mt-4">
              <h4 className="font-semibold mb-2 text-sm">When to Increase Refill Amount</h4>
              <ul className="list-disc pl-6 space-y-1 text-sm text-muted-foreground">
                <li>Auto-Refill triggers frequently</li>
                <li>You want fewer top-ups with more credits each</li>
                <li>Your hiring volume has increased</li>
              </ul>
            </div>
          </div>

          <div className="border-l-4 border-[#4366B0] pl-4">
            <h3 className="font-semibold mb-2">Viewing Auto-Refill History</h3>
            <p className="text-muted-foreground mb-2">
              Track all Auto-Refill transactions in the Invoices tab. Each automatic top-up is listed with "Auto-Refill Top-up" as the description.
            </p>
            <p className="text-sm text-muted-foreground">
              For more on invoices, see <DocLink to="/docs/billing/usage-and-invoices">Usage and Invoices</DocLink>.
            </p>
          </div>
        </div>

        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6 my-8">
          <h3 className="font-semibold mb-2 text-red-800 dark:text-red-200">Payment Mandate Required</h3>
          <p className="text-muted-foreground mb-2">
            Auto-Refill requires an active payment mandate. If you cancel your Pay as You Go subscription, Auto-Refill will be disabled automatically.
          </p>
          <p className="text-sm text-muted-foreground">
            To re-enable Auto-Refill, make a new payment to re-establish the mandate.
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
            <DocLink to="/docs/billing/how-to-buy-credits/pay-as-you-go">Pay as You Go</DocLink> — Establish payment mandate
          </p>
          <p>
            <DocLink to="/docs/billing/how-to-buy-credits/subscriptions">Subscriptions</DocLink> — Monthly plans with included credits
          </p>
          <p>
            <DocLink to="/docs/billing/usage-and-invoices">Usage and Invoices</DocLink> — Track Auto-Refill transactions
          </p>
        </div>
      </section>
    </DocumentationPage>
  );
}
