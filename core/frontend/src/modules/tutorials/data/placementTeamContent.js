export const tutorialSections = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      subsections: [
        {
          id: 'overview',
          title: 'Overview',
          description: 'Welcome to the Placement Team portal! Learn how to manage placement operations.',
          content: `As a placement team member, you can:

• View dashboard with key statistics
• Manage CV templates (upload, analyze, activate)
• Verify student CVs
• Create and manage workflows for companies
• Review and approve/reject company requests
• View master calendar
• Access governance flow (view policies)
• View approval queue

You play a crucial role in coordinating between students and companies while ensuring compliance with institutional policies.`
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
          description: 'Key statistics and overview information',
          content: `Your dashboard shows:

• Key placement statistics
• Pending approvals count
• Active workflows
• CV verification queue
• Recent activities`,
          steps: [
            {
              title: 'Key Metrics',
              description: 'Important statistics at a glance',
              actions: [
                'Total active workflows',
                'Pending approvals',
                'CVs awaiting verification',
                'Active applications',
                'Upcoming interviews'
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
          id: 'managing-templates',
          title: 'Managing CV Templates',
          description: 'Upload, analyze, and activate CV templates',
          content: `CV templates ensure consistency across student CVs:

• Upload PDF templates
• AI analyzes template structure
• Activate templates for student use
• Manage template versions`,
          steps: [
            {
              title: 'Uploading Templates',
              description: 'Add new CV templates',
              actions: [
                'Navigate to CV Templates',
                'Click "Upload Template"',
                'Select PDF file',
                'Provide template name and description',
                'Upload the file'
              ]
            },
            {
              title: 'Template Analysis',
              description: 'AI analyzes template structure',
              actions: [
                'System analyzes PDF structure',
                'Extracts sections and fields',
                'Identifies required information',
                'Creates fillable form structure'
              ],
              note: 'Analysis happens automatically after upload'
            },
            {
              title: 'Activating Templates',
              description: 'Make templates available to students',
              actions: [
                'Review analyzed template structure',
                'Verify sections and fields',
                'Click "Activate"',
                'Template becomes available to students'
              ]
            }
          ],
          tips: [
            'Use clear, well-structured PDF templates',
            'Review analysis results carefully',
            'Test templates before activating',
            'Keep templates updated'
          ]
        }
      ]
    },
    {
      id: 'cv-verification',
      title: 'CV Verification',
      subsections: [
        {
          id: 'verifying-cvs',
          title: 'Verifying Student CVs',
          description: 'Review and verify student-submitted CVs',
          content: `CV verification ensures quality and compliance:

• Review student CV submissions
• Check for accuracy and completeness
• Verify compliance with templates
• Approve or request changes`,
          steps: [
            {
              title: 'Accessing Verification Queue',
              description: 'View CVs awaiting verification',
              actions: [
                'Navigate to CV Verification',
                'View list of pending CVs',
                'See submission date and student info',
                'Click on CV to review'
              ]
            },
            {
              title: 'Reviewing CVs',
              description: 'Check CV quality',
              actions: [
                'Review all sections',
                'Verify information accuracy',
                'Check template compliance',
                'Look for completeness',
                'Note any issues'
              ]
            },
            {
              title: 'Approving or Rejecting',
              description: 'Make verification decision',
              actions: [
                'APPROVE: CV meets standards',
                'REJECT: Provide feedback for changes',
                'Add verification notes',
                'Submit decision',
                'Student receives notification'
              ]
            }
          ],
          tips: [
            'Be thorough in reviews',
            'Provide constructive feedback',
            'Maintain consistency in standards',
            'Process verifications promptly'
          ]
        },
        {
          id: 'verification-workflow',
          title: 'CV Verification Workflow',
          description: 'End-to-end workflow from proof checking to re-submission handling',
          content: `The CV verification workflow ensures every claim is validated:

• Proof URL checking — verify links to certificates, projects, internships
• Claim verification — cross-check education, experience, skills against evidence
• Verify/flag actions — approve clean CVs or flag discrepancies
• Student feedback loop — students receive actionable feedback and can respond
• Re-submission handling — track revisions and re-verify updated submissions`,
          steps: [
            {
              title: 'Proof URL Checking',
              description: 'Validate evidence links provided by students',
              actions: [
                'Open each proof URL listed in the CV',
                'Verify the link resolves and content matches the claim',
                'Check for expired or broken links',
                'Note any mismatches (e.g., certificate says "2023" but CV says "2024")',
                'Add verification notes for each proof'
              ],
              note: 'Students may use Google Drive, LinkedIn, or institutional URLs'
            },
            {
              title: 'Claim Verification',
              description: 'Cross-check claims against evidence',
              actions: [
                'Match dates (graduation, internships) across sections',
                'Verify GPA/CGPA against transcript if linked',
                'Confirm project descriptions align with proof',
                'Check skill claims against project/experience evidence',
                'Flag any unverifiable or inconsistent claims'
              ]
            },
            {
              title: 'Verify or Flag',
              description: 'Take action on the CV',
              actions: [
                'VERIFY: All claims checked, evidence valid — approve for applications',
                'FLAG: Issues found — select reason (broken link, mismatch, missing proof)',
                'Add detailed feedback for the student',
                'Submit decision — student receives notification immediately'
              ]
            },
            {
              title: 'Student Feedback Loop',
              description: 'Students respond and resubmit',
              actions: [
                'Student views feedback in their portal',
                'Student fixes issues (new links, corrected dates)',
                'Student resubmits CV for re-verification',
                'CV returns to your queue with "Re-submission" badge',
                'Re-verify focusing on previously flagged items'
              ]
            },
            {
              title: 'Re-submission Handling',
              description: 'Process revised CVs efficiently',
              actions: [
                'Filter queue by "Re-submission" to prioritize',
                'Review only the sections that were flagged',
                'Confirm fixes address the original feedback',
                'Approve or flag again with specific guidance',
                'Track verification history for audit'
              ]
            }
          ],
          tips: [
            'Be specific in feedback — "Link to certificate returns 404" is better than "Proof invalid"',
            'Use the verification history to avoid re-checking unchanged sections',
            'Set a 48-hour SLA for re-submissions during peak application periods',
            'Escalate repeated flagging to placement admin if patterns emerge'
          ],
          features: [
            {
              name: 'Proof URL Validation',
              description: 'System tracks which URLs you\'ve checked and their status.',
              howItWorks: 'Each proof link is displayed with a "Check" action. Your verification notes are stored per-claim for audit.',
              useCases: [
                'Bulk verification during placement season',
                'Audit trail for disputed verifications',
                'Quick re-check on resubmissions'
              ],
              keyPoints: [
                'Links open in new tab for verification',
                'Notes persist across sessions',
                'History visible to students (feedback only)'
              ]
            },
            {
              name: 'Re-submission Tracking',
              description: 'Easily identify and prioritize CVs that students have revised.',
              howItWorks: 'Re-submitted CVs are tagged and sorted. You see what was changed and your previous feedback.',
              useCases: [
                'Prioritize students waiting on verification',
                'Avoid re-reading entire CV',
                'Ensure feedback was addressed'
              ],
              keyPoints: [
                'Re-submission badge in queue',
                'Diff view of changes (where supported)',
                'Previous feedback visible'
              ]
            }
          ]
        }
      ]
    },
    {
      id: 'workflow-manager',
      title: 'Workflow Manager',
      subsections: [
        {
          id: 'creating-workflows',
          title: 'Creating Workflows',
          description: 'Set up workflows for company recruitment',
          content: `Workflows define the recruitment process:

• Create workflows for companies
• Define workflow stages
• Assign to companies
• Manage workflow status`,
          steps: [
            {
              title: 'Creating a New Workflow',
              description: 'Set up workflow structure',
              actions: [
                'Navigate to Workflow Manager',
                'Click "Create Workflow"',
                'Enter workflow name and description',
                'Select company',
                'Define workflow stages',
                'Set stage requirements',
                'Save workflow'
              ]
            },
            {
              title: 'Defining Stages',
              description: 'Set up workflow stages',
              actions: [
                'Add stages (Application, Shortlist, Interview, etc.)',
                'Set stage order',
                'Configure stage requirements',
                'Set approval requirements',
                'Define stage transitions'
              ]
            },
            {
              title: 'Assigning to Companies',
              description: 'Assign workflows to companies',
              actions: [
                'Select target company',
                'Assign workflow',
                'Notify company',
                'Workflow appears in company portal'
              ]
            }
          ],
          tips: [
            'Plan workflow stages carefully',
            'Consider company needs',
            'Set clear requirements',
            'Test workflows before activation'
          ]
        },
        {
          id: 'managing-workflows',
          title: 'Managing Workflows',
          description: 'Ongoing workflow management',
          content: `Manage workflows throughout the recruitment cycle:

• Monitor workflow status
• Update workflow details
• Handle stage transitions
• Resolve issues`,
          steps: [
            {
              title: 'Monitoring Workflows',
              description: 'Track workflow progress',
              actions: [
                'View all active workflows',
                'Check workflow status',
                'Monitor application counts',
                'Track stage progressions'
              ]
            },
            {
              title: 'Updating Workflows',
              description: 'Make changes as needed',
              actions: [
                'Edit workflow details',
                'Modify stages',
                'Update requirements',
                'Change status',
                'Notify relevant parties'
              ]
            }
          ]
        }
      ]
    },
    {
      id: 'approval-queue',
      title: 'Approval Queue',
      subsections: [
        {
          id: 'reviewing-approvals',
          title: 'Reviewing Approval Requests',
          description: 'Process company and student requests',
          content: `The approval queue contains all pending requests:

• JD submissions from companies
• Shortlist requests
• Stage progression requests
• Other workflow changes`,
          steps: [
            {
              title: 'Accessing Approval Queue',
              description: 'View pending approvals',
              actions: [
                'Navigate to Approval Queue',
                'View list of pending requests',
                'See request type and details',
                'Check submission date',
                'Click to review'
              ]
            },
            {
              title: 'Reviewing Requests',
              description: 'Evaluate approval requests',
              actions: [
                'Review request details',
                'Check compliance with policies',
                'Verify information accuracy',
                'Consider institutional guidelines',
                'Make decision'
              ]
            },
            {
              title: 'Approving or Rejecting',
              description: 'Process the request',
              actions: [
                'APPROVE: Request meets requirements',
                'REJECT: Provide feedback',
                'Add notes or comments',
                'Submit decision',
                'Requestor receives notification'
              ]
            }
          ],
          tips: [
            'Review requests promptly',
            'Be consistent in decisions',
            'Provide clear feedback',
            'Document decisions',
            'Follow institutional policies'
          ]
        }
      ]
    },
    {
      id: 'master-calendar',
      title: 'Master Calendar',
      subsections: [
        {
          id: 'viewing-calendar',
          title: 'Viewing Master Calendar',
          description: 'See institutional calendar and schedules',
          content: `The master calendar shows:

• All scheduled interviews
• Student availability blocks
• Company booking requests
• Institutional events`,
          steps: [
            {
              title: 'Accessing Calendar',
              description: 'View master calendar',
              actions: [
                'Navigate to Master Calendar',
                'Select date range',
                'View calendar grid',
                'See all scheduled events'
              ]
            },
            {
              title: 'Managing Calendar',
              description: 'Handle calendar events',
              actions: [
                'View interview schedules',
                'See availability patterns',
                'Monitor booking requests',
                'Resolve conflicts',
                'Update events as needed'
              ]
            }
          ]
        }
      ]
    },
    {
      id: 'governance',
      title: 'Governance Flow',
      subsections: [
        {
          id: 'viewing-policies',
          title: 'Viewing Governance Policies',
          description: 'Understand placement policies (read-only)',
          content: `View current governance policies:

• Policy templates
• Active policies
• Company tier classifications
• Stage restrictions
• Student status rules`,
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
              note: 'Only Placement Admins can create or edit policies'
            }
          ]
        },
        {
          id: 'policy-deep-dive',
          title: 'Policy Engine Deep Dive',
          description: 'How global caps, sector distribution, offer modes, and eligibility rules shape placement outcomes',
          content: `The policy engine enforces fairness and institutional rules across the placement cycle:

• Global caps — maxShortlists: 12 limits how many companies can shortlist a student
• Sector distribution — [6,4,2] across tiers ensures balanced exposure (e.g., 6 Tier-1, 4 Tier-2, 2 Tier-3)
• topDecileExempt — top 10% students may bypass certain caps for premium roles
• offerReleaseMode — SCHEDULED (all offers at once) vs ROLLING (as they come)
• Batch eligibility — which batches (e.g., 2025, 2026) can apply
• Lateral hiring rules — relaxed caps and ROLLING mode for experienced hires`,
          steps: [
            {
              title: 'Understanding Global Caps',
              description: 'maxShortlists controls application load per student',
              actions: [
                'Default: maxShortlists = 12 (student can be shortlisted by up to 12 companies)',
                'Prevents over-commitment and interview fatigue',
                'Policy applies cycle-wide; exceptions via topDecileExempt',
                'View current value in Governance → Active Policy'
              ],
              note: 'Example: With 12, a student at 12/12 cannot be shortlisted by new companies until they drop'
            },
            {
              title: 'Sector Distribution Rules',
              description: 'Tier-based limits ensure balanced opportunity',
              actions: [
                'Distribution [6,4,2] = 6 Tier-1 + 4 Tier-2 + 2 Tier-3 shortlists',
                'Prevents concentration in one tier',
                'Company tier comes from governance (Tier 1/2/3)',
                'Students see remaining quota per tier in their dashboard'
              ]
            },
            {
              title: 'Top Decile Exemption',
              description: 'topDecileExempt gives flexibility to top performers',
              actions: [
                'When ON: Top 10% by CGPA bypass sector caps (not global cap)',
                'Use for star students targeting multiple premium roles',
                'Toggle in policy config; affects current cycle only',
                'Audit log tracks which students used exemption'
              ]
            },
            {
              title: 'Offer Release Mode',
              description: 'SCHEDULED vs ROLLING controls when offers go live',
              actions: [
                'SCHEDULED: All offers released on a fixed date (e.g., Dec 15)',
                'ROLLING: Offers released as companies finalize (immediate)',
                'Typical: SCHEDULED for final placements, ROLLING for internships',
                'Setting in policy → offerReleaseMode'
              ]
            },
            {
              title: 'Batch Eligibility',
              description: 'Which batches can participate',
              actions: [
                'Define eligible batches (e.g., 2025, 2026)',
                'Students outside batch cannot apply',
                'Used for summer vs final placement separation',
                'Configure in cycle creation'
              ]
            },
            {
              title: 'Lateral Hiring Rules',
              description: 'Special rules for experienced hires',
              actions: [
                'Relaxed caps (e.g., maxShortlists = 20)',
                'Typically ROLLING offer mode',
                'Separate policy or policy override for lateral cycles',
                'Eligibility: work experience ≥ 1 year'
              ]
            }
          ],
          tips: [
            'Run a dry-run with sample data before activating policy changes',
            'Communicate offerReleaseMode to students — SCHEDULED reduces anxiety',
            'Monitor sector distribution mid-cycle; adjust if tiers are skewed',
            'Use lateral rules only for dedicated lateral hiring cycles'
          ],
          features: [
            {
              name: 'Global Caps (maxShortlists)',
              description: 'Limits total shortlists per student to prevent overload.',
              howItWorks: 'When a student reaches maxShortlists, the policy engine blocks new shortlists. Companies see "Cap reached" for that student.',
              useCases: [
                'Fair distribution of interview slots',
                'Prevent top students from hoarding opportunities',
                'Manage recruiter expectations'
              ],
              keyPoints: [
                'Default: 12 shortlists',
                'Enforced at shortlist stage',
                'topDecileExempt can relax sector caps only'
              ]
            },
            {
              name: 'Sector Distribution [6,4,2]',
              description: 'Ensures students get exposure across company tiers.',
              howItWorks: 'Each student has quotas: 6 Tier-1, 4 Tier-2, 2 Tier-3. Once a tier quota is full, no more shortlists from that tier.',
              useCases: [
                'Balanced placement outcomes',
                'Prevent tier concentration',
                'Support diversity of opportunities'
              ],
              keyPoints: [
                'Tiers from company classification',
                'Quota tracked per student',
                'Visible in student dashboard'
              ]
            },
            {
              name: 'Offer Release Mode',
              description: 'Controls when students see and accept offers.',
              howItWorks: 'SCHEDULED: offers held until release date. ROLLING: offers visible immediately after company confirms.',
              useCases: [
                'SCHEDULED: Final placements, reduce early-bird advantage',
                'ROLLING: Internships, lateral hiring, faster closure'
              ],
              keyPoints: [
                'Set per policy',
                'Cannot change mid-cycle',
                'Students notified of mode at cycle start'
              ]
            }
          ]
        }
      ]
    },
    {
      id: 'cycle-operations',
      title: 'Cycle Operations',
      subsections: [
        {
          id: 'cycle-lifecycle',
          title: 'Cycle Lifecycle',
          description: 'Creating cycles, type selection, date ranges, policy assignment, and status transitions',
          content: `Placement cycles drive the entire recruitment calendar:

• Create cycles with type (FINAL/SUMMER)
• Set date ranges for applications, shortlists, offers
• Assign governance policy to the cycle
• Move through status: DRAFT → APPLICATIONS_OPEN → APPLICATIONS_CLOSED → OFFERS_IN_PROGRESS → COMPLETED`,
          steps: [
            {
              title: 'Creating a Cycle',
              description: 'Set up a new placement cycle',
              actions: [
                'Navigate to Cycles',
                'Click "Create Cycle"',
                'Enter cycle name (e.g., "Placements 2025")',
                'Select type: FINAL or SUMMER',
                'Set application open date',
                'Set application close date',
                'Set offer release date (if SCHEDULED mode)',
                'Select governance policy to apply',
                'Save as DRAFT'
              ],
              note: 'FINAL = full-time; SUMMER = internships'
            },
            {
              title: 'Type Selection',
              description: 'FINAL vs SUMMER affects eligibility and workflows',
              actions: [
                'FINAL: Full-time roles, graduating batch, longer timeline',
                'SUMMER: Internships, pre-final year, shorter cycle',
                'Batch eligibility rules differ by type',
                'Some policies are type-specific'
              ]
            },
            {
              title: 'Date Ranges',
              description: 'Critical for student and company planning',
              actions: [
                'Application open: When students can apply',
                'Application close: Deadline for applications',
                'Shortlist window: When companies shortlist',
                'Offer release: When offers go live (SCHEDULED mode)',
                'Cycle end: When cycle is marked COMPLETED'
              ]
            },
            {
              title: 'Policy Assignment',
              description: 'Link governance policy to the cycle',
              actions: [
                'Select from active policies',
                'Policy defines caps, distribution, offer mode',
                'Cannot change policy after APPLICATIONS_OPEN',
                'All companies and students in cycle follow this policy'
              ]
            },
            {
              title: 'Status Transitions',
              description: 'Move cycle through lifecycle',
              actions: [
                'DRAFT: Setup phase, no student/company activity',
                'APPLICATIONS_OPEN: Students apply, companies post JDs',
                'APPLICATIONS_CLOSED: No new applications, shortlisting begins',
                'OFFERS_IN_PROGRESS: Companies extend offers, students respond',
                'COMPLETED: Cycle closed, analytics finalized'
              ],
              note: 'Transitions are one-way; plan carefully before moving forward'
            }
          ],
          tips: [
            'Keep DRAFT until all JDs and policies are confirmed',
            'Announce APPLICATIONS_OPEN to students 24–48 hours in advance',
            'Use APPLICATIONS_CLOSED to trigger shortlist phase cleanly',
            'COMPLETED locks data for reporting — ensure all offers are recorded'
          ]
        },
        {
          id: 'cycle-analytics',
          title: 'Cycle Analytics',
          description: 'Offer rate, median CTC, sector distribution, application funnel, top recruiters — all from live data',
          content: `Cycle analytics give you real-time and historical insights:

• Offer rate — % of applicants who receive at least one offer
• Median CTC — median compensation by role/sector
• Sector distribution — placements across Tier 1/2/3
• Application funnel — apply → shortlist → interview → offer
• Top recruiters — companies with most hires`,
          steps: [
            {
              title: 'Offer Rate',
              description: 'Key metric for placement success',
              actions: [
                'Navigate to Cycle → Analytics',
                'View offer rate (e.g., 87% of 450 applicants)',
                'Breakdown by program, gender, category',
                'Compare to previous cycles',
                'Use for stakeholder reporting'
              ]
            },
            {
              title: 'Median CTC',
              description: 'Compensation trends',
              actions: [
                'View median CTC by role type (e.g., SDE: ₹18L, Analyst: ₹12L)',
                'Filter by sector, company tier',
                'Track YoY growth',
                'Export for placement reports'
              ]
            },
            {
              title: 'Sector Distribution',
              description: 'Placement spread across tiers',
              actions: [
                'Pie/bar chart: Tier-1 vs Tier-2 vs Tier-3',
                'Identify over/under-representation',
                'Align with policy targets ([6,4,2])',
                'Adjust next cycle policy if needed'
              ]
            },
            {
              title: 'Application Funnel',
              description: 'Conversion at each stage',
              actions: [
                'Funnel: Applied → Shortlisted → Interviewed → Offered',
                'Identify drop-off stages (e.g., low shortlist-to-interview)',
                'Drill down by company, role',
                'Improve process for next cycle'
              ]
            },
            {
              title: 'Top Recruiters',
              description: 'Companies with most hires',
              actions: [
                'Ranked list by hire count',
                'View CTC range per company',
                'Track repeat recruiters',
                'Use for relationship management'
              ]
            }
          ],
          tips: [
            'Refresh analytics daily during peak offer period',
            'Export data for external reports (e.g., NIRF, AICTE)',
            'Share anonymized funnel metrics with companies for feedback',
            'Use sector distribution to validate policy effectiveness'
          ],
          features: [
            {
              name: 'Live Data Analytics',
              description: 'All metrics computed from live cycle data — no manual uploads.',
              howItWorks: 'Analytics engine queries applications, shortlists, offers in real time. Dashboards update as data changes.',
              useCases: [
                'Real-time placement progress',
                'Stakeholder updates during cycle',
                'Post-cycle reporting'
              ],
              keyPoints: [
                'No data lag',
                'Filters: program, gender, category',
                'Export to CSV/PDF'
              ]
            }
          ]
        }
      ]
    },
    {
      id: 'application-requests',
      title: 'Application Requests',
      subsections: [
        {
          id: 'managing-requests',
          title: 'Managing Application Requests',
          description: 'Creating requests, setting open/close windows, recruiter approval flow, and status tracking',
          content: `Application requests let you control when and how students apply to companies:

• Create application requests per company/workflow
• Set open and close windows (e.g., Jan 10–Jan 20)
• Recruiter approval flow — companies request, you approve
• Track request status: PENDING, APPROVED, REJECTED, CLOSED`,
          steps: [
            {
              title: 'Creating Application Requests',
              description: 'Open applications for a company',
              actions: [
                'Navigate to Application Requests',
                'Click "Create Request"',
                'Select company and workflow',
                'Set open date and time',
                'Set close date and time',
                'Optionally set max applications per student',
                'Submit — request goes to PENDING or auto-approved per config'
              ],
              note: 'Open/close windows must fall within cycle dates'
            },
            {
              title: 'Setting Open/Close Windows',
              description: 'Control when students can apply',
              actions: [
                'Open: When "Apply" button becomes active for students',
                'Close: When applications are no longer accepted',
                'Use staggered windows to manage load (e.g., 5 companies per week)',
                'Students see countdown to close in their dashboard'
              ]
            },
            {
              title: 'Recruiter Approval Flow',
              description: 'Companies request, placement team approves',
              actions: [
                'Company submits JD and requests application window',
                'Request appears in your Approval Queue',
                'Review JD, dates, eligibility criteria',
                'APPROVE: Application request goes live',
                'REJECT: Provide feedback; company can resubmit'
              ]
            },
            {
              title: 'Request Status Tracking',
              description: 'Monitor all application requests',
              actions: [
                'View list: PENDING, APPROVED, REJECTED, CLOSED',
                'Filter by company, cycle, status',
                'See application count per request',
                'Close early if needed (e.g., cap reached)'
              ]
            }
          ],
          tips: [
            'Stagger open dates to avoid last-day rushes',
            'Set close time to 11:59 PM for clarity',
            'Approve JDs quickly — delays block student applications',
            'Use CLOSED status to stop applications without rejecting'
          ],
          features: [
            {
              name: 'Application Windows',
              description: 'Precise control over when students can apply.',
              howItWorks: 'Each request has open/close timestamps. System enforces: before open and after close, Apply is disabled.',
              useCases: [
                'Phased rollout of companies',
                'Manage application volume',
                'Align with company deadlines'
              ],
              keyPoints: [
                'Timezone-aware (institution timezone)',
                'Students see countdown',
                'No applications after close'
              ]
            }
          ]
        }
      ]
    },
    {
      id: 'student-directory',
      title: 'Student Directory',
      subsections: [
        {
          id: 'browsing-students',
          title: 'Browsing Students',
          description: 'Student roster with program, applications count, status, CGPA, filtering and search',
          content: `The student directory gives you a complete view of the placement cohort:

• Student roster with key fields (name, program, CGPA, status)
• Applications count — how many companies each student has applied to
• Status — PLACED, IN_PROGRESS, NOT_PLACED, etc.
• Filter by program, CGPA range, status, applications count
• Search by name, roll number, email`,
          steps: [
            {
              title: 'Accessing the Directory',
              description: 'View the student roster',
              actions: [
                'Navigate to Student Directory',
                'View table: Name, Program, CGPA, Applications, Shortlists, Status',
                'Default sort by name; change to CGPA, applications, etc.',
                'Select cycle to filter students'
              ]
            },
            {
              title: 'Filtering Students',
              description: 'Narrow down the roster',
              actions: [
                'Filter by Program (e.g., B.Tech CSE, MBA)',
                'Filter by CGPA range (e.g., 8.0–10.0)',
                'Filter by Status (PLACED, IN_PROGRESS, NOT_PLACED)',
                'Filter by Applications count (e.g., 0 applications)',
                'Combine filters for targeted lists'
              ]
            },
            {
              title: 'Search',
              description: 'Find specific students',
              actions: [
                'Type name, roll number, or email in search box',
                'Results update as you type',
                'Click student row to view full profile',
                'Use for quick lookups during company calls'
              ]
            },
            {
              title: 'Key Columns',
              description: 'What each column means',
              actions: [
                'Program: Degree and branch',
                'Applications: Number of companies applied to',
                'Shortlists: Number of shortlists received',
                'Status: PLACED / IN_PROGRESS / NOT_PLACED',
                'CGPA: Current GPA (for eligibility checks)'
              ]
            }
          ],
          tips: [
            'Filter by 0 applications to find students who haven\'t applied yet',
            'Use CGPA filter to prepare lists for companies with cutoffs',
            'Export filtered list for offline analysis',
            'Check status regularly to identify students needing support'
          ]
        }
      ]
    },
    {
      id: 'notifications-approvals',
      title: 'Notifications & Approvals',
      subsections: [
        {
          id: 'notification-center',
          title: 'Notification Center',
          description: 'JD submissions, stage progression requests, CV verifications, cycle updates, and application request approvals — all in one place',
          content: `The notification center is your command hub for all placement-related alerts:

• JD submissions — new job descriptions awaiting approval
• Stage progression requests — companies moving students to next stage
• CV verifications — students submitted CVs for review
• Cycle status updates — cycle moved to APPLICATIONS_OPEN, etc.
• Application request approvals — companies requesting application windows`,
          steps: [
            {
              title: 'Accessing the Notification Center',
              description: 'View all notifications',
              actions: [
                'Click bell icon in header',
                'Or navigate to Notifications',
                'View list: type, title, timestamp, read/unread',
                'Mark as read, or click to open item'
              ]
            },
            {
              title: 'JD Submissions',
              description: 'New job descriptions from companies',
              actions: [
                'Notification: "Company X submitted JD for Role Y"',
                'Click to open JD in approval queue',
                'Review and approve/reject',
                'Approved JDs enable student applications'
              ]
            },
            {
              title: 'Stage Progression Requests',
              description: 'Companies moving students to next stage',
              actions: [
                'Notification: "Company X requested stage progression for N students"',
                'Open workflow to review shortlist/interview list',
                'Check policy compliance (caps, eligibility)',
                'Approve or reject with feedback'
              ]
            },
            {
              title: 'CV Verifications',
              description: 'Students submitted CVs',
              actions: [
                'Notification: "N CVs awaiting verification"',
                'Go to CV Verification queue',
                'Process verifications',
                'Students get notified of result'
              ]
            },
            {
              title: 'Cycle Status Updates',
              description: 'Important cycle milestones',
              actions: [
                'Notifications when cycle moves to APPLICATIONS_OPEN, CLOSED, etc.',
                'Reminders for upcoming deadlines',
                'Offer release day alert (SCHEDULED mode)',
                'Stay informed without checking cycle page'
              ]
            },
            {
              title: 'Application Request Approvals',
              description: 'Companies requesting application windows',
              actions: [
                'Notification: "Company X requested application window"',
                'Review request in Application Requests',
                'Approve to open applications',
                'Reject with reason if needed'
              ]
            }
          ],
          tips: [
            'Enable email digests for high-priority notifications',
            'Process JD approvals first — they block student applications',
            'Batch similar approvals (e.g., all stage progressions) for efficiency',
            'Check notification center at least twice daily during peak season'
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
              question: 'How do I prioritize approval requests?',
              answer: 'Prioritize based on urgency, deadlines, and impact. JD approvals typically come first as they block student applications.'
            },
            {
              question: 'What if a CV doesn\'t meet standards?',
              answer: 'Reject with specific feedback. Students can address issues and resubmit.'
            },
            {
              question: 'Can I modify workflows after creation?',
              answer: 'Yes, but changes may affect active applications. Notify companies and students of significant changes.'
            },
            {
              question: 'How do I handle calendar conflicts?',
              answer: 'Review conflicts, communicate with parties involved, and help find alternative times.'
            },
            {
              question: 'When should I use SCHEDULED vs ROLLING offer mode?',
              answer: 'Use SCHEDULED for final placements to ensure fairness. Use ROLLING for internships or lateral hiring when speed matters.'
            },
            {
              question: 'How do I find students who haven\'t applied to any company?',
              answer: 'Go to Student Directory, filter by Applications count = 0. Reach out to understand barriers and encourage applications.'
            }
          ]
        }
      ]
    }
  ];
