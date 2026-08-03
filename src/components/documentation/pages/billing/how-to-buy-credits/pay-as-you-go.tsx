import { DocLink } from '#/components/documentation/DocLink';
import { DocumentationPage } from '#/components/documentation/DocumentationPage';
import { getPageSections } from '#/components/documentation/docStructure';

export default function PayAsYouGo() {
  return (
    <DocumentationPage
      title="Pay as You Go"
      sections={getPageSections('/docs/billing/how-to-buy-credits/pay-as-you-go')}
    >
      <section id="overview" className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 scroll-mt-24">Overview</h2>
        <p className="text-muted-foreground leading-relaxed mb-4">
          Pay as You Go is Talsek's most flexible billing model. There's no monthly commitment—you purchase credits when you need them and use them whenever you want. You're charged only for what you use.
        </p>
        <p className="text-muted-foreground leading-relaxed">
          This model is ideal if you have sporadic hiring needs, are testing the platform, or prefer complete control over your spending. You can start with a small amount and scale up as your needs grow.
        </p>
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
            <DocLink to="/docs/billing/how-to-buy-credits/subscriptions">Subscriptions</DocLink> — Monthly plans with included credits
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
