export const tutorialSections = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      subsections: [
        {
          id: 'overview',
          title: 'Overview',
          description: 'Welcome to the Ithras Placement Portal! This guide will help you navigate and use all the features available to candidates.',
          content: `As a candidate (student), you have access to several key features:

• Dashboard: View your placement status, company intelligence, and active recruitment windows
• Active Processes: Browse and apply to open job opportunities
• My Applications: Track application status and stage-by-stage pipeline
• Offers: Manage, accept, or decline job offers with governance-aware workflows
• Master CV: Create and manage your CV with advanced features (reordering, inline editing, multi-CV)
• My Calendar: Manage your timetable blocks and availability
• Cycle Intelligence: Understand placement cycles and governance policies
• Notifications: Stay on top of shortlists, offers, deadlines, and stage progression
• Profile & Settings: Switch profiles, manage preferences, and control sessions

This tutorial will walk you through each feature in detail.`,
          features: [
            {
              name: 'Role Capabilities',
              description: 'Understanding what you can do as a candidate',
              keyPoints: [
                'View active placement processes and cycles',
                'Create and manage CVs using institution-specific templates',
                'Submit applications to open workflows',
                'View application status and progression',
                'Manage personal timetable blocks',
                'View calendar availability',
                'Access cycle intelligence and analytics'
              ]
            }
          ]
        },
        {
          id: 'navigation',
          title: 'Navigation Guide',
          description: 'Learn how to navigate the portal and access different features',
          content: `The portal uses a sidebar navigation system. Here's how to use it:

• The sidebar is always visible on the left side of your screen
• Click on any menu item to navigate to that section
• The active section is highlighted in blue
• Use the notification bell to see important updates
• Your profile information is shown at the bottom of the sidebar`,
          steps: [
            {
              title: 'Understanding the Sidebar',
              description: 'The sidebar contains all navigation options',
              actions: [
                'Dashboard: Your home page with overview statistics and company deep-dive',
                'Active Processes: Browse available job opportunities',
                'My Applications: View all your submitted applications and stage pipeline',
                'Offers: Manage and respond to job offers',
                'Master CV: Create and edit your CV with advanced features',
                'My Calendar: Manage your availability',
                'Cycle Intelligence: View placement cycle information',
                'Notifications: Real-time updates (bell icon)',
                'Profile & Settings: Switch profiles and manage preferences'
              ]
            },
            {
              title: 'Using the Dashboard',
              description: 'The dashboard is your starting point',
              actions: [
                'View your Master Shortlist Registry status',
                'See Tier Enforcement Analysis',
                'Browse Active Recruitment Windows',
                'Access quick links to key features'
              ]
            }
          ]
        }
      ]
    },
    {
      id: 'dashboard',
      title: 'Dashboard',
      subsections: [
        {
          id: 'dashboard-overview',
          title: 'Understanding Your Dashboard',
          description: 'Learn what information is displayed on your dashboard and how to use it',
          content: `Your dashboard provides a comprehensive overview of your placement journey:

• Master Shortlist Registry: Shows how many shortlists you're currently on (e.g., 3/10)
• Tier Enforcement Analysis: Displays your application status across different company tiers
• Active Recruitment Windows: Shows companies currently recruiting

The dashboard updates in real-time as your application status changes.`,
          steps: [
            {
              title: 'Master Shortlist Registry',
              description: 'Track your shortlist count',
              actions: [
                'View your current shortlist count',
                'See the maximum allowed shortlists',
                'Monitor your progress with the visual progress bar'
              ],
              note: 'The shortlist limit is set by your institution\'s governance policy'
            },
            {
              title: 'Tier Enforcement Analysis',
              description: 'Understand tier-based restrictions',
              actions: [
                'View your application count per tier',
                'See tier-specific caps and limits',
                'Understand how tier restrictions affect your applications'
              ]
            },
            {
              title: 'Active Recruitment Windows',
              description: 'Browse available opportunities',
              actions: [
                'Click on a company card to view details',
                'See available job postings',
                'View historical hire information',
                'Apply to open positions'
              ]
            }
          ],
          tips: [
            'Check your dashboard regularly for updates',
            'Monitor your shortlist count to stay within limits',
            'Use tier analysis to plan your application strategy'
          ]
        },
        {
          id: 'company-deep-dive',
          title: 'Company Intelligence Deep Dive',
          description: 'Explore company cards, job descriptions, compensation, and historical hire archives',
          content: `Click any company card to dive into rich company intelligence:

• Full job descriptions with detailed compensation breakdown: Fixed, Variable, ESOPs, Joining Bonus, Performance Bonus
• Historical hire archives: names, years, and roles of past hires (e.g., "Rahul K., 2023, Strategy Associate")
• Sector classification and slot assignment
• Company profile, logo, and recruitment timeline

Example: Apex Consulting (₹35L, Consulting) shows 12 historical hires across 2022–2024.`,
          steps: [
            {
              title: 'Clicking Company Cards',
              description: 'Open the company deep-dive view',
              actions: [
                'From Dashboard or Active Processes, click any company card',
                'View company header with logo and name',
                'See all open job postings for that company',
                'Access historical hire archives and sector info'
              ]
            },
            {
              title: 'Viewing Job Descriptions & Compensation',
              description: 'Understand the full offer structure',
              actions: [
                'Expand a job posting to see full JD',
                'View Fixed salary (e.g., ₹28L base)',
                'View Variable pay (e.g., ₹5L performance-linked)',
                'Check ESOPs, Joining Bonus, Performance Bonus',
                'Note top decile designation if applicable'
              ],
              note: 'Compensation breakdown helps you compare offers accurately'
            },
            {
              title: 'Exploring Historical Hire Archives',
              description: 'See who joined in previous years',
              actions: [
                'Scroll to "Historical Hires" section',
                'View hire name (or anonymized), year, and role',
                'Understand company hiring patterns',
                'Use data to tailor your application'
              ]
            },
            {
              title: 'Sector & Slot Assignment',
              description: 'Understand company classification',
              actions: [
                'See sector (e.g., Consulting, Technology, Finance)',
                'View slot assignment for the cycle',
                'Understand how slots affect your application strategy'
              ]
            }
          ],
          features: [
            {
              name: 'Company Intelligence',
              description: 'Data-driven company insights at a glance',
              keyPoints: [
                'Compensation breakdown: Fixed, Variable, ESOPs, Joining Bonus, Performance Bonus',
                'Historical hire archives with name, year, and role',
                'Sector classification and slot assignment',
                'Real-time JD status and opening dates'
              ]
            }
          ]
        }
      ]
    },
    {
      id: 'active-processes',
      title: 'Active Processes',
      subsections: [
        {
          id: 'browsing-opportunities',
          title: 'Browsing Job Opportunities',
          description: 'How to find and explore available job postings',
          content: `The Active Processes section shows all companies currently recruiting. You can:

• Browse companies by clicking on their cards
• View detailed job descriptions (JDs)
• See compensation details and requirements
• Check application deadlines
• View company historical hire data`,
          steps: [
            {
              title: 'Viewing Company Details',
              description: 'Explore a company\'s opportunities',
              actions: [
                'Click on a company card from the dashboard',
                'View the company profile and logo',
                'See all available job postings for that company',
                'Review historical hires from previous years'
              ]
            },
            {
              title: 'Understanding Job Postings',
              description: 'What information is shown for each job',
              actions: [
                'Job title and role description',
                'Sector and slot information',
                'Fixed and variable compensation details',
                'ESOPs, joining bonus, and performance bonus',
                'Top decile designation',
                'Opening date and JD status'
              ]
            },
            {
              title: 'Applying to a Position',
              description: 'Submit your application',
              actions: [
                'Click "Apply Now" on a job posting',
                'Select your verified CV',
                'Review application details',
                'Submit your application',
                'Track status in My Applications'
              ],
              note: 'You can only apply with a verified CV'
            }
          ],
          tips: [
            'Read job descriptions carefully before applying',
            'Check compensation details and requirements',
            'Review company historical data to understand their hiring patterns',
            'Apply early as positions may fill quickly'
          ]
        }
      ]
    },
    {
      id: 'applications',
      title: 'My Applications',
      subsections: [
        {
          id: 'tracking-applications',
          title: 'Tracking Application Status',
          description: 'Monitor your applications and their progression through workflow stages',
          content: `The My Applications section shows all applications you've submitted:

• Application status (SUBMITTED, SHORTLISTED, INTERVIEW, OFFER, etc.)
• Current workflow stage
• Company and job details
• Application timeline
• Next steps and actions required`,
          steps: [
            {
              title: 'Viewing Your Applications',
              description: 'See all submitted applications',
              actions: [
                'Navigate to "My Applications" from the sidebar',
                'View list of all your applications',
                'See status for each application',
                'Click on an application for detailed view'
              ]
            },
            {
              title: 'Understanding Application Status',
              description: 'What each status means',
              actions: [
                'SUBMITTED: Your application has been received',
                'SHORTLISTED: You\'ve been selected for the next stage',
                'INTERVIEW: Company wants to interview you',
                'OFFER: You\'ve received a job offer',
                'REJECTED: Application was not successful'
              ]
            },
            {
              title: 'Workflow Stages',
              description: 'Understanding the progression',
              actions: [
                'Applications move through predefined workflow stages',
                'Each stage may require different actions',
                'You\'ll receive notifications at each stage transition',
                'Track your progress through the workflow'
              ]
            }
          ],
          tips: [
            'Check your applications regularly for status updates',
            'Respond promptly to interview requests',
            'Keep your CV updated for better chances',
            'Don\'t apply to too many positions - quality over quantity'
          ]
        },
        {
          id: 'stage-pipeline',
          title: 'Stage-by-Stage Pipeline',
          description: 'Visualize and track your application progression through each workflow stage',
          content: `Every application moves through a defined pipeline. Expand any application card to see:

• Full stage progression with visual indicators (green checkmarks for completed, pulsing highlight for current, gray for upcoming)
• Timestamps for when you entered each stage
• Withdrawal capability if you need to pull out
• Clear next steps based on your current stage

Example: Apex Consulting (₹35L, Consulting) shows: Applied ✓ → Shortlisted ✓ → Interview (current) → Offer (upcoming)`,
          steps: [
            {
              title: 'Expanding Application Cards',
              description: 'Reveal the full pipeline view',
              actions: [
                'Navigate to My Applications',
                'Click or expand any application card',
                'View the horizontal stage pipeline',
                'See your position in the workflow at a glance'
              ]
            },
            {
              title: 'Reading the Visual Pipeline',
              description: 'Understand stage indicators',
              actions: [
                'Green checkmarks: Stages you\'ve completed (e.g., Applied, Shortlisted)',
                'Pulsing highlight: Your current stage (e.g., Interview)',
                'Gray icons: Upcoming stages (e.g., Offer, Onboarding)',
                'Hover for stage-specific timestamps'
              ],
              note: 'Each stage shows when you entered it'
            },
            {
              title: 'Withdrawing an Application',
              description: 'Pull out when needed',
              actions: [
                'Expand the application card',
                'Click "Withdraw" (available until offer stage)',
                'Confirm withdrawal',
                'Application moves to WITHDRAWN status'
              ],
              note: 'Withdrawal may free up shortlist slots per governance'
            }
          ],
          tips: [
            'Use the pipeline to prioritize follow-ups—focus on applications in interview stage',
            'Stage timestamps help you track response times and follow up appropriately',
            'Withdraw early if you\'re no longer interested to free slots for others'
          ]
        }
      ]
    },
    {
      id: 'offers',
      title: 'Offers',
      subsections: [
        {
          id: 'managing-offers',
          title: 'Managing Offers',
          description: 'Accept, decline, and manage job offers with governance-aware workflows',
          content: `When you receive an offer, the Offers section becomes your command center:

• Offer cards show company, role, compensation (e.g., Apex Consulting, ₹35L CTC), and deadline
• Accept/Decline workflow with confirmation and audit trail
• Multiple offer handling: compare side-by-side, prioritize, and decide within deadlines
• Governance impact: accepting one offer may auto-decline others or affect shortlist slots

Example: "3/15 shortlists used, 2 offers pending—accept one by Mar 15 to comply with policy"`,
          steps: [
            {
              title: 'Viewing Offer Cards',
              description: 'Understand what each offer displays',
              actions: [
                'Navigate to Offers (or My Applications → Offer filter)',
                'See company logo, name, and role (e.g., "Strategy Associate, Apex Consulting")',
                'View compensation breakdown: Fixed, Variable, ESOPs, Joining Bonus',
                'Check offer deadline prominently displayed'
              ]
            },
            {
              title: 'Accept/Decline Workflow',
              description: 'Respond to offers correctly',
              actions: [
                'Click "Accept" or "Decline" on the offer card',
                'Review confirmation modal with offer summary',
                'Confirm your decision',
                'Receive confirmation and next steps (e.g., document signing)'
              ],
              note: 'Decisions are logged for audit and governance'
            },
            {
              title: 'Multiple Offer Handling',
              description: 'Manage competing offers',
              actions: [
                'Compare offers side-by-side using the offer cards',
                'Note deadlines—respond before they expire',
                'Prioritize based on role, compensation, and fit',
                'Accept one; decline others to stay compliant'
              ]
            },
            {
              title: 'Offer Deadlines',
              description: 'Never miss a deadline',
              actions: [
                'Each offer card shows a clear deadline (e.g., "Respond by Mar 15, 11:59 PM")',
                'Set personal reminders if needed',
                'Late responses may result in offer lapse'
              ]
            }
          ],
          tips: [
            'Read the full offer letter before accepting—check variable pay, joining bonus, and ESOPs',
            'If you have multiple offers, communicate with placement team for guidance',
            'Decline offers you won\'t accept promptly to help companies move to waitlist candidates'
          ],
          features: [
            {
              name: 'Offer Governance',
              description: 'How governance affects your offer decisions',
              keyPoints: [
                'Accepting an offer may auto-release your shortlists per policy',
                'Some institutions require accepting the first offer above a certain tier',
                'Declining after acceptance may have consequences—check your cycle policy',
                'Offer acceptance is audited for fairness and compliance'
              ]
            }
          ]
        }
      ]
    },
    {
      id: 'master-cv',
      title: 'Master CV',
      subsections: [
        {
          id: 'creating-cv',
          title: 'Creating Your CV',
          description: 'Build your CV using institution-approved templates',
          content: `Your Master CV is your primary document for applications. You can:

• Use institution-specific CV templates
• Fill in your information using structured forms
• Upload supporting documents
• Generate PDF versions
• Submit for verification`,
          steps: [
            {
              title: 'Selecting a Template',
              description: 'Choose the right CV template',
              actions: [
                'Navigate to "Master CV" from the sidebar',
                'View available CV templates for your institution',
                'Select a template that matches your needs',
                'Preview the template structure'
              ]
            },
            {
              title: 'Filling CV Information',
              description: 'Complete your CV details',
              actions: [
                'Fill in personal information',
                'Add educational background',
                'List work experience and internships',
                'Include skills and certifications',
                'Add projects and achievements',
                'Upload supporting documents'
              ],
              note: 'All fields marked with * are required'
            },
            {
              title: 'Submitting for Verification',
              description: 'Get your CV verified by placement team',
              actions: [
                'Review all information for accuracy',
                'Click "Submit for Verification"',
                'Wait for placement team review',
                'Address any feedback or corrections',
                'Once verified, your CV can be used for applications'
              ],
              note: 'Only verified CVs can be used for applications'
            }
          ],
          features: [
            {
              name: 'CV Templates',
              description: 'Institution-specific templates ensure consistency',
              howItWorks: 'Your institution provides standardized CV templates that match their requirements. These templates are analyzed using AI to extract structure and fields, making it easy to fill in your information.',
              useCases: [
                'Creating your first CV',
                'Updating existing CV with new information',
                'Creating multiple versions for different roles'
              ]
            },
            {
              name: 'CV Verification',
              description: 'Placement team reviews and verifies CVs',
              howItWorks: 'After you submit your CV, the placement team reviews it for accuracy, completeness, and compliance with institutional standards. Once verified, you can use it for applications.',
              useCases: [
                'Ensuring CV quality',
                'Maintaining institutional standards',
                'Preventing errors in applications'
              ]
            }
          ],
          tips: [
            'Keep your CV updated with latest information',
            'Use action verbs and quantify achievements',
            'Tailor your CV to match job requirements',
            'Proofread carefully before submission',
            'Respond promptly to verification feedback'
          ]
        },
        {
          id: 'managing-cv',
          title: 'Managing Your CV',
          description: 'Update and maintain your CV',
          content: `You can update your CV at any time, but note:

• Changes to verified CVs require re-verification
• You can have multiple CV versions
• Only verified CVs can be used for applications
• Keep your CV current with latest achievements`,
          steps: [
            {
              title: 'Updating CV Information',
              description: 'Make changes to your CV',
              actions: [
                'Navigate to Master CV',
                'Click "Edit" on your CV',
                'Update relevant sections',
                'Save changes',
                'Resubmit for verification if needed'
              ]
            },
            {
              title: 'Creating Multiple Versions',
              description: 'Maintain different CV versions',
              actions: [
                'Create a new CV from template',
                'Customize for specific roles or sectors',
                'Keep original version intact',
                'Use appropriate version for each application'
              ]
            }
          ]
        },
        {
          id: 'cv-advanced',
          title: 'Advanced CV Features',
          description: 'Drag-and-drop reordering, inline editing, profile photo, PDF export, and multi-CV portfolio',
          content: `Master CV goes beyond basic forms with power-user features:

• Drag-and-drop section reordering: Move Education above Experience, or Projects before Skills
• Inline field editing: Edit text, dates, numbers, bullets, and dropdowns directly in the preview
• Profile photo upload: Add a professional headshot
• PDF preview and download: See exactly how recruiters will view your CV
• Multi-CV portfolio: Maintain multiple CVs (e.g., Consulting vs Tech) and choose per application`,
          steps: [
            {
              title: 'Drag-and-Drop Section Reordering',
              description: 'Customize CV structure',
              actions: [
                'In Master CV edit mode, grab a section handle (e.g., "Work Experience")',
                'Drag to new position (e.g., above "Education")',
                'Drop to reorder—changes reflect in preview immediately',
                'Save to persist the new order'
              ],
              note: 'Section order affects how recruiters scan your CV'
            },
            {
              title: 'Inline Field Editing',
              description: 'Edit directly in the preview',
              actions: [
                'Click any field in the CV preview (text, date, number, bullet, dropdown)',
                'Edit inline—no need to switch to form view',
                'Use dropdowns for standardized fields (e.g., degree type)',
                'Add/remove bullets in list fields'
              ],
              note: 'Changes auto-save or require explicit Save depending on configuration'
            },
            {
              title: 'Profile Photo Upload',
              description: 'Add a professional headshot',
              actions: [
                'Click the profile photo placeholder or "Upload Photo"',
                'Select an image (JPG/PNG, recommended size)',
                'Crop or adjust if needed',
                'Photo appears in CV preview and generated PDF'
              ]
            },
            {
              title: 'PDF Preview & Download',
              description: 'See and share your CV as PDF',
              actions: [
                'Click "Preview PDF" to see recruiter view',
                'Download PDF for offline sharing',
                'Verify formatting before submitting applications',
                'Use for external applications if allowed'
              ]
            },
            {
              title: 'Multi-CV Portfolio Management',
              description: 'Maintain multiple CV versions',
              actions: [
                'Create multiple CVs from templates (e.g., "Consulting CV", "Tech CV")',
                'Switch between CVs via dropdown or list',
                'Select the appropriate CV when applying to each role',
                'Keep each version tailored to different sectors'
              ]
            }
          ],
          features: [
            {
              name: 'Inline Editing',
              description: 'Edit fields directly in the CV preview',
              keyPoints: [
                'Text, dates, numbers, bullets, and dropdowns editable inline',
                'No need to switch between form and preview',
                'Real-time updates as you type'
              ]
            },
            {
              name: 'Multi-CV Portfolio',
              description: 'Manage multiple CV versions',
              keyPoints: [
                'Create Consulting, Tech, Finance, or role-specific CVs',
                'Select the right CV per application',
                'Each CV can have its own verification status'
              ]
            }
          ],
          tips: [
            'Reorder sections to highlight your strongest areas first',
            'Use inline editing for quick tweaks without losing context',
            'Keep a clean, professional profile photo',
            'Preview PDF before every application to catch formatting issues'
          ]
        }
      ]
    },
    {
      id: 'calendar',
      title: 'My Calendar',
      subsections: [
        {
          id: 'managing-availability',
          title: 'Managing Your Availability',
          description: 'Set your timetable blocks and availability for interviews',
          content: `Your calendar helps companies schedule interviews and engagements:

• Set timetable blocks when you're unavailable
• View your availability status
• Receive calendar invitations from companies
• Manage interview schedules`,
          steps: [
            {
              title: 'Setting Timetable Blocks',
              description: 'Mark times when you\'re unavailable',
              actions: [
                'Navigate to "My Calendar"',
                'Click "Add Time Block"',
                'Select date and time range',
                'Add reason (classes, exams, etc.)',
                'Save the block'
              ],
              note: 'Companies can see your availability but not the reason'
            },
            {
              title: 'Viewing Availability',
              description: 'See when you\'re available',
              actions: [
                'View calendar grid showing your schedule',
                'See blocked vs available times',
                'Check upcoming interviews',
                'Review availability for specific dates'
              ]
            },
            {
              title: 'Managing Interviews',
              description: 'Handle interview invitations',
              actions: [
                'Receive notification for interview requests',
                'View interview details (company, role, time)',
                'Accept or request rescheduling',
                'Add to your calendar',
                'Receive reminders before interviews'
              ]
            }
          ],
          tips: [
            'Keep your calendar updated regularly',
            'Block times for classes and exams early',
            'Respond to interview requests promptly',
            'Leave buffer time between interviews',
            'Sync with your personal calendar if needed'
          ]
        }
      ]
    },
    {
      id: 'cycle-intelligence',
      title: 'Cycle Intelligence',
      subsections: [
        {
          id: 'understanding-cycles',
          title: 'Understanding Placement Cycles',
          description: 'Learn about placement cycles and governance policies',
          content: `Cycle Intelligence provides insights into:

• Current placement cycle information
• Governance policies and restrictions
• Company tiers and classifications
• Application limits and caps
• Historical cycle data`,
          steps: [
            {
              title: 'Viewing Cycle Information',
              description: 'Access cycle details',
              actions: [
                'Navigate to "Cycle Intelligence"',
                'View current cycle name and dates',
                'See cycle status (DRAFT, ACTIVE, CLOSED)',
                'View assigned policy details'
              ]
            },
            {
              title: 'Understanding Governance Policies',
              description: 'Learn about placement rules',
              actions: [
                'View global caps (max shortlists, etc.)',
                'Understand tier-based restrictions',
                'See stage-specific rules',
                'Check student status restrictions'
              ],
              note: 'Policies are set by your institution\'s placement admin'
            },
            {
              title: 'Using Intelligence Data',
              description: 'Make informed decisions',
              actions: [
                'Plan your application strategy',
                'Understand tier limitations',
                'Track your progress against caps',
                'Make data-driven application choices'
              ]
            }
          ],
          tips: [
            'Review cycle policies before applying',
            'Understand tier restrictions to plan effectively',
            'Monitor your progress against caps',
            'Use historical data to understand patterns'
          ]
        }
      ]
    },
    {
      id: 'notifications',
      title: 'Notifications',
      subsections: [
        {
          id: 'notification-center',
          title: 'Notification Center',
          description: 'Stay on top of shortlists, offers, deadlines, CV updates, and stage progression',
          content: `The Notification Center keeps you informed in real time:

• Shortlist: "You've been shortlisted for Strategy Associate at Apex Consulting"
• Offer: "You've received an offer from Apex Consulting—respond by Mar 15"
• Deadline: "Offer deadline in 24 hours"
• CV update: "Your CV has been verified" or "CV verification feedback"
• Stage progression: "Your application moved to Interview stage"

The notification bell shows unread count; notifications drive your next actions.`,
          steps: [
            {
              title: 'Accessing the Notification Center',
              description: 'Open your notifications',
              actions: [
                'Click the notification bell in the sidebar or header',
                'View list of recent notifications',
                'See unread count badge (e.g., "5" unread)',
                'Mark as read by clicking or opening'
              ]
            },
            {
              title: 'Notification Types',
              description: 'What each type means',
              actions: [
                'Shortlist: You\'ve been selected—check dashboard and respond',
                'Offer: New offer received—review and accept/decline',
                'Deadline: Time-sensitive—act before expiry',
                'CV update: Verification status or feedback',
                'Stage progression: Application moved to next stage'
              ],
              note: 'Each notification links to the relevant page for action'
            },
            {
              title: 'How Notifications Drive Actions',
              description: 'From notification to action',
              actions: [
                'Click a shortlist notification → Go to My Applications or Dashboard',
                'Click an offer notification → Go to Offers to accept/decline',
                'Click a deadline notification → Respond before expiry',
                'Click CV update → Go to Master CV to address feedback',
                'Click stage progression → View pipeline in My Applications'
              ]
            }
          ],
          tips: [
            'Check the notification bell daily—critical updates appear there first',
            'Act on deadline notifications immediately to avoid missing offers',
            'Use read/unread to track what you\'ve addressed',
            'Enable email preferences to get critical notifications by email'
          ]
        }
      ]
    },
    {
      id: 'workflows',
      title: 'Application Workflows',
      subsections: [
        {
          id: 'submission-workflow',
          title: 'Application Submission Workflow',
          description: 'Step-by-step guide to submitting applications',
          content: `The application process follows a structured workflow:

1. Browse opportunities
2. Select a position
3. Choose your verified CV
4. Submit application
5. Track status through stages
6. Respond to shortlists/interviews
7. Receive offers`,
          steps: [
            {
              title: 'Step 1: Find Opportunities',
              description: 'Browse available positions',
              actions: [
                'Go to Active Processes',
                'Browse company cards',
                'Click on companies of interest',
                'Review job postings'
              ]
            },
            {
              title: 'Step 2: Review Job Details',
              description: 'Understand the position',
              actions: [
                'Read job description carefully',
                'Check compensation details',
                'Review requirements',
                'Verify you meet criteria'
              ]
            },
            {
              title: 'Step 3: Prepare Your CV',
              description: 'Ensure CV is ready',
              actions: [
                'Check CV is verified',
                'Update if needed',
                'Ensure information is current',
                'Select appropriate CV version'
              ]
            },
            {
              title: 'Step 4: Submit Application',
              description: 'Apply to the position',
              actions: [
                'Click "Apply Now"',
                'Select your verified CV',
                'Review application summary',
                'Confirm and submit'
              ]
            },
            {
              title: 'Step 5: Track Progress',
              description: 'Monitor application status',
              actions: [
                'Check My Applications regularly',
                'Respond to notifications',
                'Update status as needed',
                'Follow up if required'
              ]
            }
          ],
          tips: [
            'Apply early for better chances',
            'Tailor your CV to match job requirements',
            'Don\'t apply to too many positions',
            'Focus on quality applications',
            'Respond promptly to all communications'
          ]
        },
        {
          id: 'shortlist-management',
          title: 'Managing Shortlists',
          description: 'Understanding and managing shortlist status',
          content: `When companies shortlist you:

• You'll receive a notification
• Shortlist appears in your dashboard
• You can accept, hold, or drop shortlists
• Status affects your application count
• Multiple shortlists count toward your cap`,
          steps: [
            {
              title: 'Receiving Shortlists',
              description: 'When you\'re shortlisted',
              actions: [
                'Receive notification',
                'View shortlist in dashboard',
                'See company and role details',
                'Check shortlist status'
              ]
            },
            {
              title: 'Responding to Shortlists',
              description: 'Manage your shortlist status',
              actions: [
                'ACCEPT: Confirm interest and proceed',
                'HOLD: Keep option open but don\'t commit',
                'DROP: Decline the shortlist',
                'Monitor impact on your shortlist count'
              ],
              note: 'Your response affects your application strategy'
            },
            {
              title: 'Understanding Shortlist Limits',
              description: 'Governance restrictions',
              actions: [
                'Check your current shortlist count',
                'Understand maximum allowed',
                'Plan responses to stay within limits',
                'Prioritize based on preferences'
              ]
            }
          ]
        }
      ]
    },
    {
      id: 'profile-settings',
      title: 'Profile & Settings',
      subsections: [
        {
          id: 'profile-management',
          title: 'Profile & Settings',
          description: 'Switch profiles, manage personal info, email preferences, and sessions',
          content: `Profile & Settings lets you control your account and preferences:

• Profile switching: If you belong to multiple institutions or programs, switch between them
• Personal information: Update name, email, phone, and other details
• Email preferences: Choose which notifications to receive by email (offers, deadlines, shortlists)
• Session management: View active sessions and sign out from other devices`,
          steps: [
            {
              title: 'Profile Switching',
              description: 'Switch between institutions or programs',
              actions: [
                'Click your profile/avatar in the sidebar or header',
                'Select "Switch Profile" or "Change Institution"',
                'Choose from available profiles (e.g., "MBA 2025", "B.Tech 2025")',
                'Portal reloads with context for the selected profile'
              ],
              note: 'Only visible if you have access to multiple programs'
            },
            {
              title: 'Personal Information Management',
              description: 'Update your details',
              actions: [
                'Navigate to Profile & Settings',
                'Edit name, email, phone, and other fields',
                'Save changes',
                'Some fields may require verification'
              ]
            },
            {
              title: 'Email Preferences',
              description: 'Control notification emails',
              actions: [
                'Go to Profile & Settings → Notifications or Email Preferences',
                'Toggle emails for: Offers, Deadlines, Shortlists, CV updates, Stage progression',
                'Save preferences',
                'Critical notifications may still be sent regardless of settings'
              ]
            },
            {
              title: 'Session Management',
              description: 'Manage active sessions',
              actions: [
                'View list of active sessions (device, location, last active)',
                'Sign out from specific devices',
                'Sign out from all other sessions',
                'Change password if needed'
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
          description: 'Answers to frequently asked questions',
          faq: [
            {
              question: 'How many applications can I submit?',
              answer: 'There\'s no hard limit on applications, but you should focus on quality. However, you can only be on a limited number of shortlists as per your institution\'s governance policy.'
            },
            {
              question: 'Can I edit my application after submission?',
              answer: 'No, once submitted, applications cannot be edited. However, you can withdraw an application if needed.'
            },
            {
              question: 'What happens if my CV is rejected?',
              answer: 'You\'ll receive feedback from the placement team. Address the issues and resubmit for verification.'
            },
            {
              question: 'How do I know if a company has viewed my application?',
              answer: 'You\'ll receive notifications when your application status changes, such as when you\'re shortlisted or moved to the next stage.'
            },
            {
              question: 'Can I apply to multiple positions at the same company?',
              answer: 'Yes, if the company has multiple open positions, you can apply to each one separately.'
            },
            {
              question: 'What should I do if I receive multiple offers?',
              answer: 'Review each offer carefully, consider your preferences, and respond according to your institution\'s policies. You may need to accept one and decline others.'
            }
          ]
        }
      ]
    }
  ];
