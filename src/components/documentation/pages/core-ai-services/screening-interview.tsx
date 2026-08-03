import { DocumentationPage } from '#/components/documentation/DocumentationPage';
import { getPageSections } from '#/components/documentation/docStructure';

export default function ScreeningInterview() {
  return (
    <DocumentationPage
      title="Screening Interview"
      sections={getPageSections('/docs/core-ai-services/screening-interview')}
    >
    </DocumentationPage>
  );
}
