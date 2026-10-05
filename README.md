# Frontier Model Efficiency Map

A static, interactive comparison of current frontier LLMs across **capability × reasoning effort × task cost × subscription plan**.

**Live site:** https://blackkcold.github.io/frontier-model-efficiency-map/

**Data snapshot:** 2026-10-05

## Providers / model families

- OpenAI — GPT-6 Luna, GPT-6 Sol (deprecated, optional), GPT-6.1 Sol, GPT-6 Astra
- Anthropic — Claude Sonnet 5.5, Claude Opus 5.5, Claude Fable 5.1
- Google — Gemini 3.8 Flash, Gemini 4 Argon (limited rollout)
- DeepSeek — DeepSeek V4.1 Flash
- Z.ai — GLM-5.3, GLM-5.3 Flash
- Kimi — Kimi K3

## Methodology

### Capability

The primary Y-axis uses the current **Artificial Analysis Intelligence Index v4.3.2** for cross-provider comparability. The default display normalizes it as:

`normalized capability = AA Intelligence Index / 58 × 100`

58 is the highest measured point in this snapshot (Claude Opus 5.5 Max).

### Consumption

Cross-vendor subscription allowances are not directly comparable. The primary X-axis therefore uses **Artificial Analysis Cost per Intelligence Index Task**, which incorporates input, cache, reasoning and answer token costs over the same evaluation suite.

Default normalized consumption:

`consumption ratio = corrected task cost / corrected GPT-6 Luna Max task cost`

GPT-6 Luna Max remains exactly **1.0×**.

Optional long-agent correction, intended as a user-experience/session-burn overlay rather than an official billing multiplier:

- Low: 1.00×
- Medium: 1.00×
- High: 1.05×
- XHigh: 1.10×
- Max: 1.18×

AA's task cost already includes measured reasoning-token use, so this correction is intentionally optional.

### Estimated points

Cross-shaped hollow points are estimates only. They are used when:
1. the provider officially exposes the reasoning tier; and
2. current AA v4.3.2 has measured endpoints but not that intermediate tier/cost.

Current estimated points:
- Gemini 3.8 Flash Low cost only
- DeepSeek V4.1 Flash Low / High
- GLM-5.3 High
- Kimi K3 High

They can be hidden in the UI.

## Recommendation rule

The **frontier value** recommendation first applies a capability floor (AA Index ≥48, ~83% of the global leader in this snapshot), then selects the lowest measured task cost. This avoids the common error of calling an ultra-cheap but materially weaker model the “best value” merely because its denominator is tiny.

Result for this snapshot: **GPT-6.1 Sol Medium**.

## October 2026 model-status notes

- **Claude Fable 5.1** is generally available. Anthropic kept standard token pricing at $10/M input and $50/M output while cutting cache reads to $0.25/M. Artificial Analysis currently places Fable 5.1 Max at 53 on the Intelligence Index; it is included as a measured frontier point.
- **Claude Mythos 5.1** shares the same underlying model as Fable 5.1 but is restricted to vetted cyberdefense/life-sciences programs, so it is not plotted as a generally selectable consumer/API model.
- **Gemini 4 Argon** was announced September 30 and is rolling out to selected users. Artificial Analysis measures High at 53 and $1.99 per Intelligence Index task under introductory pricing. It is included with a limited-rollout status rather than treated as broadly available.

## GitHub Pages

**Live:** https://blackkcold.github.io/frontier-model-efficiency-map/

A Pages workflow is included at `.github/workflows/pages.yml`.

1. Create a public repository.
2. Push these files to `main`.
3. In **Settings → Pages**, select **GitHub Actions** as the source if GitHub does not enable it automatically.
4. Push/dispatch the workflow.

## Sources

Source links are listed in the site's **Methodology & Sources** section and in `data.js`. Official provider documentation is used for model/effort availability and subscription plans; Artificial Analysis is used for the unified cross-provider capability/cost measurements.

## Notes

- Plan limits and promotions change frequently; verify checkout pages before purchase.
- GPT-6 Sol is retained as a historical comparison point but is hidden by default because GPT-6.1 Sol supersedes it.
- This project has no analytics or tracking.

## Repository governance

The repository includes:

- MIT license (`LICENSE`)
- CODEOWNERS with `@blackkcold` as the default owner
- Pull-request checklist
- Read-only PR validation workflow (`Static validation`)
- GitHub Pages deployment workflow
- `SECURITY.md` and `CONTRIBUTING.md`

Recommended `main` ruleset:

- require pull requests before merging;
- require 1 approval;
- dismiss stale approvals after new commits;
- require CODEOWNER review;
- require all conversations to be resolved;
- require the `Static validation` status check;
- require the branch to be up to date before merge;
- block force pushes and branch deletion;
- apply the rules to administrators as well.

For merge policy, **Squash merge** is recommended for this small data-and-static-site repository, with merge commits disabled to keep history linear.
