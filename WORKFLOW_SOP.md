# WORKFLOW_SOP.md

# Multi-Model Development Workflow SOP

## Purpose

This SOP defines the standard workflow for using GPT-5.4 and MiniMax 2.7 in software development.

Operating principle:
- GPT-5.4 handles planning, risk judgment, and final review
- MiniMax 2.7 handles bounded, low-risk implementation work

---

## Workflow Overview

1. Task intake
2. Task classification
3. Model routing
4. Prompt preparation
5. Implementation
6. Validation
7. Review and approval
8. Documentation and learning capture

---

## Step 1: Task Intake

Every request should begin with a structured intake.

Required fields:
- task title
- business goal
- technical objective
- affected files/modules
- constraints
- prohibited changes
- acceptance criteria
- deadline / priority
- risk notes

If any of these are missing and the task is not trivial, GPT-5.4 should clarify first.

---

## Step 2: Task Classification

Classify the task by:
- risk: high / medium / low
- scope: local / multi-file / repo-wide
- clarity: clear / partial / ambiguous
- validation: strong / partial / weak

### Classification guidance

#### High risk
- auth / permissions
- billing / finance / accounting
- schema / migration design
- destructive operations
- security-sensitive logic
- production incident repair

#### Medium risk
- medium feature work with defined boundaries
- multi-file refactor
- internal API changes
- migration drafts requiring review

#### Low risk
- unit tests
- type cleanup
- boilerplate generation
- small local bug fixes
- bounded code skeleton work

---

## Step 3: Model Routing

Apply the routing policy from `MODEL_ROUTING.md`.

### Route to GPT-5.4
Use GPT-5.4 directly when:
- architectural decisions are needed
- requirements are unclear
- business logic is sensitive
- repo-wide context is required
- failure cost is high

### Route to MiniMax 2.7
Use MiniMax directly when:
- task is local and bounded
- requirements are explicit
- acceptance criteria are clear
- implementation is cheap to verify

### Route through collaboration
Use collaborative routing when:
- GPT can define the plan clearly
- MiniMax can implement within fixed bounds
- GPT can review and finalize

Standard collaborative pattern:
1. GPT defines the patch plan
2. MiniMax generates the patch
3. GPT reviews and adjusts

---

## Step 4: Prompt Preparation

All delegated tasks must use structured prompts.

Prompt must include:
- exact task objective
- allowed files
- forbidden changes
- coding constraints
- validation requirements
- output format

Prompt templates are stored in `PROMPT_TEMPLATES.md`.

Never delegate with vague requests like:
- "fix this"
- "refactor it"
- "improve this code"

That is not delegation. That is inviting chaos.

---

## Step 5: Implementation

### GPT-led tasks
For GPT-led tasks:
- produce plan
- implement or guide implementation
- note assumptions explicitly
- keep change scope visible

### MiniMax-led tasks
For MiniMax-led tasks:
- require file list first
- prefer unified diff output
- reject scope expansion
- require assumptions and risks

If MiniMax output exceeds bounds, return it for revision or escalate to GPT.

---

## Step 6: Validation

No implementation is accepted without validation.

### Minimum validation
- lint
- typecheck
- unit tests

### Additional validation as needed
- integration tests
- build
- smoke tests
- security checks
- manual QA

### Validation rule
If validation fails:
- do not merge
- do not assume the model is "mostly right"
- either revise or escalate

---

## Step 7: Review and Approval

Every non-trivial task should receive final review.

### Review checklist
- does the change match the task?
- did scope drift occur?
- are there hidden edge cases?
- is the code maintainable?
- are tests sufficient?
- are naming and patterns consistent?
- is there any business or security risk?

### Final authority
- low-risk work may be approved after review and validation
- medium/high-risk work requires GPT or human signoff

---

## Step 8: Documentation and Learning Capture

For each completed task, capture:
- task type
- routed model
- validation result
- review result
- failure patterns
- useful prompt patterns
- time saved or rework caused

This builds an internal operating memory for future routing decisions.

---

## Escalation Rules

Escalate to GPT-5.4 or human review when:
- requirements are incomplete
- validation fails unexpectedly
- implementation touches more files than planned
- business rules appear unclear
- task becomes security-sensitive
- output quality is unstable

---

## Suggested Team Cadence

### Daily
- use task intake template
- route by policy
- validate all model output

### Weekly
- review failed delegations
- improve prompt templates
- tighten routing rules

### Monthly
- audit model usage quality
- identify high-yield delegation categories
- remove low-value or high-risk delegation patterns

---

## Management Summary

This workflow is designed to:
- reduce manual coding time
- keep high-risk decisions under tighter control
- improve throughput without lowering standards
- create a repeatable delegation system

In plain terms:
- GPT thinks
- MiniMax builds
- validation catches nonsense
- review protects the business
