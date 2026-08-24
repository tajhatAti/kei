# MASTER PROMPT — 100 Telegram Bot Templates (Copy-paste this whole thing to the agent)

## THE ONE RULE THAT MATTERS MOST

**One template = one job.** A template's scope is exactly what its category name says — nothing borrowed from a neighboring category, no matter how "related" it feels.

BAD (what happened last time):
> "Complete channel growth & membership" bot containing referral system + payout/withdrawal + channel management + verified invites all in one file.

Why this is bad: referral/payout belongs to the **Referral & Rewards** category. Channel management belongs to the **Channel Management** category. Someone who wants ONLY a referral bot now has to read through channel-join logic they didn't ask for, and vice versa. Two categories got merged into one confusing product.

GOOD:
- Template A: **"Referral & rewards bot"** — invite links, referral tracking, points/balance, withdrawal requests. Nothing about managing a channel.
- Template B: **"Channel management bot"** — force-join, verified invites, scheduled posts, member approval. Nothing about referral payouts.

If you catch yourself writing "and also handles X" while building category Y, STOP — X is a different template, not a bonus feature of this one.

## STEP 1 — RESEARCH BEFORE BUILDING

Before writing any code, search the web for the most commonly built/requested Telegram bot categories — look at what's actually popular (BotFather showcase, GitHub trending "telegram-bot" repos, r/TelegramBots, freelance job boards like Fiverr/Upwork "telegram bot" gigs, Bengali Telegram dev groups). Compile a list of the top real-world categories people actually search for and build, for example (this is illustrative, not the final list — actually research it):

- Group moderation (anti-spam, anti-flood, captcha, warn/ban)
- Channel management (force-join, scheduled posts, member approval)
- Referral & rewards (invite tracking, points, withdrawal)
- E-commerce / store (catalog, cart, checkout, payment)
- File sharing / storage bot
- Quiz / trivia bot
- Polling / voting bot
- Support / ticketing bot
- Reminder / scheduler bot
- Currency / crypto price tracker
- Weather bot
- URL shortener bot
- QR code generator/reader
- Translation bot
- Music/media downloader (only where legally safe — skip anything that facilitates piracy)
- Attendance / check-in bot
- Feedback / review collector
- Auto-responder / FAQ bot
- Job/vacancy posting bot
- News aggregator bot

Rank by real popularity, pick the top 100, and **group them into clear categories** so nothing gets stuffed into the wrong bucket.

## STEP 2 — DEFINE EACH TEMPLATE BEFORE CODING

For every template, write a one-line scope BEFORE writing code:

> Template name: ___
> Category: ___
> Scope (what it DOES): ___
> Explicitly OUT of scope (what it does NOT do, even if related): ___

The "explicitly out of scope" line is mandatory. It's the line that stops scope-mixing before it starts.

## STEP 3 — BUILD IN BATCHES OF 10, NOT ALL AT ONCE

Do not attempt all 100 in one pass — quality drops. For each batch of 10:

1. List the 10 template names + one-line scopes first, and wait for approval before writing code.
2. Write COMPLETE, working code for each — not a skeleton, not a "# TODO: add rest here". Every template must run standalone.
3. After the batch is done, do a **cross-check pass**: re-read all 10 and confirm none of them borrowed a feature from another template's category. If one did, cut it out.
4. Only then move to the next 10.

## STEP 4 — QUALITY BAR PER TEMPLATE (every single one must have)

- Runs standalone with `python bot.py` (or the RunSpace convention already used in this project) — no missing imports, no placeholder functions.
- Uses the existing RunSpace job conventions of this codebase (same language/runtime options: python, javascript, bash, ruby, php).
- Has a short docstring/comment at the top: what it does, in 2-3 lines — and that description must match the category exactly, nothing extra.
- Reasonable depth WITHIN its scope is good (e.g. a quiz bot can have leaderboards, categories, timed questions — all still "quiz bot" scope) — depth is not scope-mixing, borrowing a different category's core feature is.

## STEP 5 — FINAL SELF-CHECK BEFORE HANDING BACK

Before presenting a batch as done, answer honestly:
- [ ] Does every template's code match its one-line scope exactly?
- [ ] Did I add anything "because it seemed useful" that belongs to a different category?
- [ ] Would someone who wanted ONLY template A be confused or annoyed by unrelated code inside it?

If any answer is "yes" to the last two, fix it before moving on — don't wait for the human to catch it.
