# BRD — Ithras AI Career Growth Agent (Job-Seeker First)

## 1) Executive summary

Ithras will pivot from a social-first professional platform to an **AI-led career preparation and job-matching platform** where the hero experience is a multimodal (chat + voice) career agent.

The user journey starts with a premium landing screen and a “Talk / Chat” pill switcher. The agent then conducts progressive profile discovery, builds a structured career profile, generates a CV, coaches interview preparation, runs mock interviews, evaluates readiness via a score model, and guides users to best-fit jobs with clear fit reasoning.

Communities remain available but become secondary support surfaces (peer accountability, interview experiences, referrals).

---

## 2) Product vision and positioning

### Vision
"Your AI professional growth agent that gets you job-ready and job-matched end-to-end."

### Product positioning
- **Primary value:** Personalized, agentic preparation-to-placement workflow.
- **Secondary value:** Professional community and social proof.
- **Differentiator:** Unified profile graph powering CV, readiness scoring, mock interviews, and fit-based job recommendations.

---

## 3) Target users and personas

### Primary personas
1. **Early-career job seeker (Jack)**
   - Needs role clarity, resume building, interview prep.
   - Struggles with translating projects to role-ready narratives.
2. **Career switcher (Jill)**
   - Needs transferable-skill mapping and realistic transition plan.
   - Requires gap analysis and focused upskilling plan.
3. **Active applicant under time pressure**
   - Needs quick, high-confidence interview prep for specific roles.

### Secondary personas
- Returning professionals after a break.
- Final-year students preparing for first role.

---

## 4) Problem statement

Current platform orientation skews social/community. Job seekers need a guided, outcomes-driven flow that:
- captures intent quickly,
- constructs a high-quality career profile with minimal friction,
- transforms profile into interview and application readiness,
- continuously improves readiness and role fit.

---

## 5) Goals and non-goals

### Goals
- Build a conversion-optimized landing and onboarding into AI agent flow.
- Capture robust structured + unstructured candidate profile data.
- Provide measurable preparation outcomes (readiness score and sub-scores).
- Deliver actionable role recommendations with transparent fit analysis.
- Increase interview conversion and placement outcomes.

### Non-goals (Phase 1)
- Building full ATS/recruiter suite.
- Replacing community modules entirely.
- Enterprise analytics breadth beyond core candidate-readiness metrics.

---

## 6) North-star KPI and supporting metrics

### North-star KPI
- **Qualified readiness completion rate**: % of new users reaching readiness threshold (e.g., 75/100) within 14 days.

### Supporting KPIs
- Landing-to-agent-start conversion.
- Agent onboarding completion rate.
- Time to first CV draft.
- Mock interview sessions per user.
- Readiness score uplift over first 2 weeks.
- Job recommendation click-through and apply-start rate.
- Interview invite rate (self-reported or integrated).

---

## 7) End-to-end user journey (target state)

1. **Landing screen**
   - Elegant typography, clear value proposition.
   - Top-right nav: **About Us** and **Login**.
   - Bottom interaction dock with **Chat | Voice** pill switcher.
2. **Intent capture**
   - “What role are you targeting?” + timeline + location + compensation preference.
3. **Guided deep profiling**
   - Agent asks adaptive questions on experience, projects, skills, outcomes, constraints.
   - Voice and chat both produce structured profile updates.
4. **Profile synthesis**
   - Career graph with competencies, strengths, gaps, evidence.
5. **CV build**
   - AI-generated ATS-conscious CV versions by role.
6. **Interview prep engine**
   - Role-specific question banks, mock interviews, feedback loops.
7. **Readiness dashboard**
   - Composite score + domain scores (resume, role fit, interviews, skills).
8. **Upskilling plan**
   - Prioritized tasks to raise readiness score.
9. **Job fit matching**
   - Recommended jobs with fit explanations and confidence indicators.
10. **Community support (secondary)**
   - Optional communities for peer learning and accountability.

---

