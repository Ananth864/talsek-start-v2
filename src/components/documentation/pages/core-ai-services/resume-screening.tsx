import { DocumentationPage } from '#/components/documentation/DocumentationPage';
import { getPageSections } from '#/components/documentation/docStructure';

export default function ResumeScreening() {
  return (
    <DocumentationPage
      title="Resume Screening"
      sections={getPageSections('/docs/core-ai-services/resume-screening')}
    >
    </DocumentationPage>
  );
}
