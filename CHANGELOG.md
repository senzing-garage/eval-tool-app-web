# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
[markdownlint](https://dlaa.me/markdownlint/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-02-27

### Added

- **Data source management** — File import with drag-and-drop, JSONL/JSON/CSV parsing,
  inline data source name editing, confirmation dialogs for existing data sources,
  and mapping help dialog
- **Overview / Statistics** — Summary statistics on data source cards, cross-source
  venn diagrams, sample review table with cross-source results
- **How Report** — Entity resolution "How" report page with step navigation
- **Why Report** — Why record and why entities dialogs (gRPC)
- **Settings page** — Preferences form for all `SzPrefsService` options with
  hidden sections/preferences support and identifier type picker
- **Graph improvements** — Link labels, edge expansion, filter persistence,
  tooltip opacity fixes, data source color support
- **Search** — Identifier picker dialog, search history, entity ID click
  navigation from cross-source results
- **Docker support** — Dockerfile with multi-stage build, runtime configuration
  via environment variables (`SENZING_GRPC_CONNECTION_STRING`,
  `SENZING_WEB_SERVER_STATS_BASE_PATH`, etc.), CSP with dynamic inline script
  hashing, health check endpoint
- **E2E testing** — Playwright test suite with dev and CI configurations,
  truthset import setup project, page render smoke tests, feature tests for
  datasources, entity detail, graph, and cross-source review
- **CI workflows** — GitHub Actions for build validation and E2E testing with
  Dependabot for GitHub Actions, Docker, and npm

### Changed

- Replaced vendored `sz-sdk-typescript-grpc-web` tarball with git submodule,
  enabling direct builds from source
- Updated `sz-sdk-typescript-grpc` submodule to latest main with ESM web build
  fixes (named exports, `.js` extension resolution)
- Replaced REST API-based data flow with gRPC-web for entity search, graph
  queries, config management, and record loading
- Updated Dockerfile to build grpc-web package from submodule instead of
  `packages/` directory
- Centralized excluded data sources (TEST, SEARCH) with filtering across
  UI components
- Migrated unit tests from Karma/Jasmine to Jest using Angular's built-in
  `@angular-devkit/build-angular:jest` builder, fixing CI timeouts caused
  by Karma's watch mode

### Removed

- **Admin authentication** — Removed authserver, JWT/SSO guards, token
  interceptors, `AdminAuthService`, `AuthGuardService`, `oAuthInterceptor`,
  `AdminBulkDataService`, and auth config factory. The eval tool is a
  single-user application and does not require authentication.
- **Websocket streaming** — Removed `POCStreamConfig`, stream connection
  properties, `SzAdminPrefs`, `AdminStreamConnProperties`,
  `AdminStreamAnalysisConfig`, `AdminStreamLoadConfig`, streaming detection
  in runtime datastore, and settings UI for streaming preferences.
  Record loading now uses gRPC exclusively. The `SzStreamingFileRecordParser`
  has been moved to `deprecated/` for reference.
- Removed `express-basic-auth`, `express-jwt`, `jsonwebtoken` dependencies
- Removed Karma and Jasmine dependencies (`karma`, `karma-chrome-launcher`,
  `karma-coverage`, `karma-jasmine`, `karma-jasmine-html-reporter`,
  `jasmine-core`, `@types/jasmine`)

### Fixed

- Subscription memory leaks — added `takeUntil` cleanup to route params,
  service observables, and dialog subscriptions across `HowComponent`,
  `DetailComponent`, `GraphComponent`, `AppDataSourcesComponent`, and
  `AppDataFilesComponent`
- Removed leaked debug `search.results` subscription in `GraphComponent`
- `onDoubleClick` in data source collection now checks actual card state
  (`resolved`, `mappingComplete`, `mappingLearned`) instead of hardcoded `false`
- `onLoadDataSource` null dereference when `_uploadedFiles` is undefined
- Dead duplicate `if/else` branches collapsed in `processRecords`
- Removed dead `handleNewFromDrive` method and unused variables in
  `onDeleteDataSources`
- Removed unused `SzDataSourcesService` injection in data source card component
- `env.destroy()` calls removed — `SzGrpcEnvironment` has no destroy method
- gRPC readiness check in CI workflow replaced bogus HTTP `/health` poll with
  TCP port probe (container has no health endpoint)
- Donut chart data source labels now navigate to `/review/{datasource}` on click
- SCSS and template deprecation warnings for Angular 19
- Graph link labels blank due to matchKey casing mismatch (gRPC UPPER_CASE
  vs REST camelCase)
- Adaptive polling for product/license gRPC requests
- Cross-source row count and matchKey column key fixes
- Empty line filtering when parsing JSONL files
- Data source card status not updating after records loaded
- Express/proxy middleware breaking changes
