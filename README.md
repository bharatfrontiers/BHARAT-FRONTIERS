# BHARAT FRONTIERS — Final Monthly Publication System

## Publication model

1. **Layout 1 — Homepage:** permanent topic/category structure; current-month headlines, images and stories change monthly.
2. **Layout 2 — Article page:** every homepage story opens a separate page. An article page uses **one relevant photo or no photo**. Related stories are text-only cards.
3. **Monthly E-Paper:** a month-to-date publication that records the important developments covered during the issue period. Older issues remain archived.

## Source-integrity rule

**NO VERIFIED SOURCE = NO PUBLICATION.**

The publication agent must:
- discover or accept candidate sources;
- verify that the final URL is reachable;
- verify that the final domain belongs to an approved/reputable source class;
- retrieve source evidence;
- generate only claims supported by the retrieved evidence;
- attach source markers and a Sources & References section;
- provide a **For More Info** section with direct links to reputed resources;
- block the article when the evidence is insufficient.

The system must never fill gaps with invented facts, numbers, quotations, events, dates or references.

## Monthly editor command

The intended workflow is:

Editor command
→ discover current sources
→ verify sources
→ generate article drafts
→ generate one optional article image
→ build monthly issue material
→ editorial review/edit
→ approve
→ publish

The editor can edit the generated material before publication.

## AI image generation

Workers AI supports text-to-image models such as FLUX.1 schnell. The package includes `functions/api/generate-image.js`. For persistent image storage, configure an R2 bucket with the `MEDIA` binding. Without R2, the endpoint returns a preview data URI only.


## Comments & Queries
- Every published, source-verified article includes a Comments & Queries section.
- No reader login and no e-mail verification are required.
- Name and e-mail are mandatory for submission.
- The e-mail address is stored for editorial response only and is never displayed publicly.
- Readers can choose Comment or Query.
- Submissions enter pending moderation before appearing publicly.
- The Admin area includes a Comments & Queries moderation desk.
- A lightweight honeypot and duplicate-submission cooldown provide basic spam protection.

## Cloudflare

Pages Functions run server-side and can use D1 and Workers AI bindings. Local development is through Wrangler, not `python -m http.server`.

Recommended local command:

`npx wrangler pages dev .`

For local bindings, Wrangler supports D1 and AI flags, e.g. `--d1 DB=<DATABASE_ID> --ai AI`.

## Important

The supplied placeholder D1/R2 IDs must be replaced with real Cloudflare resources before deployment. Do not claim the live AI workflow is active until those bindings have been configured and tested.
