---
name: feature-brief-clarifier
description: Use when the user asks to implement a new feature, major enhancement, new page, new API, or meaningful behavior change in this repo. Before any implementation work, ask at least 5 concise clarification questions that cover the goal, audience, scope, UX, technical constraints, and acceptance criteria. Do not start coding until the user answers or explicitly asks you to proceed with assumptions.
---

# Feature Brief Clarifier

Use this skill as the intake gate for new feature work. The goal is to replace vague implementation starts with a short, structured discovery pass that gets enough detail to build confidently.

## When To Use It

Use this skill when the request is any of the following:

- A new feature
- A substantial enhancement to existing behavior
- A new page, route, dashboard section, or API endpoint
- A request that changes user workflow or data flow

Skip this skill for:

- Small bug fixes
- Copy-only tweaks
- Refactors with no behavioral change
- Requests where the user explicitly says to proceed with assumptions

## Required Workflow

1. Pause implementation.
2. Inspect the repo briefly so the questions are grounded in the existing product.
3. Ask a single batch of at least 5 targeted questions before proposing code changes.
4. Wait for the user's answers.
5. Only begin implementation after the user answers, or after the user explicitly instructs you to proceed with assumptions.
6. After implementation is complete or nearly complete, run the `post-feature-review` skill before the final response.

Do not start coding, editing files, or presenting a full implementation plan before step 4 is complete.

## Question Rules

- Ask 5 to 8 questions in one message.
- Keep questions concise and specific to the request.
- Prefer questions the user can answer quickly.
- Avoid asking for information that is already clearly available in the request or the repo.
- If the user already provided some detail, still ask enough questions to confirm at least 5 decision-critical dimensions.

The 5 minimum dimensions to cover are:

1. Desired outcome or user problem
2. Target user or audience
3. Scope and non-goals
4. UX or workflow expectations
5. Acceptance criteria or definition of done

Add technical questions when relevant:

- Data model or API impact
- Auth, permissions, or workspace rules
- Edge cases and failure states
- Rollout, migration, or backward-compatibility constraints

## Response Format

Ask the questions as a short numbered list. After the list, invite the user to answer inline. Example shape:

1. What user problem should this feature solve?
2. Who is the primary user for it?
3. What is explicitly in scope for the first version?
4. Are there any out-of-scope items we should avoid?
5. What should a successful end-to-end flow look like?
6. How will we know the feature is done?

Answer inline or send short bullets, and then implementation can start.

## Scope Guardrails

- If the request is ambiguous, ask more than 5 questions rather than guessing.
- If the user refuses to answer and still wants progress, state the assumptions clearly before implementation.
- If the request touches multiple surfaces, group questions so they still feel lightweight.
- Prefer discovery over premature solutioning.

## Reference Map

Read [references/question-bank.md](references/question-bank.md) when you need a stronger question set for UI, API, data, or workflow-heavy features.
