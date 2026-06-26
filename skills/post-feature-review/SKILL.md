---
name: post-feature-review
description: Use when implementation work for the current request is complete or nearly complete in this repo. Trigger after you have made code changes, when you are preparing the final response, when the user asks for a review, or when the current staged or unstaged diff likely represents a finished feature, enhancement, refactor, or bug fix. Do not wait for the user to explicitly say the feature is done.
---

# Post-Feature Review

Use this skill as the default final quality pass after implementation work and before the final user-facing answer.

## Completion Gate

Treat the work as ready for this review when one or more of these are true:

- You already edited files for the current request
- You believe the requested implementation is done or nearly done
- You are about to summarize work in the final response
- There is a coherent staged or unstaged diff for the current request
- The user explicitly asks for a review, refactor pass, cleanup pass, or architecture feedback

Do not wait for the user to say "the feature is finished" if the implementation work in the current turn has effectively reached that point.

## Goal

Review the active change set like a senior reviewer and architect, with emphasis on:

- bugs or regression risk
- refactoring opportunities
- duplicated logic that should be removed or consolidated
- missing tests or documentation
- file naming quality
- variable naming quality
- overcomplicated logic or over-engineering
- whether files belong in the right folders
- dead code, temporary code, or cleanup opportunities

## Scope Selection

Choose the review scope automatically in this order:

1. If there are staged changes, review the staged diff first.
2. Otherwise, if there are unstaged tracked changes, review the working tree diff.
3. Otherwise, review the latest commit relevant to the current request.

Always state which scope you reviewed.

## Workflow

1. Inspect the repo state with git commands such as:
   - `git status --short`
   - `git diff --name-only --cached`
   - `git diff --name-only`
   - `git diff --cached`
   - `git diff`
   - `git show --stat --name-only --format=fuller HEAD` when falling back to the latest commit
2. Read the changed files carefully before commenting.
3. Review with a code-review mindset first:
   - bugs or regression risk
   - maintainability issues
   - weak abstractions
   - duplication
   - missing validation or edge-case handling
   - naming and folder placement concerns
4. Then look for secondary improvements:
   - missing docs, comments, or follow-up TODOs
   - test gaps
   - cleanup opportunities

## Output Rules

Follow this response structure:

1. Findings first, ordered by severity, with file references.
2. Open questions or assumptions, only if needed.
3. A short improvement list for lower-priority refactors, docs, naming, or structure ideas.

If there are no meaningful findings, say that explicitly and still mention:

- residual risks
- test or documentation gaps
- any optional cleanup ideas

## Review Heuristics

Pay special attention to:

- repeated validation, formatting, mapping, or branching logic
- overgrown hooks, components, services, or route handlers that want extraction
- file names that hide intent or use inconsistent naming patterns
- files placed in broad folders when a closer domain folder exists
- feature code that leaks shared concerns into app-specific locations
- commented-out code, debug helpers, or one-off leftovers
- docs that should be updated because behavior, setup, or architecture changed

## Tone

Be direct and practical. Prefer specific suggestions over generic advice. Keep the review focused on the actual changed files instead of broad theoretical cleanup.
