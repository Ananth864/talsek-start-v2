import { DocumentationPage } from '#/components/documentation/DocumentationPage';
import { getPageSections } from '#/components/documentation/docStructure';

export default function CoreAIServicesOverview() {
  return (
    <DocumentationPage
      title="Core AI Services Overview"
      sections={getPageSections('/docs/core-ai-services/overview')}
    >
    </DocumentationPage>
  );
}
