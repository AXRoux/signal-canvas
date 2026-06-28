# Demo Flow

## Audience

- Fernando Pacheco (Shiva mentor)
- CSO/NGO contact (Friday pre-call)
- Wednesday discovery call with Fernando

## Goal

Prove Stratir can build the intelligence layer for child and adolescent digital protection, as a standalone product.

## 60-second live demo

### Setup

Preload demo case: `Adolescent Digital Risk · São Paulo Demo`

Preset watchlist:

- handle: `@demo_user_sp`
- keywords (pt-BR): `manda foto`, `segredo nosso`, `apaga depois`
- platform seeds: Instagram, Telegram, TikTok (mock or live)

### Steps

1. **Open app**
   - Scenic background, glass UI loads
   - Command bar shows: `Try "scan @demo_user_sp for grooming signals in pt-BR"`

2. **Run scan**
   - User hits Enter or clicks Scan tool
   - Left intel strip slides in with OSINT hits
   - Canvas populates nodes: main account, alt account, Telegram link, keyword cluster

3. **Review risk**
   - Right panel fills with Risk Review summary:
     - grooming language indicators (pt-BR)
     - escalation pattern over 72 hours
     - off-platform migration detected
     - confidence: medium
     - human review required

4. **Correlate**
   - User selects a node, runs Correlate
   - Two new linked accounts appear on canvas with dashed edges

5. **Generate brief**
   - Click Brief tool or type `generate brief for NGO review`
   - Modal shows export preview: timeline, signals, linked accounts, reviewer notes
   - Export as PDF or shareable link (demo can be local PDF only)

6. **Close**
   - One-liner: "This is the intelligence layer institutions use before intervention."

## Talking points during demo

- Not a blocking app. A review console.
- Built for NGOs and CSOs, not parents directly.
- OSINT plus monitoring plus brief generation in one focused tool.
- Portuguese-first demo path for Brazil relevance.
- Dark Web experience informs how we think about off-platform harm migration.

## Preset demo scenarios

### Scenario A: Grooming language cluster (pt-BR)

- Input: username + keyword set
- Output: escalation timeline, language indicators, linked accounts

### Scenario B: Cross-platform identity link

- Input: single Instagram handle
- Output: Telegram and secondary account correlation on canvas

## What can be mocked in v1

- OSINT API responses (JSON fixtures)
- risk scoring (LLM or rules-based on fixture data)
- brief PDF export (real)
- watchlist scheduling (UI only, no cron)

## What should feel real in v1

- UI polish and glass design
- canvas graph interaction
- command bar and ⌘K palette
- risk panel copy quality
- brief export formatting
