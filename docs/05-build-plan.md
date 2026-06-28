# Build Plan

## Phase 0: Planning (current)

- [x] Product vision
- [x] UI design direction
- [x] Demo flow
- [x] Tech stack
- [x] Fernando call prep notes
- [x] Initialize Tauri project

## Phase 1: Shell and design system (Day 1)

- [x] `cargo create-tauri-app` or equivalent scaffold
- [x] Full-window background with theme switcher
- [x] Glass panel component system
- [x] Left tool rail with 6 tools
- [x] Bottom command bar
- [x] ⌘K command palette (cmdk)
- [x] Top workspace pill

**Exit criteria:** App opens, looks premium, commands parse but return stub responses.

## Phase 2: Canvas and fixtures (Day 2)

- [x] React Flow canvas with custom node types
- [x] Demo fixture: Scenario A (pt-BR grooming cluster)
- [x] Demo fixture: Scenario B (cross-platform link)
- [x] Scan command loads fixture into canvas
- [x] Correlate command expands graph from selected node
- [x] Intel strip shows OSINT-style metadata

**Exit criteria:** Full graph demo works offline with fixture data.

## Phase 3: Risk review and brief (Day 3)

- [x] Risk Review panel with structured sections
- [x] LLM or rules-based summary from fixture context
- [x] Always show "Human review required"
- [x] Brief preview modal
- [x] PDF export (local file)
- [x] Portuguese strings on demo path

**Exit criteria:** 60-second demo script runs end to end.

## Phase 4: Polish for Fernando call (Day 4, optional)

- [ ] Outrun theme
- [ ] Loading states and micro-animations
- [ ] App icon and window title
- [ ] 2-minute recorded walkthrough
- [ ] One-page PDF leave-behind for NGO

## Phase 5: Live integrations (post-demo)

- [ ] Real OSINT API adapters
- [ ] Watchlist scheduler
- [ ] SQLite audit log
- [ ] Brazil compliance review with local partner
- [ ] Consortium proposal draft for open call

## Wednesday call checklist

- [ ] App builds and opens on Mac
- [ ] Scenario A runs without manual fixes
- [ ] Brief exports successfully
- [ ] Talking points memorized (see demo-flow.md)
- [ ] Honest scope statement ready: v1 is review console, not certified child-safety product

## Risk register

| Risk | Mitigation |
|------|------------|
| Overclaiming child-safety certification | Always label as institutional review tool |
| Demo looks like Feynman reskin | Standalone brand, canvas-first UI, no Feynman chrome |
| Live OSINT fails in demo | Fixture-first architecture |
| Scope creep into parental app | Stick to NGO/CSO review workflow in v1 |
