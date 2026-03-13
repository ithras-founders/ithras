export const tutorialSections = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      subsections: [
        {
          id: 'overview',
          title: 'Overview',
          description: 'Welcome! As a System Admin, you have full system access and control across all institutions, companies, and platform operations.',
          content: `Your capabilities include:

• All Institution Admin capabilities (across all institutions)
• Create and manage institutions, programs, and batches
• Create and manage users (all roles) with granular access control
• Manage companies and recruiter accounts
• View system-wide audit logs and activity trails
• Access telemetry, analytics, and platform operations
• Configure governance policies and approval chains

You have the highest level of access and responsibility in the system.`,
          features: [
            {
              name: 'System-Wide Scope',
              description: 'Your actions affect the entire platform',
              keyPoints: [
                'Cross-institution visibility and management',
                'Global company and recruiter oversight',
                'Platform health and performance monitoring',
                'Database and migration control'
              ]
            }
          ]
        }
      ]
    },
    {
      id: 'people-management',
      title: 'People Management',
      subsections: [
        {
          id: 'search-and-filters',
          title: 'Search & Filters',
          description: 'Find users quickly with powerful search and filter capabilities across institutions and roles.',
          content: `The People management interface supports rich discovery:

• Full-text search: Search by name, email, or institution (e.g., "Priya Sharma" returns 3 matches across IIT Bombay and BITS Pilani)
• Role filter: Filter by SYSTEM_ADMIN, INSTITUTION_ADMIN, PLACEMENT_ADMIN, PLACEMENT_TEAM, STUDENT, RECRUITER, FACULTY_OBSERVER
• Institution filter: Scope to specific institutions (e.g., "IIT Delhi" shows 847 users)
• Status filter: Active, Inactive, Pending verification
• Batch filter: For students, filter by batch year (e.g., "2025" shows 312 graduating students)
• Last activity: Sort by last login (e.g., "Never logged in" surfaces 23 dormant accounts)`,
          steps: [
            {
              title: 'Using Search',
              description: 'Locate users by name or email',
              actions: [
                'Navigate to People',
                'Enter search term in the search bar',
                'Results update as you type (debounced)',
                'Click a result to view full profile'
              ]
            },
            {
              title: 'Applying Filters',
              description: 'Narrow results with filters',
              actions: [
                'Click filter dropdowns (Role, Institution, Status)',
                'Select one or more values',
                'Filters combine with AND logic',
                'Clear individual filters or reset all'
              ],
              note: 'Filters persist until you change or clear them'
            }
          ],
          tips: [
            'Use email search for exact matches when resolving support tickets',
            'Filter by "Never logged in" to identify onboarding gaps',
            'Combine Role + Institution for institution-specific admin lists'
          ]
        },
        {
          id: 'crud-operations',
          title: 'CRUD Operations',
          description: 'Create, read, update, and delete users with full audit trail.',
          content: `Complete user lifecycle management:

• Create: Add users with email, name, role, institution assignment; optionally set initial password or send invite
• Read: View profile, activity log, assigned permissions, last login, application count
• Update: Edit name, email, role, institution; reset password; activate/deactivate
• Delete: Soft-delete (deactivate) preserves audit history; hard-delete requires confirmation and affects related data`,
          steps: [
            {
              title: 'Creating a User',
              description: 'Add a new user to the system',
              actions: [
                'Navigate to People → Add User',
                'Enter email (validated for uniqueness)',
                'Enter full name',
                'Select institution (or "System" for SYSTEM_ADMIN)',
                'Assign role',
                'Optionally set password or send invite email',
                'Save — user receives credentials'
              ]
            },
            {
              title: 'Updating a User',
              description: 'Modify existing user details',
              actions: [
                'Open user profile from People list',
                'Click Edit',
                'Modify fields (name, role, institution)',
                'Use "Reset Password" if needed',
                'Save changes'
              ],
              note: 'Role changes take effect immediately; user may need to re-login'
            },
            {
              title: 'Deactivating a User',
              description: 'Disable access without losing history',
              actions: [
                'Open user profile',
                'Click Deactivate',
                'Confirm action',
                'User cannot log in; data preserved for audit'
              ]
            }
          ],
          tips: [
            'Always verify email before creating to avoid duplicates',
            'Use "Send invite" for new users so they set their own password',
            'Deactivate rather than delete when users leave — preserves audit chain'
          ]
        },
        {
          id: 'role-assignment',
          title: 'Role Assignment',
          description: 'Assign and manage user roles with institution scoping.',
          content: `Role assignment determines what users can see and do:

• SYSTEM_ADMIN: Full platform access (you)
• INSTITUTION_ADMIN: All operations within assigned institution(s)
• PLACEMENT_ADMIN: Placement ops, CV management, analytics within institution
• PLACEMENT_TEAM: Day-to-day placement tasks, approvals, workflows
• STUDENT: Candidate access — applications, CV, calendar
• RECRUITER: Company-side — JDs, applications, hiring
• FACULTY_OBSERVER: Read-only analytics and reports`,
          steps: [
            {
              title: 'Assigning a Role',
              description: 'Set or change user role',
              actions: [
                'Open user profile',
                'Click Edit',
                'Select new role from dropdown',
                'For INSTITUTION_ADMIN/PLACEMENT_ADMIN, select institution(s)',
                'Save — permissions update immediately'
              ]
            }
          ],
          tips: [
            'Principle of least privilege: assign the minimum role needed',
            'INSTITUTION_ADMIN can have multiple institutions; PLACEMENT_ADMIN typically one'
          ]
        },
        {
          id: 'activity-logs',
          title: 'Activity Logs',
          description: 'View per-user activity history for auditing and support.',
          content: `Activity logs capture user actions:

• Login/logout events with IP and timestamp
• Page views and key actions (e.g., "Viewed Applications", "Edited CV")
• Data changes (created/updated/deleted records)
• Export range: Last 7 days, 30 days, 90 days, or custom date range

Example: "Priya Sharma — 47 actions in last 7 days — Last: Approved JD #8921 at 14:32"`,
          steps: [
            {
              title: 'Viewing Activity Logs',
              description: 'Inspect user activity',
              actions: [
                'Open user profile',
                'Click Activity tab',
                'Select date range',
                'Scroll or filter by action type',
                'Export to CSV if needed'
              ]
            }
          ],
          tips: [
            'Use activity logs to diagnose "I can\'t see X" — check last permissions change',
            'Export logs for compliance or incident review'
          ]
        }
      ]
    },
    {
      id: 'institution-management',
      title: 'Institution Management',
      subsections: [
        {
          id: 'creating-institutions',
          title: 'Creating Institutions',
          description: 'Add new institutions to the platform with programs and batches.',
          content: `Institutions are the primary organizational units:

• Each institution has its own users, programs, batches, and data
• Institutions are isolated from each other (data segregation)
• You can create, edit, deactivate, and manage institutions
• Tier classification affects governance (e.g., Tier-1 vs Tier-2 company caps)`,
          steps: [
            {
              title: 'Creating a New Institution',
              description: 'Add institution to system',
              actions: [
                'Navigate to Institutions & Users',
                'Click "Add Institution"',
                'Enter institution name (e.g., "IIT Bombay")',
                'Set tier (e.g., Tier 1)',
                'Configure default governance settings',
                'Save institution'
              ]
            },
            {
              title: 'Managing Institutions',
              description: 'Update institution information',
              actions: [
                'View all institutions in list',
                'Click institution to edit',
                'Update name, tier, logo URL',
                'Modify default policies',
                'Deactivate if needed (preserves data)'
              ],
              note: 'Deactivation affects all users in that institution — they cannot log in'
            }
          ],
          tips: [
            'Use official institution names for clarity',
            'Set tier early — it influences policy defaults',
            'Document institution details for onboarding'
          ]
        },
        {
          id: 'programs-and-batches',
          title: 'Programs & Batches',
          description: 'Define programs (e.g., B.Tech, MBA) and batches (graduation year) per institution.',
          content: `Programs and batches structure student data:

• Programs: B.Tech CSE, MBA, M.Tech, etc. — each with its own placement cycle
• Batches: 2024, 2025, 2026 — graduation year cohorts
• Students are assigned to program + batch (e.g., "B.Tech CSE 2025")
• Analytics and reporting aggregate by program and batch`,
          steps: [
            {
              title: 'Adding Programs',
              description: 'Define academic programs',
              actions: [
                'Open institution → Programs tab',
                'Click Add Program',
                'Enter program name and code',
                'Set default cycle dates if applicable',
                'Save'
              ]
            },
            {
              title: 'Managing Batches',
              description: 'Create graduation year cohorts',
              actions: [
                'Open institution → Batches tab',
                'Add batch (e.g., 2026)',
                'Assign students to batch during onboarding',
                'Batch drives "Eligible for placement" logic'
              ]
            }
          ],
          tips: [
            'Create batches ahead of time (e.g., 2027 in advance)',
            'Use consistent naming: "B.Tech CSE" not "BTech CSE"'
          ]
        },
        {
          id: 'policy-assignment',
          title: 'Policy Assignment',
          description: 'Assign governance policies to institutions and programs.',
          content: `Policies control placement behavior:

• Shortlist caps: Max shortlists per student (e.g., 10)
• Tier rules: Different caps per company tier (Tier-1: 3, Tier-2: 5)
• Approval chains: JD approval, offer acceptance workflows
• Policies can be institution-wide or program-specific`,
          steps: [
            {
              title: 'Assigning Policies',
              description: 'Link policies to institutions',
              actions: [
                'Open institution → Policies tab',
                'Select policy template or create custom',
                'Set shortlist caps, tier rules',
                'Configure approval chain (e.g., PT → PA)',
                'Save — applies to new cycles'
              ]
            }
          ],
          tips: [
            'Test policy changes in a sandbox institution first',
            'Document policy rationale for future admins'
          ]
        },
        {
          id: 'tier-classification',
          title: 'Tier Classification',
          description: 'Configure institution and company tier systems for governance.',
          content: `Tiers drive governance rules:

• Institution tiers: Often used for reporting (Tier-1, Tier-2, etc.)
• Company tiers: Affect shortlist caps (e.g., Tier-1 companies: 3 max, Tier-2: 5)
• Students see tier enforcement on dashboard (e.g., "2/3 Tier-1 applications used")`,
          steps: [
            {
              title: 'Configuring Tiers',
              description: 'Set tier definitions',
              actions: [
                'Navigate to Governance or Institution settings',
                'Define tier labels (Tier 1, Tier 2, Tier 3)',
                'Set caps per tier for each policy',
                'Assign companies to tiers',
                'Students see limits in real-time'
              ]
            }
          ]
        }
      ]
    },
    {
      id: 'company-management',
      title: 'Company Management',
      subsections: [
        {
          id: 'managing-companies',
          title: 'Managing Companies',
          description: 'Create and manage company profiles with logos, tiers, and metadata.',
          content: `Companies are recruitment partners:

• Each company can have multiple recruiter accounts
• Companies are assigned to workflows and cycles
• Company tier affects student shortlist caps
• Historical hire data (e.g., "Hired 47 from IIT Bombay in 2024") enriches analytics`,
          steps: [
            {
              title: 'Creating Companies',
              description: 'Add new companies',
              actions: [
                'Navigate to Companies',
                'Click "Add Company"',
                'Enter company name, website, sector',
                'Upload logo or set logo URL',
                'Set company tier',
                'Add historical hire data (optional)',
                'Save company'
              ]
            },
            {
              title: 'Managing Company Data',
              description: 'Update company information',
              actions: [
                'View company list with search/filter',
                'Edit company details',
                'Update logo and branding',
                'Modify tier classification',
                'Manage historical data',
                'Deactivate if needed'
              ]
            }
          ],
          tips: [
            'Keep company information accurate for recruiter experience',
            'Upload high-quality logos (recommended 200x200)',
            'Historical hire data powers Context Intelligence for recruiters'
          ]
        },
        {
          id: 'recruiter-accounts',
          title: 'Recruiter Account Management',
          description: 'Create and manage recruiter accounts linked to companies.',
          content: `Recruiters are company users:

• Each recruiter is linked to one company
• Recruiters submit JDs, view applications, manage hiring
• You can create recruiters, reset passwords, deactivate
• Activity logs show recruiter actions (JD submissions, application views)`,
          steps: [
            {
              title: 'Adding Recruiters',
              description: 'Create recruiter accounts',
              actions: [
                'Open company profile',
                'Click Recruiters tab',
                'Add Recruiter',
                'Enter email, name',
                'Send invite or set password',
                'Recruiter gets access to company workflows'
              ]
            },
            {
              title: 'Managing Recruiters',
              description: 'Update or revoke recruiter access',
              actions: [
                'View recruiter list per company',
                'Edit details, reset password',
                'Deactivate if recruiter leaves company',
                'Reassign JDs if needed'
              ]
            }
          ]
        },
        {
          id: 'historical-analytics',
          title: 'Historical Analytics',
          description: 'View and manage company-institution historical hire data.',
          content: `Historical data powers analytics:

• Per company-institution: "Google hired 23 from IIT Bombay in 2024"
• Used in Context Intelligence for recruiters (median comp, sector mix)
• Used in placement reports and dashboards
• You can bulk import or manually edit historical records`,
          steps: [
            {
              title: 'Viewing Historical Data',
              description: 'Inspect company hire history',
              actions: [
                'Open company profile',
                'Click Historical Data tab',
                'View table: Institution, Year, Hires, Median Comp',
                'Filter by institution or year'
              ]
            },
            {
              title: 'Editing Historical Data',
              description: 'Update hire counts and comp',
              actions: [
                'Click Edit on a row',
                'Update hire count, median compensation',
                'Add new institution-year rows',
                'Save — analytics update'
              ]
            }
          ]
        },
        {
          id: 'company-institution-relationships',
          title: 'Company-Institution Relationships',
          description: 'Manage which companies recruit at which institutions.',
          content: `Relationships control visibility:

• Company-Institution links determine where a company can post JDs
• E.g., "Google" linked to IIT Bombay, IIT Delhi, BITS Pilani
• Unlinking removes company from institution's active processes
• Relationship history preserved for reporting`,
          steps: [
            {
              title: 'Managing Relationships',
              description: 'Link companies to institutions',
              actions: [
                'Open company or institution',
                'Navigate to Relationships tab',
                'Add/remove institution-company links',
                'Set relationship status (Active, Paused)',
                'Save'
              ]
            }
          ]
        }
      ]
    },
    {
      id: 'access-control',
      title: 'Access Control',
      subsections: [
        {
          id: 'role-definitions',
          title: 'Role Definitions',
          description: 'Understand built-in roles and their default permissions.',
          content: `Roles define permission sets:

• SYSTEM_ADMIN: Full access; manage institutions, users, companies, telemetry, DB, migrations
• INSTITUTION_ADMIN: Manage users, CV templates, governance within institution
• PLACEMENT_ADMIN: Placement ops, analytics, approvals within institution
• PLACEMENT_TEAM: Day-to-day tasks, approvals, workflows
• STUDENT: Applications, CV, calendar
• RECRUITER: JDs, applications, hiring for assigned company
• FACULTY_OBSERVER: Read-only analytics`,
          features: [
            {
              name: 'Role Hierarchy',
              description: 'Higher roles inherit lower role capabilities',
              keyPoints: [
                'SYSTEM_ADMIN > INSTITUTION_ADMIN > PLACEMENT_ADMIN > PLACEMENT_TEAM',
                'RECRUITER and STUDENT are leaf roles',
                'FACULTY_OBSERVER is read-only across analytics'
              ]
            }
          ]
        },
        {
          id: 'permission-matrix',
          title: 'Permission Matrix',
          description: 'View which roles have which permissions across the platform.',
          content: `The permission matrix shows:

• Rows: Permissions (e.g., "users.create", "applications.approve")
• Columns: Roles
• Cells: ✓ or ✗
• Categories: User Management, Placement Ops, CV Management, Analytics, System Admin`,
          steps: [
            {
              title: 'Viewing the Matrix',
              description: 'Inspect role-permission mapping',
              actions: [
                'Navigate to Access Control',
                'Click Permission Matrix tab',
                'Browse by category or search permission',
                'Export matrix for documentation'
              ]
            }
          ]
        },
        {
          id: 'custom-roles',
          title: 'Custom Roles',
          description: 'Create custom roles with granular permission selection.',
          content: `Custom roles extend the default set:

• Create role with a name (e.g., "Placement Coordinator")
• Select permissions from matrix (e.g., applications.view, applications.approve, but not applications.delete)
• Assign custom role to users
• Useful for fine-grained access (e.g., "Analytics Viewer" with only reports)`,
          steps: [
            {
              title: 'Creating a Custom Role',
              description: 'Define new role with specific permissions',
              actions: [
                'Navigate to Access Control → Custom Roles',
                'Click Add Role',
                'Enter role name and description',
                'Select permissions from categories',
                'Save role',
                'Assign to users in People'
              ]
            }
          ],
          tips: [
            'Start from a base role and add/remove permissions',
            'Document custom roles for audit purposes'
          ]
        },
        {
          id: 'permission-categories',
          title: 'Permission Categories',
          description: 'Organize permissions by functional area.',
          content: `Categories group permissions logically:

• User Management: users.create, users.edit, users.delete, users.view, roles.assign
• Placement Ops: applications.approve, workflows.manage, cycles.manage, JDs.approve
• CV Management: cv_templates.manage, cv_verify, cv_export
• Analytics: reports.view, dashboards.view, export.data, sql_editor (if enabled)
• System Admin: institutions.manage, companies.manage, telemetry.view, db.manage, migrations.run`,
          features: [
            {
              name: 'Category Overview',
              description: 'Quick reference for permission scope',
              keyPoints: [
                'User Management: Who can manage people and roles',
                'Placement Ops: Who can run placement workflows',
                'CV Management: Who can manage CV templates and verification',
                'Analytics: Who can view reports and run queries',
                'System Admin: Platform-level controls'
              ]
            }
          ]
        }
      ]
    },
    {
      id: 'telemetry-deep-dive',
      title: 'Telemetry Deep Dive',
      subsections: [
        {
          id: 'performance-monitoring',
          title: 'Performance Monitoring',
          description: 'Monitor API health, latency, and success rates in real time.',
          content: `Performance monitoring provides:

• API health: Per-endpoint status (e.g., /api/v1/applications: 99.2% healthy)
• Request/response metrics: Request count, payload size, response time
• P50/P95/P99 latency: e.g., P95 for /api/v1/applications = 340ms
• Success rate tracking: 2xx vs 4xx vs 5xx over time
• Trend charts: Last 1h, 6h, 24h, 7d`,
          steps: [
            {
              title: 'Viewing API Health',
              description: 'Check endpoint health',
              actions: [
                'Navigate to Telemetry → Performance',
                'Select time range',
                'View endpoint list with status indicators',
                'Click endpoint for detailed latency distribution'
              ]
            },
            {
              title: 'Analyzing Latency',
              description: 'Understand P50/P95/P99',
              actions: [
                'Open latency chart for endpoint',
                'Compare P50 (typical), P95 (slow requests), P99 (outliers)',
                'Identify degradation (e.g., P99 spike after deploy)',
                'Correlate with deployment times'
              ]
            }
          ],
          tips: [
            'P95 is often the best "user experience" metric',
            'Spikes at deploy time are common — monitor for 15–30 min post-deploy'
          ]
        },
        {
          id: 'traffic-analysis',
          title: 'Traffic Analysis',
          description: 'Understand 24-hour traffic patterns, peaks, and anomalies.',
          content: `Traffic analysis reveals:

• 24-hour patterns: e.g., peak at 10–11 AM and 2–4 PM (placement team activity)
• Peak detection: Automatic identification of traffic spikes
• Anomaly identification: Unusual drops or spikes flagged
• Deployment correlation: Overlay deploy timestamps on traffic charts
• Geographic and user-role breakdown (if enabled)`,
          steps: [
            {
              title: 'Viewing Traffic Patterns',
              description: 'Explore request volume over time',
              actions: [
                'Navigate to Telemetry → Traffic',
                'Select 24h or 7d view',
                'View request count by hour',
                'Identify peak hours and quiet periods'
              ]
            },
            {
              title: 'Investigating Anomalies',
              description: 'Understand flagged anomalies',
              actions: [
                'Check Anomalies panel for auto-flagged events',
                'Click anomaly to see context (time, endpoint, error rate)',
                'Correlate with deployments or external events',
                'Document findings for incident review'
              ]
            }
          ],
          tips: [
            'Baseline traffic varies by day-of-week — compare like days',
            'Use deployment overlay to separate "deploy blip" from real issues'
          ]
        },
        {
          id: 'database-health',
          title: 'Database Health',
          description: 'Monitor connection pool, table sizes, query performance, and active connections.',
          content: `Database health metrics include:

• Connection pool: Active vs idle connections (e.g., 12/50 in use)
• Table sizes: Row counts and disk usage per table (e.g., applications: 47,231 rows)
• Query performance: Slow query log, avg execution time per query type
• Active connections: Current queries, lock waits
• Replication lag (if applicable)`,
          steps: [
            {
              title: 'Checking Connection Pool',
              description: 'Ensure pool is not exhausted',
              actions: [
                'Navigate to Telemetry → Database',
                'View Connection Pool widget',
                'Monitor active vs max connections',
                'Alert if usage > 80% of max'
              ]
            },
            {
              title: 'Inspecting Table Sizes',
              description: 'Track growth and plan capacity',
              actions: [
                'Open Table Sizes section',
                'Sort by row count or size',
                'Identify largest tables (e.g., audit_logs, applications)',
                'Plan archival if growth is concerning'
              ]
            },
            {
              title: 'Analyzing Query Performance',
              description: 'Find slow queries',
              actions: [
                'View Slow Queries list',
                'Sort by avg time or call count',
                'Identify N+1 or missing-index patterns',
                'Optimize or add indexes'
              ]
            }
          ],
          tips: [
            'Connection pool exhaustion causes 503s — monitor closely',
            'audit_logs often grows fastest — consider partitioning'
          ]
        },
        {
          id: 'alerts-system',
          title: 'Alerts System',
          description: 'Error spikes, latency degradation, recurring errors, and tail latency monitoring.',
          content: `The alerts system notifies you of:

• Error spike detection: e.g., 5xx rate > 1% for 5 minutes
• Latency degradation: P95 > 2x baseline for 10 minutes
• Recurring error identification: Same error > 10 times in 5 min
• Tail latency monitoring: P99 > threshold
• Configurable thresholds and notification channels (email, Slack, PagerDuty)`,
          steps: [
            {
              title: 'Configuring Alerts',
              description: 'Set up alert rules',
              actions: [
                'Navigate to Telemetry → Alerts',
                'Click Add Alert Rule',
                'Select metric (error rate, latency, etc.)',
                'Set threshold and duration',
                'Add notification channel',
                'Save'
              ]
            },
            {
              title: 'Responding to Alerts',
              description: 'Triage and resolve',
              actions: [
                'Receive alert notification',
                'Open Telemetry dashboard for context',
                'Check recent deployments, traffic, errors',
                'Identify root cause',
                'Fix and verify; silence if false positive'
              ]
            }
          ],
          tips: [
            'Start with conservative thresholds; tune after observing baseline',
            'Use Slack for non-critical; PagerDuty for P0'
          ]
        }
      ]
    },
    {
      id: 'analytics-suite',
      title: 'Analytics Suite',
      subsections: [
        {
          id: 'sql-editor',
          title: 'SQL Editor',
          description: 'Run direct SQL queries with result tables, sorting, filtering, and query saving.',
          content: `The SQL Editor provides:

• Direct SQL: Execute SELECT queries against the database (read-only by default)
• Result tables: Paginated, sortable, filterable results
• Query saving: Save frequently used queries with names
• Syntax highlighting and basic autocomplete
• Export results to CSV
• Query history for repeat runs`,
          steps: [
            {
              title: 'Running a Query',
              description: 'Execute SQL and view results',
              actions: [
                'Navigate to Analytics → SQL Editor',
                'Write or paste SELECT query',
                'Click Run',
                'View results in table below',
                'Sort columns by clicking headers; use filter inputs'
              ]
            },
            {
              title: 'Saving Queries',
              description: 'Store queries for reuse',
              actions: [
                'After running a query, click Save',
                'Enter query name (e.g., "Top companies by applications")',
                'Query appears in Saved Queries list',
                'Click to load and run again'
              ]
            }
          ],
          tips: [
            'Use LIMIT for exploratory queries to avoid large result sets',
            'Saved queries are user-scoped — share via export/import if needed'
          ]
        },
        {
          id: 'visual-query-builder',
          title: 'Visual Query Builder',
          description: 'Build queries with table/column selection, filters, and chart generation.',
          content: `The Visual Query Builder offers:

• Table/column selection: Pick tables and columns via UI (no SQL required)
• Filter building: Add conditions (e.g., applications.status = "SHORTLISTED")
• Aggregations: Count, sum, avg, min, max
• Chart generation: Bar, line, pie from query results
• Export charts as images`,
          steps: [
            {
              title: 'Building a Query',
              description: 'Create query without SQL',
              actions: [
                'Navigate to Analytics → Visual Builder',
                'Select data source (e.g., applications)',
                'Pick columns to display',
                'Add filters (status, date range, institution)',
                'Add aggregations if needed',
                'Run and view results'
              ]
            },
            {
              title: 'Creating a Chart',
              description: 'Visualize query results',
              actions: [
                'After running query, click Chart',
                'Select chart type (bar, line, pie)',
                'Map columns to axes/series',
                'Customize labels and colors',
                'Save or export chart'
              ]
            }
          ]
        },
        {
          id: 'user-funnels',
          title: 'User Funnels',
          description: 'Conversion funnel analysis for candidate application, CV builder, and recruiter hiring flows.',
          content: `User funnels track conversion:

• Candidate application flow: Viewed JD → Applied → Shortlisted → Offered → Accepted (e.g., 1000 → 320 → 89 → 23 → 18)
• CV builder flow: Started → Sections completed → Submitted for verification (e.g., 500 → 412 → 380)
• Recruiter hiring flow: JD posted → Applications received → Shortlisted → Offers sent (e.g., 45 → 230 → 67 → 34)

Each funnel shows drop-off rates and average time between steps.`,
          steps: [
            {
              title: 'Viewing Funnels',
              description: 'Analyze conversion by funnel',
              actions: [
                'Navigate to Analytics → Funnels',
                'Select funnel type (Application, CV, Recruiter)',
                'Select date range and institution',
                'View funnel visualization with counts and conversion %',
                'Drill into step for breakdown (e.g., by company, program)'
              ]
            }
          ],
          tips: [
            'Low conversion at "Applied → Shortlisted" may indicate JD clarity issues',
            'CV funnel drop-off often at "Sections completed" — simplify template'
          ]
        },
        {
          id: 'session-analytics',
          title: 'Session Analytics',
          description: 'Session duration, pages per session, browser/OS distribution, device breakdown.',
          content: `Session analytics provide:

• Session duration: Avg 12.4 min for candidates, 8.2 min for recruiters
• Pages per session: e.g., candidates avg 5.3 pages (Dashboard → Processes → JD → Apply → Applications)
• Browser distribution: Chrome 72%, Safari 18%, Firefox 7%, Edge 3%
• OS distribution: Windows 45%, macOS 38%, Linux 12%, Mobile 5%
• Device breakdown: Desktop 89%, Mobile 9%, Tablet 2%`,
          steps: [
            {
              title: 'Exploring Session Metrics',
              description: 'View session-level analytics',
              actions: [
                'Navigate to Analytics → Sessions',
                'Select date range',
                'View session duration and pages-per-session charts',
                'Filter by role (Candidate, Recruiter, Admin)'
              ]
            },
            {
              title: 'Analyzing Device/Browser Mix',
              description: 'Understand client diversity',
              actions: [
                'Open Device & Browser section',
                'View pie charts for browser, OS, device',
                'Use for compatibility testing priorities',
                'Export for stakeholder reports'
              ]
            }
          ]
        }
      ]
    },
    {
      id: 'platform-operations',
      title: 'Platform Operations',
      subsections: [
        {
          id: 'simulator',
          title: 'Simulator',
          description: 'Data generation and scenario runner with 5 business flows and step-by-step execution.',
          content: `The Simulator supports:

• Data generation: Create synthetic users, applications, companies, JDs for testing
• Scenario runner: Execute predefined business flows
• 5 business flows: Application Flow, JD Submission Flow, Governance Flow, Offer Flow, Cycle Management Flow
• Step-by-step execution: Run flow one step at a time or full run
• Validation: Verify state after each step`,
          steps: [
            {
              title: 'Generating Test Data',
              description: 'Create synthetic data',
              actions: [
                'Navigate to Platform Ops → Simulator',
                'Select Data Generation',
                'Choose entity types (users, applications, companies)',
                'Set counts (e.g., 50 students, 10 companies)',
                'Run generation',
                'Verify in database or UI'
              ]
            },
            {
              title: 'Running a Scenario',
              description: 'Execute business flow',
              actions: [
                'Select scenario (e.g., Application Flow)',
                'Choose step-by-step or full run',
                'Execute — each step shows input/output',
                'Inspect state changes',
                'Use for regression testing'
              ]
            }
          ],
          features: [
            {
              name: 'Business Flows',
              description: 'Predefined end-to-end scenarios',
              keyPoints: [
                'Application Flow: Student applies → shortlisted → offer',
                'JD Submission Flow: Recruiter posts JD → PT approves',
                'Governance Flow: Policy enforcement, approval chains',
                'Offer Flow: Accept, reject, withdraw offers',
                'Cycle Management Flow: Cycle lifecycle transitions'
              ]
            }
          ]
        },
        {
          id: 'testing-portal',
          title: 'Testing Portal',
          description: 'Backend (pytest), Frontend (Vitest), E2E (Playwright), and Simulator test suites.',
          content: `The Testing Portal provides:

• Backend tests: pytest suites for API, services, models
• Frontend tests: Vitest for components, hooks, utils
• E2E tests: Playwright for critical user journeys
• Simulator tests: Integration tests using simulator scenarios
• Test results, coverage reports, and CI integration`,
          steps: [
            {
              title: 'Running Backend Tests',
              description: 'Execute pytest suite',
              actions: [
                'Navigate to Platform Ops → Testing',
                'Select Backend (pytest)',
                'Run full suite or filter by module',
                'View results and coverage'
              ]
            },
            {
              title: 'Running E2E Tests',
              description: 'Execute Playwright tests',
              actions: [
                'Select E2E (Playwright)',
                'Choose test file or full suite',
                'Run — browser opens for visual tests',
                'Review pass/fail and screenshots'
              ]
            }
          ]
        },
        {
          id: 'database-management',
          title: 'Database Management',
          description: 'Table browser, schema inspection, and row counts.',
          content: `Database management includes:

• Table browser: List all tables with row counts
• Schema inspection: View columns, types, indexes, constraints
• Row counts: Quick stats (e.g., users: 2,341, applications: 47,231)
• Read-only by default; write operations require elevated permissions`,
          steps: [
            {
              title: 'Browsing Tables',
              description: 'Explore database structure',
              actions: [
                'Navigate to Platform Ops → Database',
                'View table list with row counts',
                'Click table to see schema (columns, types)',
                'Optionally preview sample rows'
              ]
            }
          ]
        },
        {
          id: 'migrations',
          title: 'Migrations',
          description: 'Applied and pending migrations with version management.',
          content: `Migration management provides:

• Applied migrations: List of executed migrations with timestamps
• Pending migrations: New migrations not yet applied
• Version management: Current DB version, target version
• Run migrations: Apply pending with confirmation
• Rollback: Revert last migration (if supported)`,
          steps: [
            {
              title: 'Viewing Migrations',
              description: 'Check migration status',
              actions: [
                'Navigate to Platform Ops → Migrations',
                'View Applied list (e.g., 001_initial_schema, 002_add_password_hash)',
                'View Pending list (e.g., 010_add_analytics_tables)',
                'Check current vs target version'
              ]
            },
            {
              title: 'Running Migrations',
              description: 'Apply pending migrations',
              actions: [
                'Review pending migrations',
                'Click Run Migrations',
                'Confirm — migrations execute in order',
                'Verify success; check for errors'
              ],
              note: 'Back up database before running migrations in production'
            }
          ],
          tips: [
            'Always test migrations in staging first',
            'Keep migrations small and reversible when possible'
          ]
        }
      ]
    },
    {
      id: 'governance-configuration',
      title: 'Governance Configuration',
      subsections: [
        {
          id: 'platform-governance',
          title: 'Platform Governance',
          description: 'System-wide governance settings, default policy templates, approval chain requirements, and cross-institution rules.',
          content: `Platform governance controls:

• System-wide settings: Default shortlist caps, tier definitions
• Default policy templates: Reusable templates for new institutions
• Approval chain requirements: e.g., JD must be approved by PT before PA
• Cross-institution rules: Optional rules that span institutions (e.g., max applications per student globally)
• Audit: All governance changes logged`,
          steps: [
            {
              title: 'Configuring System-Wide Settings',
              description: 'Set defaults for all institutions',
              actions: [
                'Navigate to Governance → Platform Settings',
                'Set default shortlist cap (e.g., 10)',
                'Define tier labels and default caps',
                'Configure approval chain template',
                'Save — new institutions inherit these'
              ]
            },
            {
              title: 'Managing Policy Templates',
              description: 'Create reusable policy templates',
              actions: [
                'Navigate to Governance → Policy Templates',
                'Create template with name and rules',
                'Set shortlist caps, tier rules, approval flow',
                'Assign template to institutions or use as default'
              ]
            },
            {
              title: 'Setting Approval Chain Requirements',
              description: 'Define who must approve what',
              actions: [
                'Open policy or template',
                'Configure approval chain (e.g., PT → PA for JDs)',
                'Set escalation rules if needed',
                'Save — applies to new workflows'
              ]
            }
          ],
          tips: [
            'Document approval chains for training placement teams',
            'Use templates to ensure consistency across institutions'
          ]
        }
      ]
    },
    {
      id: 'system-audit',
      title: 'System-Wide Audit Logs',
      subsections: [
        {
          id: 'viewing-system-logs',
          title: 'Viewing System Audit Logs',
          description: 'Monitor all system activities across institutions, users, and actions.',
          content: `System audit logs track everything:

• All user actions across all institutions
• System configuration changes (institutions, companies, policies)
• Policy modifications and governance updates
• Workflow changes and cycle transitions
• Security events (logins, permission changes)
• Data access (who viewed what, when)`,
          steps: [
            {
              title: 'Accessing System Logs',
              description: 'View comprehensive audit trail',
              actions: [
                'Navigate to System Audit Logs',
                'Select date range',
                'Filter by institution, user, role, or action type',
                'View detailed logs with timestamps',
                'Export logs for compliance or analysis'
              ]
            },
            {
              title: 'Monitoring System Health',
              description: 'Track system performance and security',
              actions: [
                'Review error logs and failed actions',
                'Monitor user activity patterns',
                'Check for unusual activities (e.g., bulk exports)',
                'Track permission changes',
                'Identify issues early'
              ]
            }
          ],
          tips: [
            'Review logs regularly for security and compliance',
            'Set up alerts for critical events (e.g., SYSTEM_ADMIN login)',
            'Export logs for compliance audits'
          ]
        }
      ]
    },
    {
      id: 'institution-admin-features',
      title: 'Institution Admin Features',
      subsections: [
        {
          id: 'all-features',
          title: 'All Institution Admin Capabilities',
          description: 'You have access to all Institution Admin features across all institutions.',
          content: `As a System Admin, you can perform all Institution Admin functions:

• Manage users in any institution
• View and edit any institution details, programs, batches
• Manage CV templates and verification workflows
• View audit logs for any institution
• All Placement Admin features (workflows, cycles, approvals)
• Governance configuration per institution

Refer to Institution Admin and Placement Admin tutorials for detailed guides on these features.`
        }
      ]
    },
    {
      id: 'best-practices',
      title: 'Best Practices',
      subsections: [
        {
          id: 'system-administration',
          title: 'System Administration Best Practices',
          description: 'Guidelines for effective and secure system administration.',
          content: `Effective system administration requires:

• Careful user management and least-privilege access
• Regular monitoring of telemetry and audit logs
• Security awareness and incident response readiness
• Data protection and backup procedures
• Proactive system maintenance and capacity planning`,
          tips: [
            'Follow principle of least privilege — assign minimum required role',
            'Review user access quarterly; immediately when roles change',
            'Monitor system logs daily; set up alerts for critical events',
            'Keep system and dependencies updated',
            'Backup data regularly; test restore procedures',
            'Document system changes and governance decisions',
            'Communicate with institution admins on policy changes',
            'Plan maintenance windows and communicate in advance',
            'Have disaster recovery and incident response plans',
            'Train institution admins on new features and policies'
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
              question: 'Can I delete an institution?',
              answer: 'Institutions can be deactivated, but deletion requires careful consideration as it affects all associated users and data. Always backup data before any deletion. Use deactivation to disable access while preserving history.'
            },
            {
              question: 'How do I handle user account issues?',
              answer: 'You can reset passwords, change roles, deactivate accounts, and resolve access issues from the People section. Check activity logs for context on what the user was doing before the issue.'
            },
            {
              question: 'What should I monitor in audit logs?',
              answer: 'Monitor for security events (unusual logins, permission changes), unusual activity patterns (bulk exports, mass edits), system errors, and policy violations. Set up alerts for critical events.'
            },
            {
              question: 'How often should I review system access?',
              answer: 'Review user access and permissions at least quarterly. Immediately review when users change roles or leave the organization.'
            },
            {
              question: 'How do I troubleshoot a slow API?',
              answer: 'Use Telemetry → Performance to identify slow endpoints. Check P95/P99 latency, database connection pool, and slow queries. Correlate with recent deployments.'
            },
            {
              question: 'Can I run custom SQL against production?',
              answer: 'The SQL Editor is read-only by default. Write access requires elevated permissions and should be used sparingly. Prefer migrations for schema changes.'
            }
          ]
        }
      ]
    }
  ];
