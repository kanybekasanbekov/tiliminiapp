# Open Questions

## tili-product-plan - 2026-02-20

- [ ] Should the existing `korean`/`english` column data be migrated in-place (ALTER TABLE RENAME COLUMN) or should a new table be created and data copied? -- Affects migration complexity and rollback safety
- [ ] What is the founder's preferred LLM model for production translations? Currently using Claude Sonnet (expensive) in bot and Claude Haiku in mini-app. GPT-4o-mini or Gemini Flash would be 10-50x cheaper. -- Directly impacts cost structure
- [ ] Should the tili-core shared package be a proper installable package (pyproject.toml + pip install -e) or just a symlinked/shared directory? -- Affects developer experience and deployment complexity
- [ ] What is the Kyrgyz translation quality threshold? Need native speaker validation before promising Korean-Kyrgyz and English-Kyrgyz pairs. LLMs are weakest on low-resource languages. -- Could delay Phase 2 language pair launches
- [ ] Should free tier users be limited to 1 language pair total, or 1 active pair at a time (can switch but not use multiple simultaneously)? -- Affects how restrictive the free tier feels
- [ ] Is the founder willing to run the @tili_words Telegram channel manually for the first 2-3 months, or should auto-posting be built into Phase 1? -- Affects scope of Phase 1 and growth timeline
- [ ] For Telegram Stars subscriptions, should the bot handle recurring billing automatically (Telegram supports this natively) or should each month require manual renewal? -- Affects payment UX and churn rate
- [ ] Should the Mini App and Bot continue to share a single SQLite database file, or should the Mini App backend become the single source of truth with the bot calling the FastAPI endpoints? -- Architectural decision that affects Phase 1 scope
- [ ] What is the founder's risk tolerance on launch timeline? The plan estimates 6 weeks for MVP -- is there pressure to launch faster (cut scope) or is quality more important? -- Determines which P1 features might slip to Phase 2
- [ ] Should the bot and mini-app have feature parity, or should the mini-app be the primary interface with the bot as a lightweight companion (notifications, quick-add only)? -- Affects development effort allocation
