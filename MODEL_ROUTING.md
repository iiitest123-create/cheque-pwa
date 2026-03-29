# MODEL_ROUTING.md

# Multi-Model Task Routing Policy

## Purpose

This document defines how work is routed between the primary model (GPT-5.4) and the technical assistant model (MiniMax 2.7).

Core principle:
- **GPT-5.4 decides**
- **MiniMax 2.7 executes bounded technical tasks**

---

## Model Roles

### GPT-5.4
Use GPT-5.4 for:
- architecture design
- requirement clarification
- technical planning
- tradeoff analysis
- complex debugging strategy
- security-sensitive changes
- accounting / financial logic
- final review and approval

### MiniMax 2.7
Use MiniMax 2.7 for:
- boilerplate code generation
- unit test creation
- type fixes
- local refactors
- small bug fixes
- parser / formatter utilities
- CRUD scaffolding
- spec-to-code skeleton work

---

## Routing Rules

## Route to GPT-5.4 if any of the following is true
- task involves architecture or technical direction
- task touches auth, permissions, secrets, payments, or financial calculations
- task may delete or transform production data
- task includes schema or migration design
- task requires repo-wide understanding
- task is ambiguous or underspecified
- task impact is high and failure is costly

## Route to MiniMax 2.7 if all of the following are true
- task scope is local and bounded
- requirements are explicit
- acceptance criteria are clear
- change can be validated by tests, lint, or typecheck
- no architectural decision is required
- no security-sensitive logic is involved

## Route through collaborative flow if any of the following is true
- task is medium-sized but can be decomposed
- task spans multiple files but remains low risk
- GPT can define a patch plan before implementation
- output benefits from a draft-review workflow

Collaborative flow:
1. GPT writes the implementation plan
2. MiniMax produces code within the plan
3. GPT reviews, corrects, and finalizes

---

## Risk Classification

### High Risk
Examples:
- authentication / authorization
- billing / payment
- accounting logic
- database schema changes
- production incident fixes
- encryption / secrets handling
- destructive scripts

Default route:
- GPT-5.4 only

### Medium Risk
Examples:
- multi-file feature work with clear requirements
- non-critical API changes
- internal services refactor
- migration draft with strong review

Default route:
- GPT plan + MiniMax execution + GPT review

### Low Risk
Examples:
- unit tests
- local bug fixes
- type improvements
- repetitive CRUD work
- documentation-derived skeleton code

Default route:
- MiniMax 2.7

---

## Task Intake Checklist

Before assigning a model, confirm:
- What is the exact goal?
- Which files/modules are allowed to change?
- What must not change?
- How will success be validated?
- What is the risk level?
- Is repo-wide context required?
- Is there any security, finance, or data integrity concern?

If these are not clear, GPT-5.4 must clarify first.

---

## Output Requirements for MiniMax 2.7

Every MiniMax task should request:
1. list of files to modify
2. unified diff or bounded code output
3. assumptions and risks
4. explicit notice of missing information

MiniMax should not:
- invent requirements
- broaden task scope
- rewrite unrelated code
- introduce new dependencies unless explicitly allowed

---

## Validation Requirements

No model output is accepted without validation.

Minimum validation:
- lint
- typecheck
- unit tests

Recommended additional validation when applicable:
- integration tests
- build verification
- security scan
- reviewer signoff

---

## Escalation Rules

Escalate from MiniMax to GPT if:
- requirements are incomplete
- implementation touches more files than expected
- tests fail in unclear ways
- logic appears security-sensitive
- output requires architectural judgment
- task drifts beyond original bounds

---

## Decision Matrix

| Task Type | Risk | Preferred Route |
|---|---:|---|
| Architecture design | High | GPT-5.4 |
| Auth / permissions | High | GPT-5.4 |
| Accounting logic | High | GPT-5.4 |
| Database migration design | High | GPT-5.4 |
| Medium feature with clear spec | Medium | GPT -> MiniMax -> GPT |
| Multi-file low-risk refactor | Medium | GPT -> MiniMax -> GPT |
| Unit tests | Low | MiniMax 2.7 |
| Small bug fix | Low | MiniMax 2.7 |
| Type cleanup | Low | MiniMax 2.7 |
| CRUD scaffolding | Low | MiniMax 2.7 |

---

## Management Summary

Use GPT-5.4 as the strategist and reviewer.
Use MiniMax 2.7 as the fast, bounded implementation worker.

The routing system exists to reduce cost, improve speed, and prevent low-quality delegation.

If unsure, route upward to GPT first.
