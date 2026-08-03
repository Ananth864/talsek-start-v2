# Side-by-side checklist — Applicant apply + interview

Manual companion to `applicant-apply-interview.spec.ts` (ADR-0030 §5). Compare
the port (`localhost:3000`) against source `talsek` (`localhost:5173`) at
~1280px desktop.

## Apply (`/apply/:token`)

- [ ] Company H1 + Open/Expired badge; job title as H2
- [ ] Job Description trigger with “Click to expand” / “Click to collapse”
- [ ] Form Card: name, email, phone, resume (PDF only. Max size: 1024 KB.)
- [ ] Full-width primary “Submit Application”; incomplete hint when incomplete
- [ ] Footer: “Made with” + Talsek logo + “Talsek”
- [ ] Success: email-updates wording (not a separate paint check)

## Interview welcome (`/interview/:token`)

- [ ] Full-page muted shell; “Talsek Interview” title + invite copy
- [ ] “How this works:” numbered list (4 steps)
- [ ] “Microphone Check” card; Begin gated on mic (“Begin Interview” /
      “Microphone Required”)

## Interview stage

- [ ] Fixed full-viewport dark chat shell
- [ ] Header: Bot icon + “Talsek Interview” + progress fraction (`n/denom`) + bar
- [ ] Conversation Bot/User bubbles for history + current voice Q
- [ ] Voice chrome: visualizer + circular mic/stop + timer (theme tokens; not source glass paint)
- [ ] Manual / boolean / display nest question in bot bubbles; Title Case CTAs
      (“Submit Answer”, “Complete Interview”)

## Interview completion

- [ ] “Interview Complete!” + next-steps callout + “Close Interview”

## Out of scope this ticket

- Pixel paint / glassmorphism tokens (ADR-0030 paint relaxed)
- Full mobile redesign (smoke only if shell clearly breaks)
- Behavioural capability (covered by apply-by-token / interview-by-token)
