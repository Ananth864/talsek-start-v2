import { DocLink } from '#/components/documentation/DocLink';
import { DocumentationPage } from '#/components/documentation/DocumentationPage';
import { getPageSections } from '#/components/documentation/docStructure';

export default function AddTeamMembers() {
  return (
    <DocumentationPage
      title="Add Team Members"
      sections={getPageSections('/docs/get-started/add-team-members')}
    >
      <section id="accessing-team" className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 scroll-mt-24">Accessing Team Settings</h2>
        <p className="text-muted-foreground leading-relaxed mb-4">
          Manage your team members, roles, and permissions from the Team page in your dashboard.
        </p>
        <p className="text-muted-foreground leading-relaxed">
          Navigate to the <DocLink to="/users">Team</DocLink> page to view and manage your team.
        </p>
      </section>

      <section id="inviting-members" className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 scroll-mt-24">Inviting New Team Members</h2>
        <p className="text-muted-foreground leading-relaxed mb-4">
          Add team members to collaborate on hiring activities. Team members can help you screen candidates, conduct interviews, and manage jobs.
        </p>
        <div className="border-l-4 border-[#4366B0] pl-4 mb-4">
          <h3 className="font-semibold mb-2">How to Invite</h3>
          <ol className="list-decimal list-inside space-y-2 text-muted-foreground text-sm">
            <li>Go to the <DocLink to="/users">Team</DocLink> page</li>
            <li>Click the <strong className="text-foreground">Invite Member</strong> button in the top-right corner</li>
            <li>Enter the member's email address</li>
            <li>Select their role (Admin or Member)</li>
            <li>Select their permissions</li>
            <li>Click the <strong className="text-foreground">Send Invite</strong> button</li>
          </ol>
        </div>
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 mb-4">
          <p className="text-sm text-muted-foreground">
            <strong>Note:</strong> Only admins can invite new team members.
          </p>
        </div>
        <p className="text-muted-foreground text-sm">
          The invited member will receive an email with a link to set up their password and access the workspace.
        </p>
      </section>

      <section id="managing-team" className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 scroll-mt-24">Managing Team</h2>
        <p className="text-muted-foreground leading-relaxed mb-6">
          The Team page displays all members in your organization with their details and status.
        </p>
        
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#4366B0]/10 text-[#4366B0] text-sm font-semibold">1</span>
              Users Table
            </h3>
            <p className="text-muted-foreground text-sm mb-2">
              The table shows the following columns for each member:
            </p>
            <ul className="space-y-1 text-muted-foreground text-sm">
              <li><strong className="text-foreground">Name</strong> — Member's full name</li>
              <li><strong className="text-foreground">Email</strong> — Member's email address</li>
              <li><strong className="text-foreground">Role</strong> — Admin or Member role badge</li>
              <li><strong className="text-foreground">Status</strong> — Pending password setup or Active</li>
              <li><strong className="text-foreground">Actions</strong> — Manage button to view member details</li>
            </ul>
          </div>

          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#4366B0]/10 text-[#4366B0] text-sm font-semibold">2</span>
              Manage User
            </h3>
            <p className="text-muted-foreground text-sm mb-2">
              Click the <strong className="text-foreground">Manage</strong> button in the Actions column to view a member's details and adjust their permissions.
            </p>
            <p className="text-muted-foreground text-sm mb-2">
              The following permissions can be toggled:
            </p>
            <ul className="space-y-1 text-muted-foreground text-sm">
              <li><strong className="text-foreground">Create Jobs</strong> — Allows member to create and publish new job listings</li>
              <li><strong className="text-foreground">Send Reachouts</strong> — Grants access to send interview and final reachout messages</li>
              <li><strong className="text-foreground">Manage Templates</strong> — Enables editing interview and reachout communication templates</li>
              <li><strong className="text-foreground">Customize Forms</strong> — Allows editing job application form configurations</li>
            </ul>
          </div>
        </div>
      </section>

      <section id="user-roles" className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 scroll-mt-24">User Roles</h2>
        <p className="text-muted-foreground leading-relaxed mb-4">
          Team members have different access levels based on their role. Each role determines what actions they can perform:
        </p>

        <div className="space-y-4">
          <div className="border-l-4 border-[#4366B0] pl-4">
            <h3 className="font-semibold mb-2">Admin</h3>
            <p className="text-muted-foreground mb-2">
              Full access to all features including billing, team management, and settings.
            </p>
            <p className="text-sm text-muted-foreground">
              Can invite new members, manage subscriptions, configure company settings, and remove team members.
            </p>
          </div>

          <div className="border-l-4 border-[#4366B0] pl-4">
            <h3 className="font-semibold mb-2">Member</h3>
            <p className="text-muted-foreground mb-2">
              Access to view candidates, conduct screenings, and manage jobs for assigned positions if granted permission in users page.
            </p>
            <p className="text-sm text-muted-foreground">
              Cannot access billing, invite new team members, or remove team members.
            </p>
          </div>
        </div>
      </section>

      <div className="mb-12 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
        <p className="text-sm text-muted-foreground">
          <strong>Note:</strong> Click the <strong className="text-foreground">Save Changes</strong> button after adjusting permissions to apply the changes.
        </p>
      </div>

      <section id="resending-invites" className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 scroll-mt-24">Resending Invites</h2>
        <p className="text-muted-foreground leading-relaxed mb-4">
          If a team member hasn't set up their password, you can resend the invite email.
        </p>
        <div className="border-l-4 border-[#4366B0] pl-4">
          <h3 className="font-semibold mb-2">How to Resend</h3>
          <ol className="list-decimal list-inside space-y-2 text-muted-foreground text-sm">
            <li>Go to the <DocLink to="/users">Team</DocLink> page</li>
            <li>Click the <strong className="text-foreground">Manage</strong> button for the pending member</li>
            <li>Click the <strong className="text-foreground">Resend invite</strong> button in the top-right corner</li>
          </ol>
        </div>
        <p className="text-muted-foreground text-sm mt-4">
          The Resend invite button is only visible for members with <strong className="text-foreground">Pending password setup</strong> status.
        </p>
      </section>

      <section id="real-time-updates" className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 scroll-mt-24">Real-Time Updates</h2>
        <p className="text-muted-foreground leading-relaxed">
          The Team page updates automatically when changes occur. New invites, status changes, and permission updates appear instantly without needing to refresh the page.
        </p>
      </section>

      <section id="related" className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 scroll-mt-24">Related Pages</h2>
        <div className="space-y-3">
          <p>
            <DocLink to="/docs/get-started">Get Started Overview</DocLink> — Back to getting started guide
          </p>
          <p>
            <DocLink to="/docs/get-started/customize-application-form">Customize Application Form</DocLink> — Configure your application form fields
          </p>
          <p>
            <DocLink to="/docs/get-started/set-reachout-template">Set Reachout Template</DocLink> — Create email templates for candidate outreach
          </p>
          <p>
            <DocLink to="/docs/create-a-job">Create a Job</DocLink> — Set up your first job posting
          </p>
        </div>
      </section>
    </DocumentationPage>
  );
}
