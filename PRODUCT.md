# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

delegated: Modern Web Application (React / Next.js / TypeScript / Tailwind CSS to be finalized in Phase 3)

## Users

A certification candidate actively studying for the AWS Certified Cloud Practitioner (CLF-C02) exam.
- **Situation:** Preparing systematically on desktop/laptop (primary) and mobile (secondary quick reviews) leading up to a scheduled exam date.
- **Job to be Done:** Simulate the exact AWS CLF-C02 testing pressure, evaluate real readiness, pinpoint domain weaknesses (Cloud Concepts, Security, Technology, Billing), eliminate repeated mistakes, and track confidence over time.

## Product Purpose

CloudPrep exists to be a focused, distraction-free, high-fidelity mock examination and performance analytics platform for AWS CLF-C02. Success means the user knows exactly where they stand against the official blueprint, has practiced under realistic time constraints (65 questions, 90 minutes), and enters the real test center with measurable, data-backed confidence.

## Positioning

Unlike generic flashcard apps or bloated commercial LMSs, CloudPrep is a dedicated, distraction-free assessment instrument:
1. Exact CLF-C02 blueprint domain weighting (24% / 30% / 34% / 12%).
2. Strict test integrity during examination (no instant hints, fixed seed question set, auto-submission on 90-minute expiry).
3. Transparent, rule-based readiness calculation instead of arbitrary AI pass-prediction scores.
4. Information-dense, serious dark-theme ergonomics built for intensive study sessions.

## Operating Context

- **Environment:** Single-user local or personal web deployment; intensive study sessions on desktop/laptop monitors (primary) and on-the-go review on mobile devices.
- **Rituals:** Timed 90-minute mock exam runs; post-exam deep review of mistakes and explanations; periodic dashboard check on countdown and domain mastery.

## Capabilities and Constraints

- **Mock Examination System (V1 Scope):**
  - Strictly focused on full 65-question, 90-minute timed mock exams for authentic assessment realism.
  - Domain-weighted question distribution matching the AWS CLF-C02 blueprint (24% / 30% / 34% / 12%).
  - Single-choice and multiple-choice ("Select TWO" / "Select THREE") support.
  - **Grading Standard:** Strict official AWS all-or-nothing scoring (0 points if any part of a multiple-response question is incorrect or incomplete).
  - Distraction-free exam simulator: top progress & timer bar, question card, flag for review, 65-tile status navigator (Answered, Unanswered, Current, Marked for Review).
  - Robust crash/reload recovery (answers and elapsed time saved continuously).
  - Clean manual submission with unattempted-question warning modal; automatic submission on timer expiry.
- **Results & In-Depth Review:**
  - Granular breakdown: Score %, Raw tally (Correct / Incorrect / Unanswered), Domain performance bars.
  - Comprehensive question review with filters (All, Correct, Incorrect, Unanswered, Flagged).
  - Side-by-side chosen vs correct answers with thorough technical explanations and AWS doc references.
- **Performance & Analytics:**
  - **Readiness Indicator Formula:** Transparent composite calculation:
    $$\text{Readiness Score} = 0.50 \times (\text{Weighted Avg of Last 3 Exams}) + 0.30 \times (\text{Lowest Domain Score}) + 0.20 \times (\text{Question Bank Coverage})$$
  - Exam history progression, average/highest scores, pacing metrics (seconds/question).
  - Domain mastery radar/bars highlighting weakest areas.
  - Question bank coverage indicator (% of unique questions encountered).
  - Dedicated incorrect-question revisit tracking.
- **Question Bank & Settings:**
  - Searchable, filterable question repository categorized by domain, question type, and source.
  - Duplicate detection.
  - Target exam date countdown and data backup/export (JSON).

## Brand Commitments

- **Name:** CloudPrep
- **Aesthetic:** Minimal, professional, high-density study console.
- **Palette:** Refined dark theme (#111318 background, #191D24 surface, #222833 elevated surface, #303744 border, #F1F3F5 text primary, #7C9CFF accent, #45B881 success, #E47777 error, #E5AD55 warning).
- **Typography:** Inter (clean, geometric neo-grotesque with tabular figures for clocks and stats).

## Evidence on Hand

- AWS Certified Cloud Practitioner (CLF-C02) official exam guide & domain weights:
  - Domain 1: Cloud Concepts (24%) ~ 15-16 questions
  - Domain 2: Security and Compliance (30%) ~ 19-20 questions
  - Domain 3: Cloud Technology and Services (34%) ~ 22 questions
  - Domain 4: Billing, Pricing, and Support (12%) ~ 7-8 questions
- Total examination: 65 questions, 90 minutes. Passing scaled score standard: 700 / 1000 (~70-72%).

## Product Principles

1. **Test-Day Realism First:** The exam mode strictly mirrors real exam conditions—no mid-exam hints, realistic question distributions, and authentic pacing pressure.
2. **Zero Distraction, Zero Fluff:** No animations for the sake of decoration, no bloated cards, no gamified badges or confetti. Precision typography, clear borders, and high scannability.
3. **Transparent Truth in Metrics:** No mystical "AI pass prediction". All readiness scores and domain ratings derive from verifiable formulas (recent scores, domain averages, question bank coverage).
4. **Rock-Solid Exam State Integrity:** An accidental browser refresh, tab close, or device sleep must never lose progress or corrupt exam timer state.
5. **Ergonomic Information Density:** Every screen makes optimal use of screen space on laptops and monitors, while gracefully adapting to mobile.

## Accessibility & Inclusion

- WCAG 2.1 AA compliant color contrast on dark surfaces.
- Full keyboard navigation in the examination simulator (Next/Prev question, Flag, Option selection via keys 1-5 or A-E).
- Clear aria labels, distinct focus rings (`#7C9CFF`), and color-blind safe status indicators (icons + color tags).
