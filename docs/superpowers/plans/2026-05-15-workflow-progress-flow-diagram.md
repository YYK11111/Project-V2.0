# Workflow Progress Flow Diagram Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the workflow progress tab to show the full workflow definition graph with current and completed node states.

**Architecture:** Fetch the instance-scoped workflow definition alongside instance, task, and history context. Pass definition and history into `WorkflowProgressView`, where the component renders the full `nodes` and `flows` graph and derives node state from history, tasks, and the current instance.

**Tech Stack:** Vue 3 `<script setup>`, Element Plus, existing workflow API helpers, Vitest source-contract tests.

---

### Task 1: Contract Test

**Files:**
- Modify: `nest-admin-frontend/src/components/workflow/WorkflowApprovalPanel.spec.ts`

- [ ] **Step 1: Write the failing test**

Update the progress test to require a complete flow diagram:

```ts
expect(progressSource).toContain('workflow-progress-diagram')
expect(progressSource).toContain('workflow-progress-node--current')
expect(progressSource).toContain('workflow-progress-node--completed')
expect(progressSource).toContain('workflow-progress-flow')
expect(progressSource).not.toContain('workflow-progress-line')
```

Add a context-loading assertion:

```ts
expect(source).toContain('getWorkflowInstanceDefinition')
expect(source).toContain('instanceDefinition')
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:unit -- src/components/workflow/WorkflowApprovalPanel.spec.ts`

Expected: FAIL because `WorkflowProgressView` still uses the vertical step list and `WorkflowApprovalPanel` does not load instance definition.

### Task 2: Data Wiring

**Files:**
- Modify: `nest-admin-frontend/src/components/workflow/WorkflowApprovalPanel.vue`
- Modify: `nest-admin-frontend/src/views/business/workflow/instances.vue`

- [ ] **Step 1: Load instance definition**

In both callers, call `getWorkflowInstanceDefinition(instanceId)` with the existing detail context calls, store it as `instanceDefinition`, and pass it to `WorkflowProgressView`.

- [ ] **Step 2: Pass history list**

Pass `history-list` into `WorkflowProgressView` so visited nodes can be derived from actual execution records.

### Task 3: Flow Diagram Component

**Files:**
- Modify: `nest-admin-frontend/src/components/workflow/WorkflowProgressView.vue`

- [ ] **Step 1: Replace vertical progress line**

Render `definition.nodes` and `definition.flows` as an SVG-backed graph.

- [ ] **Step 2: Derive states**

Mark nodes as current when their id matches `instanceInfo.currentNodeId`, current pending task `nodeId`, or `nodeName`; mark completed when present in history or completed tasks.

- [ ] **Step 3: Preserve overview**

Keep business title, business code, starter, instance status, and current node in the existing descriptions block.

### Task 4: Verification

**Files:**
- Test: `nest-admin-frontend/src/components/workflow/WorkflowApprovalPanel.spec.ts`

- [ ] **Step 1: Run focused frontend test**

Run: `npm run test:unit -- src/components/workflow/WorkflowApprovalPanel.spec.ts`

Expected: PASS.

- [ ] **Step 2: Run frontend type check**

Run: `npm run type-check`

Expected: PASS.
