# Renovate issue 19503 fixtures (work in progress)

These fixtures investigate [renovatebot/renovate#19503](https://github.com/renovatebot/renovate/issues/19503): references in release notes should resolve to each dependency's source repository, not the consuming repository or a guessed GitHub repository.

| Fixture | npm dependency | Starting → target | Upstream evidence |
| --- | --- | --- | --- |
| GitHub | `ky` | 1.0.1 → 1.1.0 | [GitHub release](https://github.com/sindresorhus/ky/releases/tag/v1.1.0), #533 |
| GitLab | `gitlab-ci-env` | 6.3.0 → 6.4.0 | [Tagged GitLab changelog](https://gitlab.com/gitlab-ci-utils/gitlab-ci-env/-/blob/6.4.0/CHANGELOG.md), #67 and #66 |
| Mixed | both above | same | same |

Both target versions and source repositories were verified against npm metadata or upstream release notes. The `allowedVersions` rules cap updates at the target, and the mixed file has an explicit group rule. Automerge is disabled; only npm is enabled. No lockfiles, scripts, workflows, or secrets are required for dependency discovery.

## Expectations

The [original PR](https://github.com/aarongoldenthal/Renovate-GitHub-Issue-Link/pull/11) demonstrates GitLab #67 and #66 linked to `redirect.github.com/gitlab-ci-utils/gitlab-ci-env/issues/...`. Stage 1 should leave those references unlinked; Stage 2 should link them to `https://gitlab.com/gitlab-ci-utils/gitlab-ci-env/-/issues/<number>`. GitHub #533 should link to `https://github.com/sindresorhus/ky/issues/533`, retaining existing formatting. Explicit links should remain intact and mixed sources must not contaminate each other.

## Reproduce and verify

Put these files in a GitHub repository with Renovate installed and enabled. Let Renovate open the three update PRs. The mixed PR should contain both dependencies. Save its raw PR body to a local file (for example, `gh pr view <number> --json body --jq .body > mixed.md`) and run:

```sh
node scripts/validate.mjs stage1 mixed.md
# or, for the proposed Stage 2 implementation:
node scripts/validate.mjs stage2 mixed.md
```

The script checks the specific upstream issue URLs and rejects known GitHub fallbacks; it does not prove full Markdown preservation. Compare the full PR body with the upstream notes manually. Capture bodies for both the baseline and the fix, recording the exact Renovate versions or commits. GitHub and GitLab access and appropriate Renovate credentials are required. This fixture assumes the normal Renovate release-note fetch behavior and does not provide a fix.

For local extraction and lookup, from this directory run `LOG_LEVEL=debug node /path/to/renovate/dist/renovate.js --platform=local --dry-run=full`. Local platform only supports extraction and lookup; it cannot generate PR bodies or create branches. Validate the config using `node /path/to/renovate/dist/config-validator.js --strict --no-global renovate.json`.

To reset, close fixture PRs, restore the pinned package files, and delete the corresponding Renovate branches. Renovate's closed-PR history may prevent recreating identical PRs; use a fresh test repository when necessary.

## Validation and limitations

The local config passed strict repository validation. A local Renovate run discovered three npm files and four dependencies, resolved both pinned targets and their correct source URLs, and assigned the two mixed updates to `renovate/mixed-sources`. It did not generate PR Markdown. The existing upstream PR demonstrates the reported bug, but no new before/after run has been captured, and the assertion script has not been run against a generated mixed PR.

This is incomplete: self-hosted GitLab and unknown hosts need deterministic tests in Renovate's test suite, as do Markdown links, code blocks, escaped references, merge requests, nested namespaces, repeated references and rendering, URL fragments and query parameters, and surrounding Markdown. No real self-hosted GitLab instance has been identified. Stage 2 is an expected contract, not a verified implementation.


## Local patched-code run against the Lab repository

The fixture target is `RenoToothLab/renovate-issue-19503`, branch `main`.
The implementation lives on `fix/19503-release-note-linkification`; do not run the fixture against that branch.
These fixtures are based on `RenoTooth/renovate-issue-19503-fixtures` and the implementation regression tests.

From the patched Renovate checkout, with GitHub credentials available:

```sh
node /path/to/fixtures/scripts/run-local.mjs /path/to/patched/renovate > fixture-run.log 2>&1
```

The repository default branch is main. The runner also forces the base branch and fixture configuration to keep local tests isolated. It scans only fixtures/** and disables inherited presets for this run. Both prefix settings isolate the run from previous fixture branches. The runner defaults to a full dry-run, which may stop before PR rendering when branches do not exist. Pass --write to create or update test branches and PRs on the Lab repository; automerge and stale-branch pruning remain disabled. Validate the mixed body using `scripts/validate.mjs stage1`. The source used must be recorded alongside results; upstream Renovate installations do not automatically use the patched code.


To exercise actual PR-body rendering on the Lab repository:

```sh
node scripts/run-local.mjs /path/to/patched/renovate --write > fixture-run.log 2>&1
```

The hosted Renovate fixture repository under RenoTooth is reference material only; the runner never targets it.
