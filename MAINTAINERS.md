# Maintainers

Maintainers review and merge pull requests, triage issues, and cut releases. Every PR into
`main` needs an approving review from a maintainer listed in [`.github/CODEOWNERS`](.github/CODEOWNERS).

| Maintainer | Role |
| --- | --- |
| [@maggit](https://github.com/maggit) | Project owner |

## How reviews work

- `main` is protected. All changes land through pull requests. Nobody pushes to `main` directly.
- A PR needs **one approval from a maintainer** and passing CI (lint, type-check, build).
- Pushing new commits to a PR dismisses earlier approvals, so maintainers re-review what
  actually merges. All review conversations must be resolved before merging.
- PRs are squash-merged, so the PR title becomes the commit message. Keep titles clear.
- The project owner can merge their own PRs without a second review while the project has a
  single maintainer. Once there are others, owners should ask for a review too.

## Adding a maintainer (project owner)

1. On GitHub, go to **Settings → Collaborators → Add people** and invite them with the
   **Write** role (or **Maintain** if they should also manage issues and settings).
2. Open a PR that adds their `@handle` to [`.github/CODEOWNERS`](.github/CODEOWNERS) and to the
   table above. Once it merges, their approval counts toward merging PRs.

To remove a maintainer, reverse both steps.

## Becoming a maintainer

Maintainers are invited based on a track record of thoughtful contributions and reviews. If
you'd like to help maintain Little RSVP, start by reviewing open PRs and helping with issues.
