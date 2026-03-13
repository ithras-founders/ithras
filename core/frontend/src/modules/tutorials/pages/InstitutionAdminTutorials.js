import React from 'react';
import htm from 'htm';
import TutorialViewer from '../components/TutorialViewer.js';

const html = htm.bind(React.createElement);

/**
 * INSTITUTION_ADMIN role tutorials
 * Guide for institution-level administrators
 */
const InstitutionAdminTutorials = ({ user }) => {
  const tutorialSections = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      subsections: [
        {
          id: 'overview',
          title: 'Overview',
          description: 'Welcome! As an Institution Admin, you manage your institution\'s placement operations and users.',
          content: `Your capabilities include:

• All Placement Admin features (scoped to your institution)
• Manage users within your institution
• View and edit institution details
• Manage CV templates for your institution
• View audit logs for your institution

You have comprehensive control over your institution's placement operations.`
        }
      ]
    },
    {
      id: 'user-management',
      title: 'User Management',
      subsections: [
        {
          id: 'creating-users',
          title: 'Creating Users',
          description: 'Add new users to your institution',
          content: `You can create users with various roles:

• Students (Candidates)
• Placement Team members
• Placement Admins
• Faculty Observers
• Other institution staff`,
          steps: [
            {
              title: 'Accessing User Management',
              description: 'Open user management interface',
              actions: [
                'Navigate to Institutions & Users',
                'Click "Users" tab',
                'View list of existing users',
                'Click "Add User"'
              ]
            },
            {
              title: 'Filling User Details',
              description: 'Enter user information',
              actions: [
                'User name and email',
                'Select role',
                'Assign to institution (pre-filled)',
                'Add company if recruiter role',
                'Set sector preferences if applicable',
                'Save user'
              ],
              note: 'User will receive login credentials'
            },
            {
              title: 'Managing Existing Users',
              description: 'Update user information',
              actions: [
                'View user list',
                'Click on user to edit',
                'Update details as needed',
                'Change roles if required',
                'Deactivate users if needed'
              ]
            }
          ],
          tips: [
            'Use clear, professional email addresses',
            'Assign appropriate roles',
            'Keep user information updated',
            'Deactivate users who leave',
            'Maintain accurate user records'
          ]
        }
      ]
    },
    {
      id: 'institution-settings',
      title: 'Institution Settings',
      subsections: [
        {
          id: 'managing-institution',
          title: 'Managing Institution Details',
          description: 'View and edit institution information',
          content: `Manage your institution's profile:

• Institution name and details
• Contact information
• Settings and preferences
• Institutional policies`,
          steps: [
            {
              title: 'Viewing Institution Details',
              description: 'Access institution information',
              actions: [
                'Navigate to Institutions & Users',
                'View institution card',
                'See institution details',
                'Check settings'
              ]
            },
            {
              title: 'Editing Institution',
              description: 'Update institution information',
              actions: [
                'Click "Edit Institution"',
                'Update name, contact info',
                'Modify settings',
                'Save changes'
              ],
              note: 'Some changes may require system admin approval'
            }
          ]
        }
      ]
    },
    {
      id: 'audit-logs',
      title: 'Audit Logs',
      subsections: [
        {
          id: 'viewing-logs',
          title: 'Viewing Audit Logs',
          description: 'Monitor institution-level activities',
          content: `Audit logs track important activities:

• User actions
• Policy changes
• Workflow modifications
• Approval decisions
• System events`,
          steps: [
            {
              title: 'Accessing Audit Logs',
              description: 'View activity logs',
              actions: [
                'Navigate to Audit Logs',
                'Select date range',
                'Filter by user or action type',
                'View detailed logs',
                'Export logs if needed'
              ]
            },
            {
              title: 'Understanding Logs',
              description: 'What information is shown',
              actions: [
                'Timestamp of action',
                'User who performed action',
                'Action type and details',
                'Affected resources',
                'Outcome or result'
              ]
            }
          ],
          tips: [
            'Review logs regularly',
            'Monitor for unusual activity',
            'Use filters to find specific events',
            'Export logs for reporting',
            'Keep logs for compliance'
          ]
        }
      ]
    },
    {
      id: 'placement-admin-features',
      title: 'Placement Admin Features',
      subsections: [
        {
          id: 'all-admin-features',
          title: 'All Placement Admin Capabilities',
          description: 'You have access to all Placement Admin features',
          content: `As an Institution Admin, you can perform all Placement Admin functions:

• Create and manage policy templates
• Apply policies to cycles
• Manage workflows
• Review approvals
• Manage CV templates
• Verify CVs

Refer to Placement Admin tutorials for detailed guides on these features.`
        }
      ]
    },
    {
      id: 'faq',
      title: 'Frequently Asked Questions',
      subsections: [
        {
          id: 'common-questions',
          title: 'Common Questions',
          faq: [
            {
              question: 'Can I create users for other institutions?',
              answer: 'No, you can only create and manage users within your own institution.'
            },
            {
              question: 'What if I need to change institution details?',
              answer: 'You can edit most institution details directly. Some changes may require system admin approval.'
            },
            {
              question: 'How long are audit logs retained?',
              answer: 'Logs are retained according to institutional and system policies. Check with system admin for specific retention periods.'
            },
            {
              question: 'Can I delete users?',
              answer: 'You can deactivate users, but deletion may require system admin approval depending on the user\'s role and activity.'
            }
          ]
        }
      ]
    }
  ];

  return html`
    <${TutorialViewer}
      tutorialSections=${tutorialSections}
      role="INSTITUTION_ADMIN"
      user=${user}
    />
  `;
};

export default InstitutionAdminTutorials;
