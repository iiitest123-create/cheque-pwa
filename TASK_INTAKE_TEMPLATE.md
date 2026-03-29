# TASK_INTAKE_TEMPLATE.md

# Engineering Task Intake Template

Use this template before routing work to GPT-5.4 or MiniMax 2.7.

---

## 1. Basic Information

**Task Title:**

**Requester:**

**Date:**

**Priority:** High / Medium / Low

**Deadline:**

---

## 2. Business Context

**Business Goal:**
- Why does this task matter?
- What outcome is expected?

**User / Stakeholder Impact:**
- Who is affected?
- What breaks if this is not done?

---

## 3. Technical Objective

**Technical Goal:**
- What must be built, changed, fixed, or analyzed?

**Task Type:**
- Bug Fix
- Feature
- Refactor
- Test Generation
- Migration
- Documentation to Code
- Review
- Investigation
- Other:

---

## 4. Scope

**Affected Files / Modules:**
- List known files or modules

**Allowed Changes:**
- What is allowed to change?

**Forbidden Changes:**
- What must not change?
- Public APIs?
- Database schema?
- Dependencies?
- External integrations?

**Scope Size:**
- Local
- Multi-file
- Repo-wide

---

## 5. Risk Assessment

**Risk Level:** High / Medium / Low

**Why this risk level:**
- auth / permission impact?
- finance / accounting impact?
- data integrity impact?
- security impact?
- production impact?

**Sensitive Areas Involved:**
- Authentication / Authorization
- Billing / Payment
- Accounting Logic
- Database Migration
- Secrets / Tokens
- User Data
- Production Operations
- None

---

## 6. Requirements Clarity

**Requirement Clarity:**
- Clear
- Partial
- Ambiguous

**Missing Information:**
- What is still unclear?
- What assumptions are unsafe?

---

## 7. Acceptance Criteria

**Expected Outcome:**
- What should be true when task is done?

**Validation Method:**
- lint
- typecheck
- unit test
- integration test
- build
- manual QA
- code review

**Definition of Done:**
- List pass/fail conditions

---

## 8. Recommended Model Route

**Recommended Route:**
- GPT-5.4
- MiniMax 2.7
- GPT plan -> MiniMax execute -> GPT review

**Reason:**
- Why is this route appropriate?

---

## 9. Delegation Prompt Draft

If routing to MiniMax 2.7, prepare:

**Task Prompt Draft:**
```text
Task:
- 

Allowed changes:
- 

Do not change:
- 

Constraints:
- 

Acceptance criteria:
- 

Output format:
1. files to modify
2. unified diff
3. assumptions
4. risks
5. missing information
```

---

## 10. Review Notes

**Reviewer:**

**Review Required:** Yes / No

**Special Review Focus:**
- correctness
- scope control
- naming
- maintainability
- security
- financial logic
- test coverage

---

## 11. Post-Execution Notes

Fill this after completion.

**Actual Route Used:**

**Validation Result:**

**Review Result:**

**Issues Encountered:**

**Prompt Improvements Learned:**

**Would Delegate Again?:** Yes / No / With Conditions

---

## Quick Routing Rule

Use this shortcut:
- If task is high-risk or ambiguous -> GPT-5.4
- If task is local, clear, and easy to verify -> MiniMax 2.7
- If task is medium complexity but plannable -> GPT plan -> MiniMax -> GPT review

---

## Manager Note

Cheap to verify + annoying to type manually = great for MiniMax.
Expensive to verify + easy to get subtly wrong = keep with GPT.
