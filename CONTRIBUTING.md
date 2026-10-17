# Contributing to PredixLab Dashboard

Thank you for contributing. Start with [README](README.md) for the project's
scope, configuration, and operating limitations.

## Before making a change

- Use [GitHub Issues](https://github.com/predixlab/predixlab-webapp/issues) for reproducible bugs and focused proposals.
  Discuss substantial interface, schema, or workflow changes before implementing them.
- Report vulnerabilities privately using [SECURITY.md](SECURITY.md), not a public issue.
- Fork the repository and work on a focused branch. Keep unrelated fixes separate.

## Development setup

Requirements: Node.js 22.12+ and npm.

From the repository root:

```bash
npm ci
```

Follow README for optional services and local configuration. Use tracked examples
only as templates; keep real credentials and environment files outside Git.

## Validation

Run the smallest relevant checks while developing, then run the applicable project checks:

```bash
npm run lint
npm run build
```

There is no separate test script. Check affected routes, light/dark themes, English/Chinese interfaces, keyboard access, and narrow screens. Keep API contracts and account entitlements unchanged.

## Pull requests

CI builds with Node.js 24 and the committed npm lockfile, then uploads the
prebuilt `dist/` directory. Runtime requirements and application dependencies
remain unchanged. Manual workflow dispatch is available for an explicitly
authorized rebuild/deployment.

- Describe the problem, intended behavior, and relevant issue.
- Follow existing project conventions; avoid unrelated refactors and dependency changes.
- Add focused regression tests for behavior changes and update public documentation in English.
- Include the commands run and their results; state any validation that could not run.
- Explain compatibility, data migration, configuration, and deployment consequences.
- Include screenshots for visible UI changes, with no customer or personal information.
- Do not include secrets, private endpoints, customer records, personal paths, or session
  profiles in source, fixtures, screenshots, logs, or generated artifacts. Review commit
  metadata and use a privacy-preserving identity if needed.

Be respectful and constructive. Harassment and disclosure of another person's
private information are not acceptable.

## Licensing

Contributions are submitted under the project's [Apache License 2.0](LICENSE).
Preserve copyright notices, third-party licenses, and source attribution. Do not
submit code, datasets, assets, or model files you do not have permission to share.
