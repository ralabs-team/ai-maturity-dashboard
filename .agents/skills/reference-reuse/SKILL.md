---
name: reference-reuse
description: Searches the core reference project (openthedoors-app) for existing implementations, patterns, and corner-case handling to ensure logic consistency and reuse. Use when starting a new feature or researching how to implement specific logic.
---

# Reference Reuse (openthedoors-app)

This skill guides the agent to leverage the `openthedoors-app` codebase as a primary reference to reuse proven logic and handle corner cases consistently.

## Instructions

When the user requests a new feature or a complex change:

1. **Identify the Reference Goal**: Determine what logic, components, or patterns might already exist in the reference project.
2. **Search the Reference Project**: Use search tools (Grep, Glob, or Shell) to explore the reference project path: `/Users/romanr/Development/ralabs-openthedoors-app/`.
3. **Analyze Implementation Details**: Look for:
    - How corner cases are handled (error states, empty data, loading states).
    - Validation logic (Zod schemas, frontend validation).
    - Architecture patterns (tRPC procedures, React hooks, UI components).
4. **Compare and Adapt**: Evaluate how the reference logic can be adapted or reused in the current project.
5. **Suggest Reuse**: Propose the reuse of specific modules or patterns in your implementation plan, highlighting how it addresses corner cases identified in the reference.
6. **Follow the KISS Principle**: While reusing logic, ensure the resulting implementation in the current project remains simple and focused on the MVP.

## Workflow for Search

Use these patterns to explore the reference project:

### Searching for Files
Use `Glob` with the reference path:
```json
{
  "glob_pattern": "**/*.tsx",
  "target_directory": "/Users/romanr/Development/ralabs-openthedoors-app/"
}
```

### Searching for Code
Use `Grep` with the reference path:
```json
{
  "pattern": "export pdf",
  "path": "/Users/romanr/Development/ralabs-openthedoors-app/"
}
```

### Finding Corner Cases
Look for keywords like `error`, `catch`, `null`, `undefined`, `Loading`, or specific validation logic in the reference files.

## Examples

**User**: "I want to add a way for users to export project reports to PDF."

**Agent**: "I'll check how we implemented PDF export in `openthedoors-app` to ensure we handle all corner cases and reuse proven logic:

1. **Searching**: I'm searching for 'pdf' and 'export' in `/Users/romanr/Development/ralabs-openthedoors-app/`.
2. **Analysis**: I found that the reference project uses a specific library and has a robust error handling flow for empty reports.
3. **Proposal**: I'll adapt that logic here, focusing on the simplest MVP version while keeping the corner-case handling for reliability."

---
*Note: This skill ensures we don't reinvent the wheel and build on top of established solutions.*
