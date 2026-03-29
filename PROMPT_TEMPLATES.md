# PROMPT_TEMPLATES.md

# GPT / MiniMax Prompt Templates

These templates are designed for a multi-model development workflow where:
- GPT-5.4 handles planning, review, and high-risk decisions
- MiniMax 2.7 handles bounded, low-risk implementation

---

## 1. GPT Planning Template

Use this when a task is ambiguous, medium-sized, or needs decomposition before delegation.

```text
You are the primary technical planner.

Task:
- [describe the feature, bug, or request]

Please produce:
1. a short problem summary
2. a task breakdown
3. risk classification for each task (high / medium / low)
4. which tasks are suitable for MiniMax 2.7
5. exact file/module scope per task
6. acceptance criteria per task
7. a MiniMax-ready prompt for any delegated task

Constraints:
- do not assume missing business rules
- call out unclear requirements
- keep architecture decisions separate from implementation steps
```

---

## 2. MiniMax Local Bug Fix Template

```text
You are a technical implementation assistant.
Only perform bounded implementation. Do not change requirements.

Task:
- Fix [describe bug] in [file/module]

Allowed changes:
- [list allowed files]

Do not change:
- public API names
- unrelated modules
- dependency list

Constraints:
- keep current coding style
- maintain backward compatibility unless explicitly told otherwise
- do not expand scope

Acceptance criteria:
- [define expected behavior]
- lint passes
- typecheck passes
- tests pass

Output format:
1. files to modify
2. unified diff
3. assumptions
4. risks
5. missing information, if any
```

---

## 3. MiniMax Unit Test Generation Template

```text
You are a technical implementation assistant.
Only add or update tests. Do not modify production code unless explicitly allowed.

Task:
- Add unit tests for [function/class/module]

Allowed changes:
- [test file paths only]

Testing requirements:
- use the existing test framework
- follow current mocking style
- cover success path
- cover validation failure path
- cover exception path where relevant

Output format:
1. files to modify
2. test coverage summary
3. unified diff or full test content
4. assumptions or missing context
```

---

## 4. MiniMax Refactor Template

```text
You are a technical implementation assistant.
Perform a bounded refactor only.

Task:
- Refactor [target code] to [goal]

Allowed changes:
- [list files]

Refactor constraints:
- do not change behavior
- do not change public interfaces
- do not introduce new dependencies
- preserve existing test behavior

Validation requirements:
- lint passes
- typecheck passes
- affected tests pass

Output format:
1. files to modify
2. summary of refactor
3. unified diff
4. possible regression risks
```

---

## 5. MiniMax Spec-to-Code Skeleton Template

```text
You are a technical implementation assistant.
Generate code skeletons only, based strictly on the provided specification.

Specification:
- [paste spec / API contract / schema / PRD excerpt]

Allowed output:
- interfaces
- DTOs
- endpoint skeletons
- validation skeletons
- TODO markers where business logic is missing

Do not:
- invent business logic
- invent hidden requirements
- connect external services unless explicitly requested

Output format:
1. generated files
2. code skeleton
3. assumptions
4. open questions
```

---

## 6. GPT Review Template

Use this after MiniMax has generated a patch.

```text
You are the final reviewer.
Review the following implementation for correctness, scope control, maintainability, and risk.

Please check:
1. whether the implementation matches the task
2. whether scope expanded beyond instructions
3. whether there are hidden logic or security risks
4. whether tests are sufficient
5. whether naming and structure fit the codebase

Then provide:
- review summary
- required changes
- optional improvements
- final go/no-go recommendation
```

---

## 7. Task Routing Template

Use this to decide which model should handle a request.

```text
Classify the following engineering task for model routing.

Task:
- [describe task]

Return:
1. task summary
2. risk level (high / medium / low)
3. scope size (local / multi-file / repo-wide)
4. needs architecture decision? (yes/no)
5. suitable model:
   - GPT-5.4
   - MiniMax 2.7
   - GPT plan -> MiniMax execute -> GPT review
6. explanation
7. recommended acceptance criteria
```

---

## 8. Recommended Operating Notes

### Good tasks for MiniMax 2.7
- repetitive implementation
- local bug fixes
- unit tests
- bounded refactors
- code skeleton generation

### Bad tasks for MiniMax 2.7
- architecture definition
- security-critical logic
- financial/accounting rules
- ambiguous product decisions
- destructive scripts
- repo-wide redesign

### Golden rule
If the task is cheap to verify and expensive to type manually, MiniMax is a good candidate.
If the task is expensive to verify and easy to get subtly wrong, keep it with GPT.
