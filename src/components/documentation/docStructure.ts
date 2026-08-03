export type PageSection = {
  id: string;
  title: string;
  level?: number;
};

export type DocPage = {
  title: string;
  path: string;
  sections?: PageSection[];
  children?: DocPage[];
};

export type DocSection = {
  title: string;
  pages?: DocPage[];
};

export const docStructure: DocSection[] = [
  {
    title: "Get Started",
    pages: [
      {
        title: "Overview",
        path: "/docs/get-started",
        sections: [
          { id: "what-is-talsek", title: "What is Talsek?" },
          { id: "account-setup", title: "Account Setup" },
          { id: "first-steps", title: "First Steps" },
          { id: "company-input", title: "Company Input Modal" },
        ],
      },
      {
        title: "Add Credits",
        path: "/docs/get-started/add-credits",
        sections: [
          { id: "understanding-credits", title: "Understanding Credits" },
          { id: "adding-credits", title: "Adding Credits" },
          { id: "enterprise", title: "Enterprise Plans" },
        ],
      },
      {
        title: "Customize Application Form",
        path: "/docs/get-started/customize-application-form",
        sections: [
          { id: "form-overview", title: "Form Overview" },
          { id: "adding-removing-fields", title: "Adding & Removing Fields" },
          { id: "field-types", title: "Field Types" },
          { id: "previewing", title: "Previewing Your Form" },
          { id: "related", title: "Related Pages" },
        ],
      },
      {
        title: "Set Reachout Template",
        path: "/docs/get-started/set-reachout-template",
        sections: [
          { id: "template-overview", title: "Template Overview" },
          { id: "email-structure", title: "Email Structure" },
          { id: "variables", title: "Template Variables" },
          { id: "related", title: "Related Pages" },
        ],
      },
      {
        title: "Add Team Members",
        path: "/docs/get-started/add-team-members",
        sections: [
          { id: "accessing-team", title: "Accessing Team Settings" },
          { id: "inviting-members", title: "Inviting New Team Members" },
          { id: "managing-team", title: "Managing Team" },
          { id: "user-roles", title: "User Roles" },
          { id: "resending-invites", title: "Resending Invites" },
          { id: "real-time-updates", title: "Real-Time Updates" },
          { id: "related", title: "Related Pages" },
        ],
      },
      {
        title: "Create a Job",
        path: "/docs/create-a-job",
        sections: [
          { id: "overview", title: "Overview" },
          { id: "screening-process", title: "Choosing Your Screening Process" },
          { id: "creating-job", title: "Creating Your First Job" },
          { id: "job-details", title: "Job Details Fields Explained" },
          { id: "logistics", title: "Logistics Configuration" },
          { id: "ai-extraction", title: "AI-Powered Requirements Extraction" },
          { id: "application-form", title: "Configuring Application Form" },
          { id: "related", title: "Related Pages" },
        ],
      },
      {
        title: "Getting Candidates",
        path: "/docs/getting-candidates",
        sections: [
          { id: "overview", title: "Overview" },
          { id: "copying-links", title: "Where to Copy Your Links" },
          { id: "form-link", title: "Form Link Method" },
          { id: "email-link", title: "Email Link Method" },
          { id: "managing-candidates", title: "Managing Incoming Candidates" },
          { id: "related", title: "Related Pages" },
        ],
      },
    ],
  },
  {
    title: "Core AI Services",
    pages: [
      {
        title: "Overview",
        path: "/docs/core-ai-services/overview",
        sections: [
          { id: "overview", title: "Overview" },
          { id: "resume-screening", title: "Resume Screening" },
          { id: "screening-interview", title: "Screening Interview" },
          { id: "related", title: "Related Pages" },
        ],
      },
      {
        title: "Resume Screening",
        path: "/docs/core-ai-services/resume-screening",
        sections: [
          { id: "overview", title: "Overview" },
          { id: "how-it-works", title: "How It Works" },
          { id: "ai-analysis", title: "AI Analysis" },
          { id: "related", title: "Related Pages" },
        ],
      },
      {
        title: "Screening Interview",
        path: "/docs/core-ai-services/screening-interview",
        sections: [
          { id: "overview", title: "Overview" },
          { id: "how-it-works", title: "How It Works" },
          { id: "ai-evaluation", title: "AI Evaluation" },
          { id: "related", title: "Related Pages" },
        ],
      },
    ],
  },
  {
    title: "Dashboard",
    pages: [
      {
        title: "Overview",
        path: "/docs/dashboard/overview",
        sections: [
          { id: "overview", title: "Overview" },
          { id: "navigation", title: "Navigation" },
          { id: "quick-actions", title: "Quick Actions" },
          { id: "analytics", title: "Analytics" },
          { id: "related-pages", title: "Related Pages" },
        ],
      },
      {
        title: "Candidate Card",
        path: "/docs/dashboard/candidate-card",
        children: [
          {
            title: "Overview",
            path: "/docs/dashboard/candidate-card/overview",
            sections: [
              { id: "what-is", title: "What is a Candidate Card?" },
              { id: "components", title: "Components" },
              { id: "status", title: "Status Indicators" },
              { id: "actions", title: "Available Actions" },
              { id: "related", title: "Related Pages" },
            ],
          },
          {
            title: "AI Analysis Dialog",
            path: "/docs/dashboard/candidate-card/profile-dialog",
            sections: [
              { id: "overview", title: "Overview" },
              { id: "accessing", title: "Accessing the Dialog" },
              { id: "tabs", title: "Dialog Tabs" },
              { id: "dialog-structure", title: "Dialog Structure" },
              { id: "overview-tab", title: "Overview Tab" },
              {
                id: "requirement-analysis-tab",
                title: "Requirement Analysis Tab",
              },
              { id: "interview-tab", title: "Interview Tab" },
              { id: "resume-data-tab", title: "Resume Data Tab" },
              { id: "email-tab", title: "Email Tab" },
              { id: "actions", title: "Actions" },
              { id: "related", title: "Related Pages" },
            ],
          },
          {
            title: "Shortlisting/Rejecting Candidates",
            path: "/docs/dashboard/candidate-card/shortlisting-rejecting",
            sections: [
              { id: "overview", title: "Overview" },
              { id: "shortlisting", title: "Shortlisting Candidates" },
              { id: "rejecting", title: "Rejecting Candidates" },
              { id: "bulk-actions", title: "Bulk Actions" },
              { id: "related", title: "Related Pages" },
            ],
          },
        ],
      },
      {
        title: "Job Card",
        path: "/docs/dashboard/job-card",
        children: [
          {
            title: "Overview",
            path: "/docs/dashboard/job-card/overview",
            sections: [
              { id: "overview", title: "Overview" },
              { id: "components", title: "Components" },
              { id: "candidates", title: "Candidates" },
              { id: "actions", title: "Available Actions" },
              { id: "related", title: "Related Pages" },
            ],
          },
          {
            title: "Job Details",
            path: "/docs/dashboard/job-card/job-details",
            sections: [
              { id: "overview", title: "Overview" },
              { id: "accessing", title: "Accessing Job Details" },
              { id: "sections", title: "Information Sections" },
              { id: "actions", title: "Editing Requirements" },
              { id: "related", title: "Related Pages" },
            ],
          },
        ],
      },
    ],
  },
  {
    title: "Billing",
    pages: [
      {
        title: "Overview",
        path: "/docs/billing/overview",
        sections: [
          { id: "overview", title: "Overview" },
          { id: "credits", title: "Credits" },
          { id: "payment", title: "Payment Methods" },
          { id: "monitoring", title: "Monitoring Usage" },
          { id: "related", title: "Related Pages" },
        ],
      },
      {
        title: "Cost of Services",
        path: "/docs/billing/cost-of-services",
        sections: [
          { id: "overview", title: "Overview" },
          { id: "credit-pricing", title: "Credit Pricing" },
          { id: "screening-costs", title: "Screening Costs" },
          { id: "subscriptions", title: "Subscriptions" },
          { id: "enterprise", title: "Enterprise Deals" },
          { id: "related", title: "Related Pages" },
        ],
      },
      {
        title: "How to Buy Credits",
        path: "/docs/billing/how-to-buy-credits",
        children: [
          {
            title: "Pay as You Go",
            path: "/docs/billing/how-to-buy-credits/pay-as-you-go",
            sections: [
              { id: "overview", title: "Overview" },
              { id: "related", title: "Related Pages" },
            ],
          },
          {
            title: "Subscriptions",
            path: "/docs/billing/how-to-buy-credits/subscriptions",
            sections: [
              { id: "overview", title: "Overview" },
              { id: "plans", title: "Available Plans" },
              { id: "pricing-tiers", title: "Pricing Tiers" },
              { id: "benefits", title: "Benefits" },
              { id: "managing", title: "Managing Your Subscription" },
              { id: "related", title: "Related Pages" },
            ],
          },
          {
            title: "Auto-Refill",
            path: "/docs/billing/how-to-buy-credits/auto-refill",
            sections: [
              { id: "overview", title: "Overview" },
              { id: "setting-up", title: "Setting Up Auto-Refill" },
              { id: "how-it-works", title: "How It Works" },
              { id: "managing", title: "Managing Auto-Refill" },
              { id: "related", title: "Related Pages" },
            ],
          },
        ],
      },
      {
        title: "Usage and Invoices",
        path: "/docs/billing/usage-and-invoices",
        sections: [
          { id: "overview", title: "Overview" },
          { id: "tracking", title: "Tracking Usage" },
          { id: "invoices", title: "Invoices" },
          { id: "notifications", title: "Notifications" },
          { id: "related", title: "Related Pages" },
        ],
      },
    ],
  },
  {
    title: "Bulk Upload",
    pages: [
      {
        title: "Overview",
        path: "/docs/bulk-upload",
        sections: [
          { id: "overview", title: "Overview" },
          { id: "formats", title: "Supported Formats" },
          { id: "template", title: "Template Files" },
          { id: "process", title: "Upload Process" },
          { id: "validation", title: "Validation" },
          { id: "errors", title: "Handling Errors" },
        ],
      },
    ],
  },
  {
    title: "Candidates Page",
    pages: [
      {
        title: "Overview",
        path: "/docs/candidates-page",
        sections: [
          { id: "overview", title: "Overview" },
          { id: "navigation", title: "Navigation" },
          { id: "filters", title: "Filters" },
          { id: "cards", title: "Candidate Cards" },
          { id: "actions", title: "Actions" },
          { id: "related", title: "Related Pages" },
        ],
      },
    ],
  },
];

/**
 * Helper function to find a page by path in the doc structure
 */
function findPageByPath(path: string): DocPage | undefined {
  for (const section of docStructure) {
    if (!section.pages) continue;

    for (const page of section.pages) {
      if (page.path === path) return page;

      // Check children
      if (page.children) {
        for (const child of page.children) {
          if (child.path === path) return child;
        }
      }
    }
  }
  return undefined;
}

/**
 * Get sections for a specific page by its path.
 * Returns empty array if page not found or has no sections.
 *
 * @param path - The page path, e.g. '/docs/get-started'
 * @returns Array of sections with id and title
 */
export function getPageSections(path: string): PageSection[] {
  const page = findPageByPath(path);
  return page?.sections ?? [];
}

/**
 * Get page title by path.
 * Returns undefined if page not found.
 */
export function getPageTitle(path: string): string | undefined {
  const page = findPageByPath(path);
  return page?.title;
}
