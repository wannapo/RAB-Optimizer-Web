# RAB Workspace Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the existing RAB optimizer into a clearer, responsive quantity-surveyor workspace and correct the target-budget calculation.

**Architecture:** Keep the current four-step client workflow and API contracts, but introduce a tested budget calculation helper and a shared visual shell around the steps. Restyle each step with project-specific blueprint/ledger patterns, stronger states, and accessible controls without adding runtime dependencies.

**Tech Stack:** Next.js 16.2 App Router, React 19, TypeScript, Tailwind CSS 4, Node.js built-in test runner

## Global Constraints

- Read relevant documentation from `node_modules/next/dist/docs/` before changing Next.js code.
- Preserve the existing XLS/XLSX parsing and Gemini API behavior.
- Do not add a component library or runtime dependency.
- Support desktop and mobile layouts, keyboard focus, and reduced motion.

---

### Task 1: Correct target budget semantics

**Files:**
- Create: `lib/utils/budget.ts`
- Create: `lib/utils/budget.test.ts`
- Modify: `components/BudgetStep.tsx`
- Modify: `app/page.tsx`

**Interfaces:**
- Produces: `calculateSavingsTarget(currentTotal: number, desiredTotal: number): number`
- Consumes: The existing `onContinue(number)` callback, now consistently representing the required saving.

- [ ] **Step 1: Write the failing unit test** for a Rp300M current total and Rp250M desired total, an over-budget target, and an absent target.
- [ ] **Step 2: Run `node --test --experimental-strip-types lib/utils/budget.test.ts`** and verify it fails because `calculateSavingsTarget` does not exist.
- [ ] **Step 3: Implement `calculateSavingsTarget`** as `Math.max(0, currentTotal - desiredTotal)` for positive finite desired totals.
- [ ] **Step 4: Run the unit test again** and verify all cases pass.
- [ ] **Step 5: Update the budget screen and page state** so downstream steps receive the required saving rather than the desired final total.

### Task 2: Build the quantity-surveyor workspace shell

**Files:**
- Modify: `app/layout.tsx`
- Modify: `app/globals.css`
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: Existing step state (`upload`, `budget`, `optimasi`, `hasil`).
- Produces: A responsive application shell, progress navigation, and reusable global utility classes.

- [ ] **Step 1: Define the visual tokens** for blueprint navy, drafting blue, safety orange, paper, ink, grid lines, and type roles.
- [ ] **Step 2: Apply locally optimized Next fonts** in the root layout and update Indonesian metadata.
- [ ] **Step 3: Add the responsive shell and four-stage progress rail** with current/completed states and concise workflow context.
- [ ] **Step 4: Add visible focus states, reduced-motion handling, and mobile breakpoints** in global CSS.

### Task 3: Improve every workflow state

**Files:**
- Modify: `components/UploadStep.tsx`
- Modify: `components/BudgetStep.tsx`
- Modify: `components/OptimizeStep.tsx`
- Modify: `components/ResultStep.tsx`

**Interfaces:**
- Consumes: Existing parse, question, and recommendation endpoints.
- Produces: Clearer upload, budget, optimization, loading, error, empty, and result experiences.

- [ ] **Step 1: Rebuild upload as a labeled drop zone** with selected-file feedback, format guidance, and an explicit processing state.
- [ ] **Step 2: Rebuild budget entry as a project snapshot** with formatted input, required-saving preview, and invalid-target guidance.
- [ ] **Step 3: Rebuild optimization cards** with category/status labels, safer non-negative volume input, progress against the saving target, and responsive sticky actions.
- [ ] **Step 4: Rebuild result summaries** with target progress, before/after volume hierarchy, and clearer next actions.
- [ ] **Step 5: Add consistent loading and error panels** that explain what is happening and what the user can do next.

### Task 4: Verify the refresh

**Files:**
- Modify: Any touched file only if verification reveals an issue.

**Interfaces:**
- Consumes: Completed implementation.
- Produces: A lint-clean, test-passing, production-buildable application.

- [ ] **Step 1: Run `node --test --experimental-strip-types lib/utils/budget.test.ts`** and verify all tests pass.
- [ ] **Step 2: Run `npm run lint`** and resolve all errors and warnings introduced by this work.
- [ ] **Step 3: Run `npm run build`** and resolve any Next.js 16 or TypeScript failures.
- [ ] **Step 4: Review the rendered page at desktop and mobile widths** if a local browser capture is available; otherwise inspect responsive class behavior directly.
