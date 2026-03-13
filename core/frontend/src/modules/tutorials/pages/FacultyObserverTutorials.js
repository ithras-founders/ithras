import React from 'react';
import htm from 'htm';
import TutorialViewer from '../components/TutorialViewer.js';

const html = htm.bind(React.createElement);

/**
 * FACULTY_OBSERVER role tutorials
 * Guide for faculty members with read-only access
 */
const FacultyObserverTutorials = ({ user }) => {
  const tutorialSections = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      subsections: [
        {
          id: 'overview',
          title: 'Overview',
          description: 'Welcome! As a Faculty Observer, you have read-only access to placement activities.',
          content: `Your capabilities include:

• View dashboard statistics
• View CV templates and verifications
• View governance policies (read-only)
• View placement cycles and statistics
• Monitor placement activities

You can observe and analyze placement activities but cannot make changes.`
        }
      ]
    },
    {
      id: 'dashboard',
      title: 'Dashboard',
      subsections: [
        {
          id: 'viewing-statistics',
          title: 'Viewing Dashboard Statistics',
          description: 'Access placement statistics and overview',
          content: `The dashboard provides key insights:

• Placement statistics
• Active workflows
• Application counts
• Shortlist statistics
• Cycle information`,
          steps: [
            {
              title: 'Accessing Dashboard',
              description: 'View placement overview',
              actions: [
                'Log in to portal',
                'Dashboard loads automatically',
                'View key statistics',
                'See placement activity summary'
              ]
            },
            {
              title: 'Understanding Statistics',
              description: 'What the numbers mean',
              actions: [
                'Total active workflows',
                'Total applications',
                'Shortlist counts',
                'Interview schedules',
                'Offer statistics'
              ]
            }
          ]
        }
      ]
    },
    {
      id: 'cv-templates',
      title: 'CV Templates',
      subsections: [
        {
          id: 'viewing-templates',
          title: 'Viewing CV Templates',
          description: 'See available CV templates',
          content: `You can view CV templates:

• See all institution templates
• View template structure
• See template details
• Check template status`,
          steps: [
            {
              title: 'Accessing Templates',
              description: 'View CV template list',
              actions: [
                'Navigate to CV Templates',
                'View all available templates',
                'See template details',
                'Check activation status'
              ],
              note: 'You can view but not modify templates'
            }
          ]
        },
        {
          id: 'cv-verifications',
          title: 'Viewing CV Verifications',
          description: 'Monitor CV verification status',
          content: `Track CV verification progress:

• See verification statistics
• View verification queue',
• Check verification status',
• Monitor verification trends`,
          steps: [
            {
              title: 'Viewing Verification Status',
              description: 'Monitor CV verifications',
              actions: [
                'Navigate to CV Verification',
                'View verification statistics',
                'See pending verifications count',
                'Check verification trends'
              ],
              note: 'You can view but not approve or reject CVs'
            }
          ]
        }
      ]
    },
    {
      id: 'governance',
      title: 'Governance Policies',
      subsections: [
        {
          id: 'viewing-policies',
          title: 'Viewing Governance Policies',
          description: 'See placement policies (read-only)',
          content: `You can view governance policies:

• Active policies
• Policy templates
• Company tier classifications
• Stage definitions
• Global caps and restrictions`,
          steps: [
            {
              title: 'Accessing Policies',
              description: 'View policy information',
              actions: [
                'Navigate to Governance Flow',
                'View active policy',
                'See policy details',
                'Understand restrictions and rules'
              ],
              note: 'All policy views are read-only'
            },
            {
              title: 'Understanding Policies',
              description: 'What policies define',
              actions: [
                'Company tier classifications',
                'Application and shortlist limits',
                'Stage restrictions',
                'Student status rules',
                'Distribution policies'
              ]
            }
          ]
        }
      ]
    },
    {
      id: 'cycles',
      title: 'Placement Cycles',
      subsections: [
        {
          id: 'viewing-cycles',
          title: 'Viewing Placement Cycles',
          description: 'See cycle information and statistics',
          content: `Monitor placement cycles:

• View all cycles
• See cycle status
• Check cycle statistics
• View cycle timelines`,
          steps: [
            {
              title: 'Accessing Cycles',
              description: 'View cycle information',
              actions: [
                'Navigate to Cycle Control',
                'View all cycles',
                'See cycle details',
                'Check cycle status'
              ],
              note: 'You can view but not modify cycles'
            },
            {
              title: 'Understanding Cycle Data',
              description: 'What cycle information shows',
              actions: [
                'Cycle name and dates',
                'Assigned policies',
                'Workflow counts',
                'Application statistics',
                'Completion status'
              ]
            }
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
              question: 'Why can\'t I make changes?',
              answer: 'Faculty Observer is a read-only role designed for monitoring and analysis. Changes require appropriate admin roles.'
            },
            {
              question: 'Can I export data for analysis?',
              answer: 'Yes, you can export statistics and reports for your analysis. Use the export features available in each section.'
            },
            {
              question: 'How do I request changes or provide feedback?',
              answer: 'Contact your institution\'s Placement Admin or Institution Admin with suggestions or feedback.'
            },
            {
              question: 'What data can I access?',
              answer: 'You can view aggregated statistics, policies, templates, and cycle information. Individual student or company details may be restricted.'
            }
          ]
        }
      ]
    }
  ];

  return html`
    <${TutorialViewer}
      tutorialSections=${tutorialSections}
      role="FACULTY_OBSERVER"
      user=${user}
    />
  `;
};

export default FacultyObserverTutorials;
