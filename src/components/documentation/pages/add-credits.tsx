import { DocLink } from '#/components/documentation/DocLink';
import { DocumentationPage } from '#/components/documentation/DocumentationPage';
import { getPageSections } from '#/components/documentation/docStructure';

export default function AddCredits() {
  return (
    <DocumentationPage
      title="Add Credits"
      sections={getPageSections('/docs/get-started/add-credits')}
    >
      <section id="understanding-credits" className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 scroll-mt-24">Understanding Credits</h2>
        <p className="text-muted-foreground leading-relaxed mb-4">
          Credits are the currency used throughout our dashboard to pay for services. Each action you take—such as screening a candidate or conducting an interview—consumes a specific number of credits based on the service type.
        </p>
        <p className="text-muted-foreground leading-relaxed">
          To learn more about credits as currency and how they work, see <DocLink to="/docs/billing/overview">Billing Overview</DocLink>.
        </p>
      </section>

      <section id="adding-credits" className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 scroll-mt-24">Adding Credits to Your Account</h2>
        <p className="text-muted-foreground leading-relaxed mb-4">
          There are two ways to add credits to your account:
        </p>
 
        <div className="space-y-6">
          <div className="border-l-4 border-[#4366B0] pl-4">
            <h3 className="font-semibold mb-2">1. Buy Credits</h3>
            <p className="text-muted-foreground mb-2">
              Purchase credits manually through the Billing tab. This is part of the Pay as You Go model, where you pay only for what you use.
            </p>
            <p className="text-sm">
              <DocLink to="/billing">Go to Billing</DocLink> to purchase credits.
            </p>
          </div>
 
          <div className="border-l-4 border-[#4366B0] pl-4">
            <h3 className="font-semibold mb-2">2. Buy Subscriptions</h3>
            <p className="text-muted-foreground mb-2">
              Purchase a subscription plan for predictable monthly credit allocations and discounted rates.
            </p>
            <p className="text-sm">
              <DocLink to="/docs/billing/how-to-buy-credits/subscriptions">Learn more about Subscriptions</DocLink> →
            </p>
          </div>
        </div>
      </section>
 
      <section id="enterprise" className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 scroll-mt-24">Enterprise Plans</h2>
        <p className="text-muted-foreground leading-relaxed">
          For enterprise plans, you can contact support us to set up an enterprise deal with the best rates.
        </p>
        <p className="text-muted-foreground leading-relaxed mt-4">
          <DocLink to="/pricing">Contact Sales</DocLink> to discuss your requirements.
        </p>
      </section>
    </DocumentationPage>
  );
}
