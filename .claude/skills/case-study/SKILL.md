---
name: case-study
description: How a project case study (Problem → Approach → Impact) is built in Raj's portfolio from the project's existing bullets, and the rule for impact numbers. Use when adding or editing a `caseStudy` on a project or changing the case-study view.
---

# Case studies

Data: `caseStudy` on a project in `src/data/portfolio.ts`:

```ts
caseStudy?: { problem: string[]; approach: string[]; impact: string[]; impactNote?: string };
```

## Building one

- **Reuse, never write.** Every string is an existing bullet of *that* project, or a
  verbatim fragment of one of its bullets or its descriptor. No new claims, no
  paraphrase, no merging two bullets into one sentence.
- Sort each source line into the section it honestly belongs to: the need or pain
  (problem), what was built and how (approach), measured or observed result (impact).
- **No honest source text → leave the section empty.** The UI hides empty sections.
- **Impact numbers** only if they already appear in that project's content (e.g. TBDOS
  "tested over 1,370 real operating hours"). Never estimate, round or derive one.
- Missing outcomes go in `impactNote: "TODO_<ID>_IMPACT"`. A `TODO_` value is never
  printed; list it as an open item for Raj.

## Where it shows

Projects app "Case study" tab, Quick View (print-safe), deep link
`/?open=projects&id=<id>&view=case`, Spotlight, and the assistant's knowledge text.
`check:content` must still pass.
