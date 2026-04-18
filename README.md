# Finance Bro Type Indicator (FBTI)

A satirical personality test distilled from content analysis of 670 finance-industry satire videos.

[中文版](./README.zh-CN.md)

## Background

Raw material mined from the 670-video corpus:
- 14 high-frequency finance memes (degree-ranking snobbery, interview PUA, "accounting 2.5k legend", Schrödinger-grade certificates, trend-chasers...)
- 12 independent personality dimensions (cognitive / behavioral / social)
- 17 primary stereotypes + 2 special easter-egg archetypes
- High-frequency linguistic tells (Chinese-English code-switching, corporate-speak, brand flex, "how long to earn 100 bucks")

All condensed into an interactive quiz with trading mechanics and a share poster.

## Highlights

- **21 scenario questions + 1 identity anchor + 1 easter egg**
- **12-axis radar** painting your cognitive / behavioral / social profile
- **Data-driven thresholds** — level cutoffs recomputed from the live question bank; Shannon evenness ≈ 93% over 50k random runs
- **K-line + position trading** — drag a continuous 0–100% slider (step 10%) per question; one trade per day, locked on commit, immune to back-navigation
- **Real P&L settlement** shown on the result page and embedded in the share poster
- **Easter-egg supplement** — trigger the egg question and it *adds* a hidden-file paragraph to File 03 without overriding your actual personality

## Tech Stack

- Vite 6 + vanilla JavaScript (no framework)
- Canvas for radar / K-line / share poster
- Firebase Firestore for result archiving (rules in `firestore.rules`, create-only)

## Project Structure

```
finance-bro-type-indicator/
├── data/
│   ├── config.json               # Runtime config (thresholds / egg flags / copy)
│   ├── dimensions.json           # 12 dimensions + L/M/H behavior anchors
│   ├── questions.json            # 1 identity + 21 main + 1 easter
│   ├── types.json                # 17 standard + 2 special archetypes
│   └── interpretations/          # cognitive / behavioral / social readings
├── src/
│   ├── main.js                   # entry + quiz flow + trading panel
│   ├── engine.js                 # scoring + threshold computation + matching
│   ├── quiz.js                   # quiz state machine (answer / finalize split)
│   ├── portfolio.js              # position account (pure, rebuild-able)
│   ├── validate.js               # startup schema validation
│   ├── history.js                # local history
│   ├── modal.js                  # back-nav confirmation modal
│   ├── result.js                 # result page
│   ├── chart.js                  # 12-axis radar
│   ├── poster.js                 # share poster generator
│   ├── firebaseConfig.js         # Firestore upload
│   ├── utils.js                  # helpers
│   └── style.css                 # styles
├── firestore.rules               # security rules (create-only)
├── firebase.json                 # deploy config
├── .firebaserc                   # project binding
└── index.html                    # entry page
```

## Personality Types

### Standard (17)

| Code | Personality | Subtitle |
|------|-------------|----------|
| POSER | Elite Performer | Walking PPT of Lujiazui |
| SNOOP | Grassroots Deconstructor | Undercover journalist of the finance bubble |
| CRAM | Certificate Collector | Perpetual-motion exam taker |
| NEPOT | Nepotism Harvester | Resource-arbitrage master |
| CLOSER | Deal Slayer | Banquet-table terminator |
| GRINDER | Workaholic Warrior | 4am Lujiazui lamp |
| QUANT | Finance-Mind Invader | Everything-is-valuation type |
| BEAN | Accounting Scapegoat | Reserve inmate of Tilanqiao Prison |
| BUTTERFLY | Social Network Harvester | Coffee-chat professional |
| HOPPER | Job-Hopping Arbitrageur | Textbook early-stopper |
| FLEX | Wealth Flex Artist | Nine-grid Bloomberg terminal |
| SLACKER | Chill Philosopher | SOE clock-out purist |
| FOMO | Anxiety Accelerator | Perpetual inner race |
| PUFFER | Resume Plastic Surgeon | Million-user-survey fabricator |
| ROO | Overseas Degree Defender | QS Top-50 gatekeeper / Kangaroo Warrior |
| SNEAK | Corporate Lurker | Loophole harvester |
| TREND | Track Disciple | Industrial-policy collector / pivot addict |

### Special (2)

| Code | Personality | Trigger |
|------|-------------|---------|
| NPC | Finance NPC | Fallback when 12-axis similarity < 45% |
| CHOSEN | Chosen Nepotist | Easter-egg question "family intro" — does **not** override your primary; adds a hidden paragraph to File 03 |

## Trading Rules

- Starting account: ¥30,000. Starting price: ¥50
- Continuous position 0–100%, 10% step (11 discrete stops)
- **One decision per question**: drag the slider before answering; committing the answer locks it in
- On back-nav: slider is disabled and shows the locked position — **navigating back does not change the outcome** (mirrors how the K-line history stays frozen)
- Rebalance math:
  - Scaling up by `Δ` → buy `Δ × 30000` at the day's open
  - Scaling down by `Δ` → sell `|Δ| / prev` of current shares (so "full → 0" is a clean liquidation)
- Candle direction is driven by the attitude of your chosen option (value 1 = bearish bias, value 4 = bullish) plus random volatility, market sentiment, mean reversion and a 5% black-swan kicker

## Data-Driven Thresholds

`engine.js` recomputes each dimension's expected score and standard deviation from the live question bank at startup, then sets L/M/H cutoffs at μ ± 0.6σ. Questions can be rewritten without manually tuning the thresholds — a 50k Monte Carlo run keeps Shannon evenness around 93% across all 17 standard archetypes.

## Getting Started

```bash
# install
npm install

# dev (http://localhost:5173/finance-bro-type-indicator/)
npm run dev

# build
npm run build

# preview production build
npm run preview
```

### Deploy Firestore security rules (one-time)

```bash
npm install -g firebase-tools
firebase login
firebase deploy --only firestore:rules
```

## Acknowledgments

- Upstream: https://github.com/niuniu-869/fiti
- SBTI (prior art): https://github.com/pingfanfan/SBTI

## Disclaimer

Entertainment project only. The archetypes are exaggerated riffs on finance-industry stereotypes and do not constitute investment advice, career guidance, or recruiting criteria.

## License

MIT