## 8) Functional requirements

## FR-A: Landing + entry
- Premium hero layout with strong trust indicators.
- Chat/Voice pill switcher in bottom input dock.
- Persistent About Us and Login at top right.
- CTA paths:
  - Start as guest (limited profile).
  - Login/register for persistence.

## FR-B: Multimodal AI agent
- Chat and voice modalities share one canonical session state.
- Agent orchestrates multi-step discovery conversation.
- Context memory with explicit user approval for sensitive data.
- Clarification prompts when ambiguity exists.

## FR-C: Dynamic profile builder
- Collect and normalize:
  - Role targets, industries, locations.
  - Education, experience, projects, achievements.
  - Hard/soft skills with confidence + evidence.
  - Work constraints (visa, remote/hybrid, salary range).
- Build structured backend profile continuously while conversing.

## FR-D: CV and narrative generation
- Generate baseline CV + role-tailored variants.
- Bullet rewriting with impact metrics.
- Role-specific summary generation.
- Export options (PDF/doc as applicable in existing stack).

## FR-E: Interview prep and mock interviews
- Behavioral + technical + role-specific mocks.
- Voice mock mode with transcript and scoring.
- Feedback categories: clarity, structure, relevance, confidence, domain depth.
- Iterative retry and improvement tracking.

## FR-F: Readiness scoring dashboard
- Composite readiness score (0–100).
- Sub-scores:
  - Profile completeness.
  - CV quality.
  - Interview preparedness.
  - Skills-role alignment.
- “What to do next” recommendations tied to score impact.

## FR-G: Skills assessment + upskilling
- Lightweight assessments by role track.
- Gap detection and learning path suggestions.
- Completion-driven score uplift.

## FR-H: Job matching and fit reasoning
- Job cards ranked by fit score.
- Explainability layer (“why this is a fit”).
- Mismatch reasons and remediation suggestions.

## FR-I: Community integration (secondary)
- Communities surfaced as optional accelerators, not primary navigation.
- Contextual prompts (e.g., “join interview prep community for Data Analyst”).

---

## 9) Conversation design: multiple-prompt setup

## 9.1 Prompt orchestration model
Use a **router + specialist prompts** model. Each user session has an orchestration layer that decides which specialist prompt to invoke.

### Prompt roles
1. **P0 Orchestrator Prompt**
   - Determines stage (intake, profile, CV, interview, jobs).
   - Maintains session plan and next best question.
2. **P1 Intent & Goal Discovery Prompt**
   - Identifies target role(s), urgency, constraints.
3. **P2 Background Extraction Prompt**
   - Converts free-form responses into structured profile schema.
4. **P3 CV Optimization Prompt**
   - Generates and refines CV bullets and role-fit narrative.
5. **P4 Interview Coach Prompt**
   - Conducts mock interviews and produces rubric feedback.
6. **P5 Readiness Scoring Prompt**
   - Converts evidence into readiness sub-scores and recommended actions.
7. **P6 Job Fit Matching Prompt**
   - Matches user profile against job descriptors; produces fit rationale.
8. **P7 Safety & Quality Guardrail Prompt**
   - Checks harmful/biased advice, confidence calibration, policy constraints.

## 9.2 Shared context contract
Each prompt should receive:
- `user_profile_structured`
- `conversation_summary`
- `active_goal`
- `stage`
- `confidence_state`
- `last_user_input`
- `modality` (chat|voice)

## 9.3 Prompt handoff rules
- Do not ask duplicate questions if structured data already exists with high confidence.
- If confidence < threshold, ask one clarifying question before generating deliverables.
- Before major outputs (CV rewrite, readiness score), run guardrail pass.

## 9.4 Sample stage progression
- Stage 1: Discover intent (P1)
- Stage 2: Build profile graph (P2)
- Stage 3: Generate CV artifacts (P3)
- Stage 4: Run mock interview (P4)
- Stage 5: Score readiness (P5)
- Stage 6: Recommend jobs (P6)
- Cross-stage: Safety checks (P7)

