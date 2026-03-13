export const tutorialSections = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      subsections: [
        {
          id: 'overview',
          title: 'Overview',
          description: 'Welcome to the Ithras Placement Portal for Recruiters! Learn how to manage your recruitment processes.',
          content: `As a recruiter, you can:

• View and manage assigned workflows
• Submit job descriptions (JDs) and compensation details
• View applications and download CVs
• Select candidates for progression (shortlists)
• Book calendar slots for interviews
• Create and track offers through acceptance
• View aggregated student availability
• Track workflow status and approvals

All your actions require placement team approval to ensure compliance with institutional policies.`,
          features: [
            {
              name: 'Privacy Protection',
              description: 'Student privacy is maintained throughout the process',
              howItWorks: 'You can see application counts and availability statistics, but individual student names are only visible after shortlisting and with proper approvals.',
              keyPoints: [
                'See aggregated availability counts',
                'Individual names only after shortlisting',
                'All actions are logged and auditable'
              ]
            }
          ]
        },
        {
          id: 'navigation',
          title: 'Navigation Guide',
          description: 'Understanding the recruiter portal navigation',
          content: `The recruiter portal has the following sections:

• Dashboard: Overview of your company's recruitment status
• Workflows: Manage assigned workflows and job postings
• Applications: View and manage candidate applications
• Offer Management: Create offers, track acceptance, view analytics
• Request Approvals: Review and approve placement team requests
• Multi-Institution: Manage pipelines across IIM Calcutta, IIM Ahmedabad, Lateral Hiring
• Calendar: Book interview slots and manage schedules
• Notifications: JD approvals, new applications, stage progressions, scheduling updates
• Institutional Registry: Browse institutional partners`,
          steps: [
            {
              title: 'Accessing Your Portal',
              description: 'Log in and navigate',
              actions: [
                'Log in with your recruiter credentials',
                'View your company dashboard',
                'See assigned workflows',
                'Access different sections from sidebar'
              ]
            }
          ]
        },
        {
          id: 'context-intelligence',
          title: 'Context Intelligence',
          description: 'Data-driven recruiting with institution-level analytics and historical insights',
          content: `Context Intelligence surfaces actionable data to inform your recruiting decisions:

• Institution-level analytics: See historical hire counts, median compensation bands, and sector distribution for each partner institution
• Example: IIM Ahmedabad — 47 hires last year, median CTC ₹32L, top sectors: Consulting (38%), Finance (29%), Tech (22%)
• Data-driven decisions: Align your JD and compensation with institutional benchmarks
• Pipeline visibility: Understand which institutions yield best fit for your roles`,
          steps: [
            {
              title: 'Using Institution Analytics',
              description: 'Leverage historical data for recruiting strategy',
              actions: [
                'Navigate to Institutional Registry or Dashboard',
                'View per-institution hire counts and compensation trends',
                'Compare median CTC across institutions',
                'Review sector distribution (Consulting, Finance, Tech, etc.)',
                'Align your JD and offer structure with institutional norms'
              ]
            },
            {
              title: 'Making Data-Driven Decisions',
              description: 'Apply insights to your recruitment',
              actions: [
                'Check median compensation before setting CTC',
                'Understand sector preferences for each institution',
                'Use historical acceptance rates to calibrate offers',
                'Identify institutions with strong fit for your role type'
              ]
            }
          ],
          tips: [
            'Review institution analytics before submitting JDs',
            'Median CTC varies by institution — IIM ABC may average ₹28L while IIM XYZ averages ₹35L',
            'Sector distribution helps predict application volume'
          ],
          features: [
            {
              name: 'Institution Benchmarks',
              description: 'Historical hire and compensation data per institution',
              howItWorks: 'Each institution shows aggregate stats: total hires, median CTC, sector mix. Use this to set competitive offers and predict candidate fit.',
              keyPoints: [
                'Median compensation by institution',
                'Sector distribution (Consulting, Finance, Tech)',
                'Historical hire counts and trends'
              ]
            }
          ]
        }
      ]
    },
    {
      id: 'workflows',
      title: 'Workflows',
      subsections: [
        {
          id: 'understanding-workflows',
          title: 'Understanding Workflows',
          description: 'Learn how workflows are structured and managed',
          content: `Workflows represent the recruitment process for a specific role:

• Each workflow has multiple stages (Application, Shortlist, Interview, Offer, etc.)
• Workflows are created by the placement team
• You receive notifications when workflows are assigned
• Workflow status determines what actions you can take`,
          steps: [
            {
              title: 'Viewing Assigned Workflows',
              description: 'See workflows assigned to your company',
              actions: [
                'Navigate to Workflows section',
                'View list of all assigned workflows',
                'See workflow status (DRAFT, ACTIVE, COMPLETED)',
                'Click on a workflow for details'
              ]
            },
            {
              title: 'Workflow Stages',
              description: 'Understanding the recruitment stages',
              actions: [
                'Application: Students submit applications',
                'Shortlist: You select candidates to progress',
                'Interview: Schedule and conduct interviews',
                'Offer: Extend job offers to selected candidates',
                'Each stage may require placement team approval'
              ]
            }
          ],
          tips: [
            'Check workflow status regularly',
            'Respond promptly to placement team requests',
            'Keep workflow information updated'
          ]
        },
        {
          id: 'jd-submission',
          title: 'Submitting Job Descriptions',
          description: 'How to submit JDs and compensation details',
          content: `Before students can apply, you need to submit job descriptions:

• Fill out JD form with role details
• Provide compensation information
• Submit for placement team approval
• Once approved, applications open automatically`,
          steps: [
            {
              title: 'Accessing JD Submission',
              description: 'Find the JD submission form',
              actions: [
                'Go to Workflows section',
                'Select a workflow in DRAFT status',
                'Click "Submit JD" or "Edit JD"',
                'Fill out the job description form'
              ]
            },
            {
              title: 'Filling JD Details',
              description: 'Complete all required information',
              actions: [
                'Job title and description',
                'Sector and slot information',
                'Fixed compensation amount',
                'Variable compensation details',
                'ESOPs, joining bonus, performance bonus',
                'Top decile designation (if applicable)',
                'Opening date and other details'
              ],
              note: 'All fields marked with * are required'
            },
            {
              title: 'Submitting for Approval',
              description: 'Submit JD for placement team review',
              actions: [
                'Review all information',
                'Click "Submit for Approval"',
                'Wait for placement team review',
                'Address any feedback or questions',
                'Once approved, workflow becomes ACTIVE'
              ],
              note: 'You\'ll receive a notification when approved or if changes are needed'
            }
          ],
          tips: [
            'Be detailed and accurate in JD descriptions',
            'Provide competitive compensation information',
            'Respond promptly to placement team queries',
            'Keep JD information updated'
          ]
        },
        {
          id: 'compensation-configuration',
          title: 'Compensation Configuration',
          description: 'Configure CTC components with real examples — fixed, variable, ESOPs, bonuses, and governance tier placement',
          content: `Compensation configuration drives both candidate appeal and governance tier placement. Configure each component accurately:

• Fixed CTC: Base salary (e.g., ₹28L) — the guaranteed component
• Variable: Performance-linked pay (e.g., ₹6L) — typically 15–25% of fixed
• ESOPs Vested: Equity vesting in first year (e.g., ₹2L equivalent)
• Joining Bonus: One-time sign-on (e.g., ₹3L)
• Performance Bonus: Annual bonus (e.g., ₹4L)

Example total package: ₹28L fixed + ₹6L variable + ₹2L ESOPs + ₹3L joining + ₹4L perf = ₹43L CTC

Top-decile classification: Roles in the top 10% of compensation for the cohort may receive special governance treatment (e.g., priority slot, extended deadlines).`,
          steps: [
            {
              title: 'Entering Compensation Components',
              description: 'Specify each CTC component in the JD form',
              actions: [
                'Enter Fixed CTC (e.g., ₹28,00,000)',
                'Enter Variable component (e.g., ₹6,00,000)',
                'Add ESOPs Vested if applicable (e.g., ₹2,00,000)',
                'Specify Joining Bonus (e.g., ₹3,00,000)',
                'Add Performance Bonus (e.g., ₹4,00,000)',
                'Mark Top Decile if role is in top 10% of cohort compensation'
              ],
              note: 'All amounts are in INR. Total CTC is computed automatically.'
            },
            {
              title: 'Understanding Governance Tier Placement',
              description: 'How compensation affects workflow governance',
              actions: [
                'Higher CTC roles may qualify for premium governance tiers',
                'Top-decile roles get priority treatment in scheduling',
                'Placement team uses CTC to assign slot and deadlines',
                'Ensure accuracy — misreporting can affect institutional compliance'
              ]
            }
          ],
          tips: [
            'Use real numbers — ₹28L fixed, ₹6L variable, ₹3L joining, ₹4L performance are common patterns',
            'Top-decile typically means CTC in top 10% for that institution and batch',
            'Governance tier affects interview slots, offer deadlines, and process flexibility'
          ],
          features: [
            {
              name: 'CTC Breakdown',
              description: 'Transparent compensation structure for candidates and placement teams',
              howItWorks: 'Each component (fixed, variable, ESOPs, joining, performance) is captured separately. The system computes total CTC and uses it for governance tier assignment.',
              keyPoints: [
                'Fixed CTC: Guaranteed base salary',
                'Variable: Performance-linked component',
                'ESOPs Vested: First-year equity value',
                'Joining & Performance Bonus: One-time and annual',
                'Top-decile flag for premium governance'
              ]
            }
          ]
        }
      ]
    },
    {
      id: 'applications',
      title: 'Applications',
      subsections: [
        {
          id: 'viewing-applications',
          title: 'Viewing Applications',
          description: 'How to view and manage candidate applications',
          content: `Once a workflow is ACTIVE, students can apply:

• View all applications for your workflows
• See application counts (not individual names initially)
• Download CVs individually or in bulk
• Filter applications by various criteria
• Track application status`,
          steps: [
            {
              title: 'Accessing Applications',
              description: 'View applications for your workflows',
              actions: [
                'Navigate to Applications section',
                'Select a workflow',
                'View list of applications',
                'See application statistics'
              ]
            },
            {
              title: 'Understanding Application View',
              description: 'What information is shown',
              actions: [
                'Application count (not names initially)',
                'Application status distribution',
                'CV availability',
                'Application timeline'
              ],
              note: 'Individual student names are visible only after shortlisting'
            },
            {
              title: 'Downloading CVs',
              description: 'Get candidate CVs',
              actions: [
                'Click "Download CV" for individual CVs',
                'Use "Download All" for bulk download (ZIP)',
                'CVs are in PDF format',
                'Downloaded CVs include all verified information'
              ]
            }
          ],
          tips: [
            'Review applications promptly',
            'Download CVs for offline review',
            'Use filters to find specific candidates',
            'Respect student privacy — only view what you need'
          ]
        },
        {
          id: 'shortlist-management',
          title: 'Managing Shortlists',
          description: 'Select candidates for progression',
          content: `Shortlisting allows you to select candidates for the next stage:

• Select candidates from applications
• Create shortlists for different stages
• Submit shortlists for approval
• Track shortlist status`,
          steps: [
            {
              title: 'Creating a Shortlist',
              description: 'Select candidates to shortlist',
              actions: [
                'View applications for a workflow',
                'Review candidate CVs',
                'Select candidates to shortlist',
                'Click "Create Shortlist"',
                'Add any notes or comments'
              ],
              note: 'Shortlists require placement team approval'
            },
            {
              title: 'Submitting Shortlists',
              description: 'Get approval for your selections',
              actions: [
                'Review selected candidates',
                'Submit shortlist for approval',
                'Wait for placement team review',
                'Receive notification when approved',
                'Candidates are notified of shortlist status'
              ]
            },
            {
              title: 'Managing Shortlist Status',
              description: 'Track shortlist progression',
              actions: [
                'View shortlist status (PENDING, APPROVED, REJECTED)',
                'See which candidates accepted',
                'Move candidates to next stage',
                'Update shortlist as needed'
              ]
            }
          ],
          tips: [
            'Select candidates carefully',
            'Provide clear reasons for shortlisting',
            'Respond to placement team feedback',
            'Keep shortlists updated'
          ]
        }
      ]
    },
    {
      id: 'offer-management',
      title: 'Offer Management',
      subsections: [
        {
          id: 'creating-offers',
          title: 'Creating Offers',
          description: 'Create offers from workflows, specify CTC, and track student response (PENDING → ACCEPTED/REJECTED)',
          content: `Create and extend offers directly from your workflow:

• Create offers from the workflow for shortlisted candidates
• Specify CTC and all compensation components (fixed, variable, bonuses)
• Track offer status: PENDING → ACCEPTED or REJECTED
• Student response workflow: students receive offers, respond within deadline
• Example: Offer ₹43L CTC to 3 candidates — 2 accept, 1 rejects`,
          steps: [
            {
              title: 'Creating an Offer from Workflow',
              description: 'Extend an offer to a shortlisted candidate',
              actions: [
                'Navigate to Workflows or Applications',
                'Select a candidate who has cleared interview stage',
                'Click "Create Offer"',
                'Specify CTC breakdown (fixed, variable, joining bonus, etc.)',
                'Set response deadline',
                'Submit for placement team approval'
              ],
              note: 'Offers typically require placement team approval before being sent to students.'
            },
            {
              title: 'CTC Specification in Offers',
              description: 'Ensure offer matches JD and governance',
              actions: [
                'Enter Fixed CTC (e.g., ₹28L)',
                'Enter Variable (e.g., ₹6L)',
                'Add Joining Bonus (e.g., ₹3L)',
                'Add Performance Bonus (e.g., ₹4L)',
                'Include ESOPs if applicable',
                'Total CTC is computed and displayed'
              ]
            },
            {
              title: 'Tracking Offer Status',
              description: 'Monitor PENDING → ACCEPTED/REJECTED',
              actions: [
                'View offer status: PENDING, ACCEPTED, REJECTED',
                'Receive notifications when students respond',
                'See acceptance/rejection reasons if provided',
                'Update pipeline based on responses'
              ]
            },
            {
              title: 'Student Response Workflow',
              description: 'How students receive and respond to offers',
              actions: [
                'Student receives offer notification',
                'Student views offer details and deadline',
                'Student accepts or rejects within deadline',
                'You receive notification of response',
                'Accepted offers move to onboarding; rejected free slot for others'
              ]
            }
          ],
          tips: [
            'Set realistic response deadlines (typically 3–7 days)',
            'Ensure offer CTC matches approved JD',
            'Follow up on PENDING offers as deadline approaches'
          ],
          features: [
            {
              name: 'Offer Lifecycle',
              description: 'End-to-end offer creation and tracking',
              howItWorks: 'Create offer → Placement approval → Student receives → Student responds (ACCEPT/REJECT) → You get notified. Status is always visible in the workflow.',
              keyPoints: [
                'PENDING: Awaiting student response',
                'ACCEPTED: Candidate committed',
                'REJECTED: Slot available for others'
              ]
            }
          ]
        },
        {
          id: 'offer-analytics',
          title: 'Offer Analytics',
          description: 'Offer conversion rates, acceptance vs rejection patterns, and company-level analytics',
          content: `Understand your offer performance with analytics:

• Offer conversion rates: % of offers that get accepted (e.g., 72% conversion)
• Acceptance vs rejection patterns: by institution, role, or compensation band
• Company-level analytics: total offers extended, accepted, rejected
• Example: 15 offers extended → 11 accepted (73%), 4 rejected — use insights to refine future offers`,
          steps: [
            {
              title: 'Viewing Offer Conversion Rates',
              description: 'See how many offers convert to acceptances',
              actions: [
                'Navigate to Analytics or Dashboard',
                'View offer conversion rate (accepted / total offers)',
                'Compare across workflows or institutions',
                'Identify high-performing vs low-performing segments'
              ]
            },
            {
              title: 'Analyzing Acceptance vs Rejection Patterns',
              description: 'Understand why candidates accept or reject',
              actions: [
                'Review rejection reasons if provided',
                'Compare acceptance rates by institution',
                'Check patterns by role type or CTC band',
                'Use insights to adjust future offers'
              ]
            },
            {
              title: 'Company-Level Analytics',
              description: 'Aggregate view of your recruitment outcomes',
              actions: [
                'Total offers extended this cycle',
                'Total accepted and rejected',
                'Conversion rate by workflow',
                'Trends over time'
              ]
            }
          ],
          tips: [
            'Track conversion rates to calibrate offer volume',
            'High rejection rates may indicate compensation or role-fit issues',
            'Use analytics to report outcomes to leadership'
          ]
        }
      ]
    },
    {
      id: 'request-approvals',
      title: 'Request Approvals',
      subsections: [
        {
          id: 'application-requests',
          title: 'Application Requests',
          description: 'Review application requests from placement team, approval/rejection workflow, scheduling parameters, and status tracking',
          content: `Application requests are workflows or slots that the placement team proposes for your approval:

• Placement team creates application requests (e.g., new role, new institution)
• You review and approve or reject
• Scheduling parameters: dates, slots, deadlines
• Status tracking: PENDING, APPROVED, REJECTED
• Example: "IIM Ahmedabad — Product Manager role, Slot 1, applications open Jan 15" — you approve to proceed`,
          steps: [
            {
              title: 'Reviewing Application Requests',
              description: 'See what the placement team is proposing',
              actions: [
                'Navigate to Request Approvals or Notifications',
                'View list of PENDING application requests',
                'Read role details, institution, slot, and scheduling parameters',
                'Check deadlines and constraints'
              ]
            },
            {
              title: 'Approval/Rejection Workflow',
              description: 'Approve or reject with feedback',
              actions: [
                'Click "Approve" to accept the request',
                'Click "Reject" and optionally add reason',
                'Placement team receives your decision',
                'Approved requests move to workflow setup',
                'Rejected requests are logged with reason'
              ],
              note: 'Respond promptly — delayed approvals can affect institutional timelines.'
            },
            {
              title: 'Scheduling Parameters',
              description: 'Understand what you are approving',
              actions: [
                'Application open/close dates',
                'Interview slot allocations',
                'Offer deadline windows',
                'Institution-specific rules'
              ]
            },
            {
              title: 'Status Tracking',
              description: 'Track request status over time',
              actions: [
                'PENDING: Awaiting your decision',
                'APPROVED: Proceeding to next step',
                'REJECTED: Closed with reason',
                'View history of past requests'
              ]
            }
          ],
          tips: [
            'Review scheduling parameters before approving',
            'Reject with clear reason to help placement team adjust',
            'Batch similar requests for faster processing'
          ]
        }
      ]
    },
    {
      id: 'multi-institution',
      title: 'Multi-Institution',
      subsections: [
        {
          id: 'institution-management',
          title: 'Institution Management',
          description: 'Manage pipelines across multiple institutions — IIM Calcutta, IIM Ahmedabad, Lateral Hiring — with per-institution statistics',
          content: `Manage recruitment across multiple partner institutions:

• Pipelines per institution: IIM Calcutta, IIM Ahmedabad, Lateral Hiring, etc.
• Per-institution statistics: hires, roles, pending applications
• Institution-level analytics: conversion rates, median CTC, sector mix
• Example: IIM Calcutta — 3 roles, 12 hires, 45 pending applications; IIM Ahmedabad — 2 roles, 8 hires, 32 pending`,
          steps: [
            {
              title: 'Viewing Multi-Institution Pipelines',
              description: 'See all institutions you recruit from',
              actions: [
                'Navigate to Dashboard or Institutional Registry',
                'View list of partner institutions',
                'See active workflows per institution',
                'Access institution-specific applications and offers'
              ]
            },
            {
              title: 'Per-Institution Statistics',
              description: 'Hires, roles, and pending applications by institution',
              actions: [
                'Hires: Total candidates placed at each institution',
                'Roles: Active workflows per institution',
                'Pending applications: Applications awaiting your action',
                'Compare metrics across institutions'
              ]
            },
            {
              title: 'Institution-Level Analytics',
              description: 'Data-driven view per institution',
              actions: [
                'Historical hire counts',
                'Median compensation by institution',
                'Sector distribution',
                'Conversion and acceptance rates'
              ]
            }
          ],
          tips: [
            'Use per-institution stats to prioritize review',
            'Institutions may have different timelines — IIM ABC vs IIM XYZ',
            'Lateral Hiring often has different slot structures'
          ]
        }
      ]
    },
    {
      id: 'notifications',
      title: 'Notifications',
      subsections: [
        {
          id: 'recruiter-notifications',
          title: 'Recruiter Notifications',
          description: 'JD approval/rejection, new applications, stage progression approvals, and interview scheduling updates',
          content: `Stay informed with real-time notifications:

• JD approval/rejection: When your submitted JD is approved or needs changes
• New application notifications: When students apply to your workflows
• Stage progression approvals: When shortlists or progressions are approved/rejected
• Interview scheduling updates: Slot confirmations, cancellations, reminders
• Example: "Your JD for Product Manager (IIM Ahmedabad) has been approved" or "5 new applications for Strategy Consultant role"`,
          steps: [
            {
              title: 'JD Approval/Rejection Notifications',
              description: 'Know when your JD is reviewed',
              actions: [
                'Receive notification when JD is approved',
                'Receive notification if JD is rejected with feedback',
                'Click through to view details and take action',
                'Resubmit with changes if rejected'
              ]
            },
            {
              title: 'New Application Notifications',
              description: 'Stay on top of incoming applications',
              actions: [
                'Get notified when new applications arrive',
                'See application count and workflow',
                'Navigate to Applications to review',
                'Prioritize high-volume workflows'
              ]
            },
            {
              title: 'Stage Progression Approvals',
              description: 'Shortlist and progression decisions',
              actions: [
                'Notification when shortlist is approved or rejected',
                'Notification when candidate progression is approved',
                'View feedback from placement team',
                'Take next steps (e.g., create offer)'
              ]
            },
            {
              title: 'Interview Scheduling Updates',
              description: 'Calendar and slot updates',
              actions: [
                'Slot booking confirmed',
                'Slot cancelled or rescheduled',
                'Reminder before upcoming interview',
                'Availability changes affecting your bookings'
              ]
            }
          ],
          tips: [
            'Enable notifications in your profile for timely updates',
            'Respond to JD rejections quickly to avoid delays',
            'Check application notifications daily during peak season'
          ]
        }
      ]
    },
    {
      id: 'calendar',
      title: 'Calendar',
      subsections: [
        {
          id: 'booking-slots',
          title: 'Booking Interview Slots',
          description: 'Schedule interviews and engagements',
          content: `The calendar system helps you schedule interviews:

• View aggregated student availability
• Book interview slots
• See availability counts (not individual names)
• Manage your company's calendar`,
          steps: [
            {
              title: 'Viewing Availability',
              description: 'Check when students are available',
              actions: [
                'Navigate to Calendar section',
                'Select date range',
                'View availability grid',
                'See availability counts per time slot'
              ],
              note: 'You see counts, not individual student names'
            },
            {
              title: 'Booking Slots',
              description: 'Reserve interview times',
              actions: [
                'Select available time slot',
                'Specify interview type and details',
                'Request slot booking',
                'Wait for confirmation',
                'Receive calendar invitation'
              ]
            },
            {
              title: 'Managing Bookings',
              description: 'Handle your scheduled interviews',
              actions: [
                'View all booked slots',
                'See interview details',
                'Cancel or reschedule if needed',
                'Receive reminders before interviews'
              ]
            }
          ],
          tips: [
            'Book slots well in advance',
            'Respect student availability',
            'Confirm bookings promptly',
            'Update calendar if plans change'
          ]
        }
      ]
    },
    {
      id: 'approvals',
      title: 'Approval Workflows',
      subsections: [
        {
          id: 'understanding-approvals',
          title: 'Understanding the Approval Process',
          description: 'How approvals work and what requires approval',
          content: `All key actions require placement team approval:

• JD submissions
• Shortlist selections
• Stage progressions
• Other workflow changes

This ensures compliance with institutional policies.`,
          steps: [
            {
              title: 'What Requires Approval',
              description: 'Actions that need placement team review',
              actions: [
                'JD submissions and updates',
                'Shortlist creations',
                'Candidate progressions',
                'Workflow modifications'
              ]
            },
            {
              title: 'Approval Process',
              description: 'How approvals work',
              actions: [
                'Submit your action',
                'Status changes to PENDING',
                'Placement team reviews',
                'Approved or rejected with feedback',
                'You receive notification',
                'Action proceeds if approved'
              ]
            },
            {
              title: 'Handling Rejections',
              description: 'What to do if approval is rejected',
              actions: [
                'Review feedback from placement team',
                'Address concerns or issues',
                'Make necessary changes',
                'Resubmit for approval'
              ]
            }
          ],
          tips: [
            'Provide complete information in submissions',
            'Respond to feedback promptly',
            'Understand institutional policies',
            'Be patient with approval process'
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
              question: 'Why can\'t I see student names initially?',
              answer: 'Student privacy is protected. You\'ll see names only after shortlisting and with proper approvals.'
            },
            {
              question: 'How long does approval take?',
              answer: 'Approval times vary but typically take 1–3 business days. You\'ll receive notifications when status changes.'
            },
            {
              question: 'Can I edit a JD after submission?',
              answer: 'Yes, if the workflow is still in DRAFT status. Once ACTIVE, changes require placement team approval.'
            },
            {
              question: 'How many candidates can I shortlist?',
              answer: 'This depends on the workflow and institutional policies. Check with the placement team for specific limits.'
            },
            {
              question: 'What if I need to cancel an interview?',
              answer: 'You can cancel or reschedule booked slots through the Calendar section. Notify candidates promptly.'
            },
            {
              question: 'How do I create an offer?',
              answer: 'Navigate to the workflow, select a candidate who has cleared the interview stage, and click "Create Offer". Specify CTC and submit for approval.'
            },
            {
              question: 'What does top-decile mean for compensation?',
              answer: 'Top-decile indicates your role is in the top 10% of compensation for that institution and batch. It may qualify for premium governance treatment.'
            }
          ]
        }
      ]
    }
  ];
