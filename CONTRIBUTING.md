# Contributing

Thanks for helping improve the Frontier Model Efficiency Map.

## Principles

1. Separate measured facts from estimates. Use a single comparable benchmark source for the primary cross-provider axis whenever possible.
2. Label uncertainty. Interpolation, community-derived multipliers and subjective corrections must be visibly marked.
3. Preserve comparability. Do not mix vendor self-reported benchmark scores directly into the primary cross-provider capability axis.
4. Keep the site static and private by default. Do not add analytics, trackers, API keys or user-data collection.

## Pull requests

- Work on a branch and open a PR into `main`.
- Keep one conceptual change per PR when practical.
- Update the data snapshot date when changing model or plan data.
- Include source links for new factual claims.
- Run:

```bash
node --check app.js
node --check data.js
```

The intended `main` policy requires PR review, CODEOWNERS review and the `Static validation` check.