---

## 10) Data model additions (candidate profile graph)

Proposed entities:
- `career_goal`
- `skill_evidence`
- `experience_achievement`
- `interview_session`
- `readiness_score_snapshot`
- `assessment_result`
- `job_fit_evaluation`
- `action_plan_item`

Each should support timestamped versioning for longitudinal progress.

---

## 11) Dashboard requirements

### Primary widgets
- Current readiness score + trend.
- Role target fit panel (top 3 roles).
- CV quality checklist.
- Mock interview history and improvement chart.
- Skill gap heatmap.
- Next 3 highest-impact actions.

### UX principles
- Explanatory, not just evaluative (“why score changed”).
- Immediate actions available from each widget.

---

## 12) Information architecture changes

## Primary nav (proposed)
1. Home (Agent entry)
2. My Prep Dashboard
3. CV Studio
4. Interview Lab
5. Job Matches
6. Community (secondary)

Social feed should no longer be default landing route.

---

## 13) Release roadmap

## Phase 0 (2–3 weeks): Foundation
- Landing redesign.
- Chat/voice input dock + modality switch.
- Intent capture and profile schema.

## Phase 1 (4–6 weeks): Core prep engine
- Profile builder + CV generation.
- Basic readiness scoring.
- Initial dashboard.

## Phase 2 (4–6 weeks): Interview + job fit intelligence
- Mock interview loops.
- Job fit scoring with explainability.
- Upskilling recommendation engine.

## Phase 3: Optimization and expansion
- Advanced personalization.
- More assessment tracks.
- Community-powered prep cohorts.

---

## 14) Risks and mitigations

- **Risk:** Hallucinated or low-quality guidance.
  - **Mitigation:** Guardrail prompt + confidence thresholds + explicit uncertainty language.
- **Risk:** User drop-off during onboarding.
  - **Mitigation:** Progressive profiling, save-state, and quick-start mode.
- **Risk:** Biased matching outcomes.
  - **Mitigation:** Fairness checks and explainability with appeal path.
- **Risk:** Over-scoring anxiety.
  - **Mitigation:** Emphasize progress deltas and actionability over labels.

---

## 15) Open decisions for stakeholder alignment

1. Which initial role families should be supported in v1 (e.g., SWE, Data Analyst, PM, Sales)?
2. How should readiness scoring be weighted across CV/interview/skills?
3. What level of job-source integration is in scope initially (internal listings only vs external aggregators)?
4. Is guest mode allowed to generate CV before login, or gated post-auth?
5. What is the acceptable latency target for voice interactions?

---

## 16) Immediate implementation tasks on current codebase

1. Audit current `/prepare` and `/jobs` surfaces and map reuse candidates.
2. Introduce new landing shell component and top-right auth/about nav standard.
3. Build conversation session state contract shared by chat and voice.
4. Implement prompt orchestration service with stage machine.
5. Add profile graph tables and APIs.
6. Add readiness scoring service and dashboard endpoint.
7. Reposition community links as supportive modules.

---

## 17) Discovery questions for product/business (next workshop)

### Strategy and outcomes
1. What business metric matters most in first 90 days: activation, retention, interview conversion, or apply conversion?
2. Which geography and job market should v1 optimize for first?

### User and UX
3. Should first-run experience be fully conversational, or include a quick form shortcut?
4. Do we want a one-screen premium landing before auth, or direct-to-agent for returning users?

### AI behavior
5. What is the brand voice of the agent (mentor, coach, recruiter-like advisor)?
6. How assertive should recommendations be vs neutral options?

### Data and integrations
7. Which existing profile data can be migrated from current platform surfaces?
8. Which external providers (speech-to-text, TTS, job feeds) are preferred?

### Monetization and packaging
9. Which modules are free vs premium (mock interviews, deep fit analysis, unlimited CV variants)?
10. Do we need institution/company sponsored pathways in this new model?

