# Source tiers for the owner to confirm

D9 asks for a tier on every cited domain. Tiers are this project's judgement, so they
are listed here for you. **Nothing was fetched to decide a tier:** each rests either on
what the host itself proves (a `.go.th` domain, a named university or journal, a named
news site) or, for 15 domains, on inspecting the URL alone. Those 15 are all `commercial`,
and a test fails if any URL-inferred tier is ever promoted.

The tiers are `official` (government or intergovernmental), `research` (university,
institute, journal) and `commercial` (everything else, including news, blogs, retailers,
an inventor's patent claim, and — until checked — a hosting platform). A rate is
*actionable*, allowed to feed the calculator and crop matcher, when at least one source
the page attaches to **that piece of guidance** is not commercial.

## What the tiers currently do

| Crop | Result | Why |
| --- | --- | --- |
| rice (clay soil) | actionable | `TAS 4401-2008` and the Rice Department stand alone in the cell |
| rice (sandy soil) | actionable | `fao` — which hosts TAS 4401-2008 itself, read in full |
| maize | actionable | `doa` and `ricethailand` |
| durian | actionable | `doa` and `doae` |
| cassava | **only the CIAT regional line** is actionable | see below |
| **sugarcane** | not actionable | only `yara`, a manufacturer's product datasheet |
| **mango** | not actionable | only `rakbankerd` |
| **rubber (before tapping)** | not actionable | only `naikham` and `apkgroup` |
| **rubber (tapped)** | not actionable | only `tci-thaijo`, a hosting platform (see below) |
| vegetables | not actionable | no country attribution; the only number is Cambodian survey data |

So five crops are matchable and the rest stay readable as descriptive text. The thinness
is the honest outcome of what the source actually backs, and **T-008 proposes official
replacements** for the gaps.

### Cassava, and why this is decided per line

The cassava cell mixes a Thai rate, a Cambodian note and CIAT regional guidance, and its
only pill (`cgiar +3`) sits beside the CIAT line. The Thai dolomite rate is backed on p5 by
a blogspot page (`nsfcrc-news.blogspot.com`), and the Thai 15-15-15 rate names *Nakhon
Sawan FCRC* and *OAE* with no link. So neither Thai line is actionable. The three hidden
sources behind `cgiar +3` might be those two authorities, but nothing in the document says
so, and I will not infer it. An earlier version resolved sources per row and let both Thai
lines ride on the CIAT pill; a review caught that.

## Calls worth a second opinion

| Domain | Tier given | The question |
| --- | --- | --- |
| `tci-thaijo.org` | **commercial** (was research) | Thai Journals Online hosts thousands of journals of any quality, and this one is `yru_human`, a humanities journal; the p12 cell calls it only a "YRU journal review". It is the sole backing for tapped-rubber's `30-5-18`. Marked `commercial` until someone reads the article. If it is sound, change it to `research` in `tools/source-meta.json` and that rate becomes actionable. |
| `fao.org` | official | **Closed.** Read in full: it is TAS 4401-2008, a Thai government standard, not legislation. `official` is right. |
| `uspto.gov` | commercial | A patent is a government record, but its content is an inventor's claim. Cited only for "slow-release fertilizer does not burn roots" (p5), so nothing depends on this tier. |
| `ku.ac.th` | research | University host. Backs the three lime-equivalence factors and the over-liming warning; none are crop rates, so no crop's status depends on this tier. |
| `phys.org` | commercial | A science news aggregator republishing press releases. Cited for urea ammonia loss, not a rate. |
| `uga.edu` | research | The mobility rule's only **nameable** source. Two more sit behind the `+2` overflow pill and cannot be named. |

## Sources the document names but does not link

Five are recorded without a URL. A name counts only where its cell has **no pill at all**:

| Source | Row | May lift a rate? |
| --- | --- | --- |
| `TAS 4401-2008`, `Rice Department` | rice, clay soil | yes — the cell has no pill |
| `CDRI Working Paper 91` | vegetables | yes, but the row's advice has no country attribution, so it is blocked regardless |
| `Nakhon Sawan FCRC`, `OAE` | cassava | **no** — named beside a pill that belongs to the CIAT line |

## To confirm

For each row above, reply ✅ to keep the tier or give the tier you want. Tiers live in
`tools/source-meta.json`; `content/sources.json` is regenerated from it, and the actionable
flags are checked against the rule on every test run, so a tier change that alters a
crop's status fails loudly until the flag is updated too.
