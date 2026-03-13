import React from 'react';
import htm from 'htm';
import TutorialViewer from '../components/TutorialViewer.js';

const html = htm.bind(React.createElement);

/**
 * PLACEMENT_ADMIN role tutorials
 * Guide for placement administrators defining governance policies
 */
const PlacementAdminTutorials = ({ user }) => {
  const tutorialSections = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      subsections: [
        {
          id: 'overview',
          title: 'Overview',
          description: 'Welcome! As a Placement Admin, you have all Placement Team capabilities plus governance policy management.',
          content: `Your capabilities include:

• All Placement Team features
• Create and edit governance policy templates
• Define company classification levels
• Define placement stages
• Configure restrictions per stage and company level
• Define student statuses and associated restrictions
• Apply policy templates to placement cycles

You play a key role in defining how the placement process works at your institution.`
        }
      ]
    },
    {
      id: 'governance-flow',
      title: 'Governance Flow',
      subsections: [
        {
          id: 'policy-templates',
          title: 'Creating Policy Templates',
          description: 'Define reusable governance policy templates',
          content: `Policy templates define the rules for placement cycles:

• Company tier classifications
• Stage definitions and restrictions
• Global caps (max shortlists, etc.)
• Student status rules
• Distribution rules`,
          steps: [
            {
              title: 'Accessing Policy Editor',
              description: 'Open the policy creation interface',
              actions: [
                'Navigate to Governance Flow',
                'Click "Create Policy Template" or "Edit Policy"',
                'Policy editor opens',
                'Start defining your policy'
              ]
            },
            {
              title: 'Defining Company Levels',
              description: 'Set up company tier classifications',
              actions: [
                'Add tier levels (Tier 1, Tier 2, Tier 3, Lateral)',
                'Define characteristics for each tier',
                'Set tier-specific restrictions',
                'Configure tier distribution rules'
              ],
              note: 'Company levels determine application and shortlist limits'
            },
            {
              title: 'Defining Stages',
              description: 'Set up placement process stages',
              actions: [
                'Define stage names (Application, Shortlist, Interview, Offer)',
                'Set stage order',
                'Configure stage-specific rules',
                'Define stage transitions'
              ]
            },
            {
              title: 'Setting Global Caps',
              description: 'Define institution-wide limits',
              actions: [
                'Set maximum shortlists per student',
                'Define distribution rules',
                'Set application limits if needed',
                'Configure other global restrictions'
              ]
            },
            {
              title: 'Student Status Rules',
              description: 'Define status-based restrictions',
              actions: [
                'Define student statuses',
                'Set restrictions per status',
                'Configure status transitions',
                'Define status-specific caps'
              ]
            },
            {
              title: 'Saving Policy Template',
              description: 'Save your policy configuration',
              actions: [
                'Review all policy settings',
                'Click "Save as Template"',
                'Provide template name',
                'Template is saved for reuse',
                'Can be applied to multiple cycles'
              ]
            }
          ],
          tips: [
            'Plan policies carefully before creating',
            'Test policies on sample cycles',
            'Document policy rationale',
            'Keep templates updated',
            'Review policies regularly'
          ]
        },
        {
          id: 'applying-policies',
          title: 'Applying Policies to Cycles',
          description: 'Apply policy templates to placement cycles',
          content: `Once you have policy templates, apply them to cycles:

• Select a placement cycle
• Choose a policy template
• Apply template to cycle
• Policy becomes active for that cycle`,
          steps: [
            {
              title: 'Selecting a Cycle',
              description: 'Choose target placement cycle',
              actions: [
                'Navigate to Cycle Control',
                'View available cycles',
                'Select cycle to apply policy',
                'Ensure cycle is in appropriate status'
              ]
            },
            {
              title: 'Applying Template',
              description: 'Apply policy template',
              actions: [
                'Click "Assign Policy"',
                'Select policy template',
                'Review policy details',
                'Confirm application',
                'Policy becomes active'
              ],
              note: 'Policy applies to all workflows in that cycle'
            },
            {
              title: 'Modifying Active Policies',
              description: 'Update policies if needed',
              actions: [
                'Edit policy template',
                'Changes affect future cycles',
                'Active cycles may need special handling',
                'Communicate changes to stakeholders'
              ]
            }
          ]
        },
        {
          id: 'policy-configuration',
          title: 'Policy Configuration Details',
          description: 'Understanding policy components',
          content: `Policies consist of several components:

• Company Levels: Tier classifications
• Stages: Process stages
• Global Caps: Institution-wide limits
• Stage Restrictions: Rules per stage
• Student Statuses: Status-based rules`,
          features: [
            {
              name: 'Company Level Restrictions',
              description: 'Tier-based application and shortlist limits',
              howItWorks: 'Companies are classified into tiers. Each tier has specific limits on how many applications and shortlists students can have. This ensures balanced distribution across company types.',
              useCases: [
                'Ensuring students don\'t apply only to top-tier companies',
                'Balancing opportunities across company types',
                'Managing competitive dynamics'
              ]
            },
            {
              name: 'Stage Restrictions',
              description: 'Rules that apply at each workflow stage',
              howItWorks: 'Each stage can have specific restrictions, such as requiring approvals, limiting progressions, or enforcing certain conditions before moving forward.',
              useCases: [
                'Requiring approvals at critical stages',
                'Enforcing sequential progression',
                'Preventing premature stage advancement'
              ]
            },
            {
              name: 'Global Caps',
              description: 'Institution-wide limits',
              howItWorks: 'Global caps set maximum values across all students, such as maximum shortlists per student. These ensure fair distribution and prevent over-commitment.',
              useCases: [
                'Limiting total shortlists',
                'Controlling application volume',
                'Ensuring fair opportunity distribution'
              ]
            }
          ]
        }
      ]
    },
    {
      id: 'placement-team-features',
      title: 'Placement Team Features',
      subsections: [
        {
          id: 'all-placement-features',
          title: 'All Placement Team Capabilities',
          description: 'You have access to all Placement Team features',
          content: `As a Placement Admin, you can perform all Placement Team functions:

• Manage CV templates
• Verify student CVs
• Create and manage workflows
• Review approval queue
• View master calendar

Refer to Placement Team tutorials for detailed guides on these features.`
        }
      ]
    },
    {
      id: 'best-practices',
      title: 'Best Practices',
      subsections: [
        {
          id: 'policy-design',
          title: 'Policy Design Best Practices',
          description: 'Guidelines for creating effective policies',
          content: `Effective policies balance multiple objectives:

• Fairness: Ensure equal opportunities
• Quality: Maintain high standards
• Efficiency: Streamline processes
• Compliance: Meet institutional requirements`,
          tips: [
            'Start with clear objectives',
            'Involve stakeholders in policy design',
            'Test policies before full implementation',
            'Document policy rationale',
            'Review and update policies regularly',
            'Communicate policies clearly',
            'Monitor policy effectiveness',
            'Be flexible when needed'
          ]
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
              question: 'Can I modify a policy after applying it to a cycle?',
              answer: 'Yes, but changes affect future cycles. Active cycles may need special handling. Consider creating a new policy version instead.'
            },
            {
              question: 'How many policy templates can I create?',
              answer: 'There\'s no limit. Create templates for different scenarios, cycles, or institutional needs.'
            },
            {
              question: 'What happens if I delete a policy template?',
              answer: 'Deletion affects future cycles only. Cycles already using the template remain unaffected.'
            },
            {
              question: 'How do I test a policy before applying it?',
              answer: 'Create a test cycle, apply the policy, and simulate scenarios. Review results before using in production.'
            }
          ]
        }
      ]
    }
  ];

  return html`
    <${TutorialViewer}
      tutorialSections=${tutorialSections}
      role="PLACEMENT_ADMIN"
      user=${user}
    />
  `;
};

export default PlacementAdminTutorials;
